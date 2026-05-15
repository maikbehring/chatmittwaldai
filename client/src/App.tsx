import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getInferencePreset,
  getQwenVisionInference,
  getQwenVisionOcrInference,
  isQwen3Model,
  MODEL_GPT_OSS,
  MODEL_DEVSTRAL,
  MODEL_MINISTRAL,
  type GptOssReasoning,
} from "./modelPresets";
import { ModelSettingsDock } from "./ModelSettingsDock";
import { SettingsGlossaryOverlay } from "./SettingsGlossaryOverlay";
import { ModelsOverviewOverlay } from "./ModelsOverviewOverlay";
import { ChatImageAttachment, ChatImagePreviewThumb } from "./ChatImageAttachment";
import { SpeechInputButton, type SpeechInputHandle } from "./SpeechInputButton";
import { SpeechTranscribingIndicator } from "./SpeechTranscribingIndicator";
import { SpeechWaveform } from "./SpeechWaveform";
import { VoiceRecordingControls } from "./VoiceRecordingControls";
import { ChatMarkdown } from "./ChatMarkdown";
import { ImageLightbox } from "./ImageLightbox";
import { createRafStreamBatcher } from "./streamDeltaBatch";
import { CO2_FOOTPRINT_TOOLTIP, estimateInferenceCo2Grams } from "./inferenceFootprint";
import { GITHUB_NEW_BUG_ISSUE_URL } from "./repoLinks";

const STORAGE_KEY = "mittwald-ai-playground-state-v2";
const LEGACY_STORAGE_KEY = "mittwald-ai-playground-state-v1";
const THEME_STORAGE_KEY = "mittwald-ai-playground-theme";

type ThemePreference = "light" | "dark" | "system";

function readThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

type Role = "system" | "user" | "assistant";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type TokenMeter = {
  promptTokens: number | null;
  completionTokens: number | null;
  outputTokensPerSec: number | null;
  /** Sekunden vom ersten sichtbaren Ausgabe-Token bis Stream-Ende; ohne Ausgabe: vom Request-Start bis Stream-Ende */
  generationSeconds?: number;
  /** Geschätztes CO₂eq (g), siehe inferenceFootprint.ts */
  co2Grams?: number;
  source?: "api" | "heuristic";
};

export type MessageTokenStats = TokenMeter;

export type ChatMessage = {
  role: Exclude<Role, "system">;
  content: string | ContentPart[];
  usage?: TokenMeter;
};

type Persisted = {
  v: 2;
  model: string;
  temperature: number;
  topP: number | null;
  topK: number | null;
  presencePenalty: number | null;
  extraBody: Record<string, unknown> | null;
  gptOssReasoning: GptOssReasoning;
  maxTokens: number | null;
  systemPrompt: string;
  messages: ChatMessage[];
  qwenVisionOcr: boolean;
};

type LegacyPersistedV1 = {
  v: 1;
  model?: string;
  temperature?: number;
  maxTokens?: number | null;
  systemPrompt?: string;
  messages?: ChatMessage[];
};

const DEFAULT_MODEL = MODEL_MINISTRAL;
const DEFAULT_MAX_MESSAGES = 60;

type ApiMessage = { role: Role; content: ChatMessage["content"] };

/** Behält System-Prompts, kürzt den Verlauf auf das Server-Limit. */
function trimMessagesForApi(
  messages: ApiMessage[],
  maxMessages: number,
): { messages: ApiMessage[]; trimmedCount: number } {
  if (messages.length <= maxMessages) return { messages, trimmedCount: 0 };

  const system: ApiMessage[] = [];
  const rest: ApiMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") system.push(m);
    else rest.push(m);
  }

  const budget = Math.max(maxMessages - system.length, 1);
  if (rest.length <= budget) return { messages, trimmedCount: 0 };

  const kept = rest.slice(-budget);
  return {
    messages: [...system, ...kept],
    trimmedCount: rest.length - kept.length,
  };
}

function readJsonKey(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadPersisted(): Partial<Persisted> {
  const cur = readJsonKey(STORAGE_KEY) as Partial<Persisted> | null;
  if (cur && cur.v === 2) return cur;

  const legacy = readJsonKey(LEGACY_STORAGE_KEY) as LegacyPersistedV1 | null;
  if (legacy && legacy.v === 1) {
    const model = legacy.model ?? DEFAULT_MODEL;
    const p = getInferencePreset(model);
    return {
      v: 2,
      model,
      messages: legacy.messages ?? [],
      systemPrompt: legacy.systemPrompt ?? "",
      temperature:
        typeof legacy.temperature === "number" ? legacy.temperature : p.temperature,
      maxTokens:
        legacy.maxTokens === null || typeof legacy.maxTokens === "number"
          ? legacy.maxTokens
          : p.maxTokens,
      topP: typeof p.topP === "number" ? p.topP : null,
      topK: typeof p.topK === "number" ? p.topK : null,
      presencePenalty: typeof p.presencePenalty === "number" ? p.presencePenalty : null,
      extraBody: p.extraBody,
      gptOssReasoning: "medium",
      qwenVisionOcr: false,
    };
  }

  return {};
}

function savePersisted(state: Persisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function encodeImageFile(file: File, maxEdge = 1024, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  bitmap.close();
  return dataUrl;
}

/** Liest ggf. verschachtelte JSON-Fehler (z. B. LLM-API) aus einer Rohtext-Meldung. */
function extractUserFacingApiError(message: string): string {
  const m = message.trim();
  if (!m.startsWith("{")) return message;
  try {
    const o = JSON.parse(m) as {
      error?: { message?: string; type?: string; code?: string };
      message?: string;
    };
    const inner =
      (typeof o.error?.message === "string" && o.error.message) ||
      (typeof o.message === "string" && o.message) ||
      "";
    if (!inner) return message;
    const type = o.error?.type && o.error.type !== "None" ? ` [${o.error.type}]` : "";
    const code = o.error?.code && o.error.code !== "None" ? ` (${String(o.error.code)})` : "";
    return `${inner}${type}${code}`;
  } catch {
    return message;
  }
}

/** Sichtbare Antwort-Token (ohne reasoning_content — der würde die UI blockieren). */
function extractStreamDeltaContent(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const root = json as Record<string, unknown>;
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const ch0 = choices[0];
  if (!ch0 || typeof ch0 !== "object") return "";
  const choice = ch0 as Record<string, unknown>;
  const delta = choice.delta;
  if (delta && typeof delta === "object") {
    const d = delta as Record<string, unknown>;
    const content = d.content;
    if (typeof content === "string" && content.length > 0) return content;
  }
  const text = choice.text;
  if (typeof text === "string" && text.length > 0) return text;
  return "";
}

function assistantPlainTextLength(content: string | ContentPart[]): number {
  if (typeof content === "string") return content.length;
  let n = 0;
  for (const part of content) {
    if (part.type === "text") n += part.text.length;
  }
  return n;
}

async function streamChatCompletion(
  body: Record<string, unknown>,
  onDelta: (t: string) => void,
  signal: AbortSignal,
): Promise<TokenMeter | null> {
  const res = await fetch("/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      msg = j.error?.message ?? msg;
    } catch {
      const t = await res.text();
      msg = t.slice(0, 2000) || msg;
    }
    throw new Error(extractUserFacingApiError(msg));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Keine Antwort vom Server.");

  const decoder = new TextDecoder();
  let buffer = "";
  let lastUsage: TokenMeter | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let lineBreak: number;
    while ((lineBreak = buffer.indexOf("\n")) !== -1) {
      const rawLine = buffer.slice(0, lineBreak);
      buffer = buffer.slice(lineBreak + 1);
      const line = rawLine.replace(/\r$/, "").trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return lastUsage;
      try {
        const streamPayload = JSON.parse(payload) as Record<string, unknown>;
        const rawUsageField = streamPayload.usage;
        if (rawUsageField && typeof rawUsageField === "object") {
          const uo = rawUsageField as Record<string, unknown>;
          const pTok = uo.prompt_tokens;
          const cTok = uo.completion_tokens;
          const promptTokens = typeof pTok === "number" ? pTok : null;
          const completionTokens = typeof cTok === "number" ? cTok : null;
          if (promptTokens !== null || completionTokens !== null) {
            const prevUsage = lastUsage as TokenMeter | null;
            lastUsage = {
              promptTokens: promptTokens ?? prevUsage?.promptTokens ?? null,
              completionTokens: completionTokens ?? prevUsage?.completionTokens ?? null,
              outputTokensPerSec: null,
            };
          }
        }
        const piece = extractStreamDeltaContent(streamPayload);
        if (piece.length > 0) onDelta(piece);
      } catch {
        /* SSE-Zeile ignorieren */
      }
    }
  }
  return lastUsage;
}

function BetaBadge() {
  return (
    <span
      className="shrink-0 rounded border border-amber-500/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-500/50 dark:bg-amber-950/60 dark:text-amber-100"
      title="Öffentliche Beta — Funktion und Modelle können sich ändern."
    >
      Beta
    </span>
  );
}

function UsageStatChip({
  label,
  value,
  title,
  accent,
}: {
  label: string;
  value: string;
  title?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`inline-flex min-w-[5.25rem] flex-col rounded-lg border px-2.5 py-1.5 ${
        accent
          ? "border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40"
          : "border-neutral-200/90 bg-neutral-50/90 dark:border-neutral-700/80 dark:bg-neutral-900/55"
      }`}
      title={title}
    >
      <span className="text-[10px] font-medium leading-none text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span className="mt-1 text-[12px] font-semibold leading-tight tabular-nums text-neutral-800 dark:text-neutral-100">
        {value}
      </span>
    </div>
  );
}

function AssistantTokenFooter({ stats }: { stats: TokenMeter }) {
  const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("de-DE"));
  const tps =
    stats.outputTokensPerSec == null
      ? "—"
      : `${stats.outputTokensPerSec.toLocaleString("de-DE", { maximumFractionDigits: 1 })} tok/s`;
  const gen =
    stats.generationSeconds == null
      ? "—"
      : `${stats.generationSeconds.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;

  const prompt = stats.promptTokens ?? 0;
  const completion = stats.completionTokens ?? 0;
  const total =
    stats.promptTokens != null || stats.completionTokens != null
      ? prompt + completion
      : null;

  const co2Fmt =
    stats.co2Grams == null
      ? null
      : stats.co2Grams.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: stats.co2Grams < 1 ? 3 : 2,
        });

  return (
    <div className="mt-3 max-w-full space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <UsageStatChip label="Eingabe" value={`${fmt(stats.promptTokens)} Token`} />
        <UsageStatChip label="Ausgabe" value={`${fmt(stats.completionTokens)} Token`} />
        {total != null && total > 0 ? (
          <UsageStatChip label="Gesamt" value={`${fmt(total)} Token`} />
        ) : null}
        <UsageStatChip label="Geschwindigkeit" value={tps} />
        <UsageStatChip label="Generierung" value={gen} />
        {co2Fmt != null ? (
          <UsageStatChip
            label="CO₂eq (geschätzt)"
            value={`≈ ${co2Fmt} g`}
            title={CO2_FOOTPRINT_TOOLTIP}
            accent
          />
        ) : null}
      </div>
      {stats.source === "heuristic" ? (
        <p className="text-[10px] leading-snug text-neutral-400 dark:text-neutral-500">
          Token- und CO₂-Werte teilweise geschätzt (API ohne vollständige Nutzungsdaten).
        </p>
      ) : null}
    </div>
  );
}

function renderMessageContent(
  content: string | ContentPart[],
  streaming: boolean,
  onImageOpen: (src: string, alt: string) => void,
) {
  if (typeof content === "string") {
    if (streaming) {
      return (
        <div className="max-w-none whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
          {content}
        </div>
      );
    }
    return <ChatMarkdown>{content}</ChatMarkdown>;
  }
  return (
    <div className="space-y-2">
      {content.map((part, j) =>
        part.type === "text" ? (
          streaming ? (
            <div
              key={j}
              className="max-w-none whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink"
            >
              {part.text}
            </div>
          ) : (
            <ChatMarkdown key={j}>{part.text}</ChatMarkdown>
          )
        ) : (
          <ChatImageAttachment
            key={j}
            src={part.image_url.url}
            alt="Anhang"
            onOpen={onImageOpen}
          />
        ),
      )}
    </div>
  );
}

const ChatMessageRow = memo(function ChatMessageRow({
  message,
  streaming,
  onImageOpen,
}: {
  message: ChatMessage;
  streaming: boolean;
  onImageOpen: (src: string, alt: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(85%,28rem)] rounded-[1.25rem] bg-[#f4f4f4] px-4 py-3 text-[15px] leading-relaxed text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
          {renderMessageContent(message.content, false, onImageOpen)}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="flex max-w-full flex-col items-start">
        <div className="max-w-full text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100">
          {renderMessageContent(message.content, streaming, onImageOpen)}
        </div>
        {message.usage ? <AssistantTokenFooter stats={message.usage} /> : null}
      </div>
    </div>
  );
});

function applyPresetToState(
  modelId: string,
  setters: {
    setTemperature: (n: number) => void;
    setTopP: (n: number | null) => void;
    setTopK: (n: number | null) => void;
    setPresencePenalty: (n: number | null) => void;
    setExtraBody: (b: Record<string, unknown> | null) => void;
    setMaxTokens: (n: number | null) => void;
  },
) {
  const p = getInferencePreset(modelId);
  setters.setTemperature(p.temperature);
  setters.setTopP(typeof p.topP === "number" ? p.topP : null);
  setters.setTopK(typeof p.topK === "number" ? p.topK : null);
  setters.setPresencePenalty(typeof p.presencePenalty === "number" ? p.presencePenalty : null);
  setters.setExtraBody(p.extraBody);
  setters.setMaxTokens(p.maxTokens);
}

export function App() {
  const initial = useMemo(() => loadPersisted(), []);
  const initialModel = initial.model ?? DEFAULT_MODEL;
  const initialPreset = getInferencePreset(initialModel);

  const [title, setTitle] = useState("Mittwald KI-Playground");
  const [maxMessages, setMaxMessages] = useState(DEFAULT_MAX_MESSAGES);
  const [contextTrimNotice, setContextTrimNotice] = useState<string | null>(null);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState<{
    active: boolean;
    stream: MediaStream | null;
  }>({ active: false, stream: null });
  const [speechToText, setSpeechToText] = useState({
    enabled: true,
    model: "whisper-large-v3-turbo",
    language: "de",
    maxAudioBytes: 25 * 1024 * 1024,
  });
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [model, setModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(
    typeof initial.temperature === "number" ? initial.temperature : initialPreset.temperature,
  );
  const [topP, setTopP] = useState<number | null>(
    typeof initial.topP === "number" ? initial.topP : (initialPreset.topP ?? null),
  );
  const [topK, setTopK] = useState<number | null>(
    typeof initial.topK === "number" ? initial.topK : (initialPreset.topK ?? null),
  );
  const [presencePenalty, setPresencePenalty] = useState<number | null>(
    typeof initial.presencePenalty === "number"
      ? initial.presencePenalty
      : (initialPreset.presencePenalty ?? null),
  );
  const [extraBody, setExtraBody] = useState<Record<string, unknown> | null>(
    initial.extraBody && typeof initial.extraBody === "object"
      ? (initial.extraBody as Record<string, unknown>)
      : initialPreset.extraBody,
  );
  const [gptOssReasoning, setGptOssReasoning] = useState<GptOssReasoning>(
    initial.gptOssReasoning === "low" ||
      initial.gptOssReasoning === "medium" ||
      initial.gptOssReasoning === "high"
      ? initial.gptOssReasoning
      : "medium",
  );
  const [qwenVisionOcr, setQwenVisionOcr] = useState(Boolean(initial.qwenVisionOcr));
  const [maxTokens, setMaxTokens] = useState<number | null>(() => {
    if (initial.maxTokens === null) return null;
    if (typeof initial.maxTokens === "number") return initial.maxTokens;
    return initialPreset.maxTokens;
  });
  const [systemPrompt, setSystemPrompt] = useState(() => initial.systemPrompt ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>(() => initial.messages ?? []);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showModelsOverview, setShowModelsOverview] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readThemePreference());
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null);
  const openImageLightbox = useCallback((src: string, alt: string) => {
    setImageLightbox({ src, alt });
  }, []);
  const closeImageLightbox = useCallback(() => setImageLightbox(null), []);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const speechInputRef = useRef<SpeechInputHandle | null>(null);
  const inputValueRef = useRef(input);
  const imageFileRef = useRef(imageFile);
  inputValueRef.current = input;
  imageFileRef.current = imageFile;

  const INPUT_MAX_HEIGHT_PX = 208; // entspricht max-h-52

  const adjustInputHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT_PX);
    el.style.height = `${Math.max(next, 44)}px`;
    el.style.overflowY = el.scrollHeight > INPUT_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);
  const modelRef = useRef(model);
  modelRef.current = model;

  const applyPreset = useCallback((modelId: string) => {
    applyPresetToState(modelId, {
      setTemperature,
      setTopP,
      setTopK,
      setPresencePenalty,
      setExtraBody,
      setMaxTokens,
    });
    if (modelId === MODEL_GPT_OSS) {
      setGptOssReasoning("medium");
    }
    setQwenVisionOcr(false);
  }, []);

  useEffect(() => {
    const sc = chatScrollRef.current;
    if (!sc) return;

    if (messages.length === 0) {
      sc.scrollTop = 0;
      return;
    }

    if (busy) {
      // Während des Streams: sofort ans Ende — kein smooth, sonst kämpft die Animation
      // mit wachsendem Inhalt und der Text „springt“.
      const id = requestAnimationFrame(() => {
        sc.scrollTop = sc.scrollHeight;
      });
      return () => cancelAnimationFrame(id);
    }

    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, busy]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveDark = () =>
      themePreference === "dark" ||
      (themePreference === "system" && mq.matches);

    const apply = () => {
      const isDark = resolveDark();
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    apply();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      /* ignore */
    }

    if (themePreference !== "system") return;

    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [themePreference]);

  useEffect(() => {
    document.title = `${title} · Beta`;
  }, [title]);

  useEffect(() => {
    if (busy) return;
    const state: Persisted = {
      v: 2,
      model,
      temperature,
      topP,
      topK,
      presencePenalty,
      extraBody,
      gptOssReasoning,
      maxTokens,
      systemPrompt,
      messages,
      qwenVisionOcr,
    };
    savePersisted(state);
  }, [
    model,
    temperature,
    topP,
    topK,
    presencePenalty,
    extraBody,
    gptOssReasoning,
    maxTokens,
    systemPrompt,
    messages,
    qwenVisionOcr,
    busy,
  ]);

  useEffect(() => {
    (async () => {
      try {
        const [cfgRes, modRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/models"),
        ]);
        if (cfgRes.ok) {
          const c = (await cfgRes.json()) as {
            title?: string;
            maxMessages?: number;
            speechToText?: {
              enabled?: boolean;
              model?: string;
              language?: string;
              maxAudioBytes?: number;
            };
          };
          if (c.title) setTitle(c.title);
          if (typeof c.maxMessages === "number" && c.maxMessages >= 4) {
            setMaxMessages(c.maxMessages);
          }
          if (c.speechToText) {
            setSpeechToText({
              enabled: c.speechToText.enabled !== false,
              model: c.speechToText.model ?? "whisper-large-v3-turbo",
              language: c.speechToText.language ?? "de",
              maxAudioBytes: c.speechToText.maxAudioBytes ?? 25 * 1024 * 1024,
            });
          }
        }
        if (!modRes.ok) {
          const t = await modRes.text();
          throw new Error(t.slice(0, 400));
        }
        const m = (await modRes.json()) as { data?: { id: string }[] };
        const list = m.data ?? [];
        setModels(list);
        const current = modelRef.current;
        if (list.length && !list.some((x) => x.id === current)) {
          const next = list[0].id;
          applyPreset(next);
          setModel(next);
        }
      } catch (e) {
        console.error(e);
        setModels([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal beim Mount
  }, []);

  useEffect(() => {
    adjustInputHeight();
  }, [input, adjustInputHeight]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const speechTranscribing = speechBusy && !voiceRecording.active;

  const canSend = useMemo(() => {
    const t = input.trim();
    return (
      (t.length > 0 || imageFile !== null) && !busy && !speechBusy && !voiceRecording.active
    );
  }, [input, imageFile, busy, speechBusy, voiceRecording.active]);

  const handleVoiceRecordingChange = useCallback((active: boolean, stream: MediaStream | null) => {
    setVoiceRecording({ active, stream });
  }, []);

  const handleSpeechTranscript = useCallback(
    (text: string) => {
      setInput((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
      window.requestAnimationFrame(() => adjustInputHeight());
    },
    [adjustInputHeight],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    setContextTrimNotice(null);
  }, [stop]);

  const send = useCallback(async (options?: { force?: boolean }) => {
    const textNow = inputValueRef.current.trim();
    const hasContent = textNow.length > 0 || imageFileRef.current !== null;
    if (!options?.force && !canSend) return;
    if (options?.force && (!hasContent || busy || speechBusy)) return;
    setError(null);
    const text = input.trim();
    setInput("");
    const file = imageFile;
    setImageFile(null);

    let userContent: string | ContentPart[];
    if (file) {
      const dataUrl = await encodeImageFile(file);
      const parts: ContentPart[] = [];
      const visionText =
        text.length > 0 ? text : "Beschreibe dieses Bild kurz.";
      parts.push({ type: "text", text: visionText });
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
      userContent = parts;
    } else {
      userContent = text;
    }

    const userMessage: ChatMessage = { role: "user", content: userContent };
    const nextThread = [...messages, userMessage];

    setMessages([...nextThread, { role: "assistant", content: "" }]);
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const hasVision =
      Array.isArray(userContent) &&
      userContent.some((p) => p.type === "image_url");

    let effTemp = temperature;
    let effTopP = topP;
    let effTopK = topK;
    let effPresence = presencePenalty;
    let effMax = maxTokens;
    let effExtra =
      extraBody && Object.keys(extraBody).length > 0 ? { ...extraBody } : null;

    if (hasVision) {
      if (model === MODEL_MINISTRAL || model === MODEL_DEVSTRAL) {
        effTemp = 0.1;
      } else if (isQwen3Model(model)) {
        const qv = qwenVisionOcr ? getQwenVisionOcrInference() : getQwenVisionInference();
        effTemp = qv.temperature;
        effTopP = typeof qv.topP === "number" ? qv.topP : effTopP;
        effTopK = typeof qv.topK === "number" ? qv.topK : effTopK;
        effExtra = qv.extraBody ? { ...qv.extraBody } : effExtra;
        const cap = qv.maxTokens ?? 2048;
        effMax = effMax === null ? cap : Math.min(effMax, cap);
      }
    }

    let apiMessages: ApiMessage[] = [];
    if (model === MODEL_GPT_OSS) {
      const line = `Reasoning: ${gptOssReasoning}`;
      const rest = systemPrompt.trim();
      apiMessages.push({ role: "system", content: rest ? `${line}\n\n${rest}` : line });
    } else if (systemPrompt.trim().length > 0) {
      apiMessages.push({ role: "system", content: systemPrompt.trim() });
    }
    for (const m of nextThread) {
      apiMessages.push(m);
    }

    const { messages: trimmedApiMessages, trimmedCount } = trimMessagesForApi(
      apiMessages,
      maxMessages,
    );
    apiMessages = trimmedApiMessages;
    if (trimmedCount > 0) {
      setContextTrimNotice(
        `Langer Chatverlauf: ${trimmedCount} ältere Nachricht${trimmedCount === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}). „Clear chat“ setzt den Verlauf zurück.`,
      );
    } else {
      setContextTrimNotice(null);
    }

    const body: Record<string, unknown> = {
      model,
      messages: apiMessages,
      temperature: effTemp,
      stream: true,
    };
    if (typeof effTopP === "number") body.top_p = effTopP;
    if (typeof effTopK === "number") body.top_k = effTopK;
    if (typeof effPresence === "number") body.presence_penalty = effPresence;
    if (effMax !== null && effMax > 0) body.max_tokens = effMax;
    if (effExtra && Object.keys(effExtra).length > 0) body.extra_body = effExtra;
    body.stream_options = { include_usage: true };

    const streamStart = performance.now();
    let firstContentAt: number | null = null;

    const appendAssistantDelta = (delta: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const prevText = typeof last.content === "string" ? last.content : "";
        const nextText = prevText + delta;
        if (nextText === prevText) return prev;
        const copy = prev.slice();
        copy[copy.length - 1] = { role: "assistant", content: nextText };
        return copy;
      });
    };

    const deltaBatch = createRafStreamBatcher((chunk) => {
      if (chunk.length > 0) firstContentAt ??= performance.now();
      appendAssistantDelta(chunk);
    });

    try {
      const usageSnap = await streamChatCompletion(
        body,
        (delta) => {
          if (delta.length > 0) deltaBatch.push(delta);
        },
        ctrl.signal,
      );
      deltaBatch.flush();
      const streamEnd = performance.now();
      const genSec =
        firstContentAt != null
          ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
          : Math.max((streamEnd - streamStart) / 1000, 0.001);

      const hasApiCounts =
        usageSnap != null &&
        (usageSnap.promptTokens != null || usageSnap.completionTokens != null);

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const len = assistantPlainTextLength(last.content);
        const roughOutTok = Math.max(1, Math.ceil(len / 4));

        let outputTokensPerSec: number | null = null;
        const comp = usageSnap?.completionTokens;
        if (typeof comp === "number") {
          outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
        } else if (len > 0) {
          outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
        }

        const co2Grams = hasApiCounts
          ? estimateInferenceCo2Grams(
              usageSnap?.promptTokens ?? 0,
              usageSnap?.completionTokens ?? 0,
              model,
            )
          : estimateInferenceCo2Grams(0, roughOutTok, model);

        copy[copy.length - 1] = {
          ...last,
          usage: {
            promptTokens: usageSnap?.promptTokens ?? null,
            completionTokens: usageSnap?.completionTokens ?? null,
            outputTokensPerSec,
            generationSeconds: genSec,
            co2Grams,
            source: hasApiCounts ? "api" : "heuristic",
          },
        };
        return copy;
      });
    } catch (e) {
      deltaBatch.cancel();
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      setError(msg);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [
    canSend,
    input,
    imageFile,
    messages,
    model,
    systemPrompt,
    temperature,
    topP,
    topK,
    presencePenalty,
    extraBody,
    maxTokens,
    gptOssReasoning,
    qwenVisionOcr,
    maxMessages,
    busy,
    speechBusy,
  ]);

  useEffect(() => {
    if (!voiceRecording.active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("[role='dialog']")) return;

      e.preventDefault();
      const hasContent =
        inputValueRef.current.trim().length > 0 || imageFileRef.current !== null;
      speechInputRef.current?.stopRecording({ skipTranscribe: hasContent });
      if (hasContent) {
        void send({ force: true });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [voiceRecording.active, send]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      <aside
        className={`flex shrink-0 flex-col border-r border-neutral-200 bg-[#f9f9f9] transition-[width] duration-200 ease-out dark:border-neutral-800 dark:bg-neutral-900 ${
          sidebarCollapsed ? "w-[52px]" : "w-[260px]"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center gap-1 border-b border-neutral-200/80 px-2 dark:border-neutral-800">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200/80 dark:text-neutral-400 dark:hover:bg-neutral-800"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            aria-label="Sidebar umschalten"
          >
            <span className="text-lg leading-none">≡</span>
          </button>
          {!sidebarCollapsed && (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-sm font-semibold tracking-tight dark:text-neutral-100">{title}</span>
              <BetaBadge />
            </div>
          )}
        </div>

        {!sidebarCollapsed && <div className="min-h-0 flex-1" aria-hidden="true" />}

        {sidebarCollapsed && (
          <div className="mt-2 flex flex-col items-center gap-1 px-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200/80 dark:text-neutral-400 dark:hover:bg-neutral-800"
              onClick={() => setSidebarCollapsed(false)}
              title="Sidebar ausklappen"
            >
              →
            </button>
          </div>
        )}

        <div className="mt-auto shrink-0 space-y-1 border-t border-neutral-200/80 p-2 dark:border-neutral-800">
          {!sidebarCollapsed && (
            <>
              <a
                className="block truncate rounded-md px-2 py-1.5 text-[11px] text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
                href="https://www.mittwald.de/mstudio/ai-hosting"
                target="_blank"
                rel="noreferrer"
              >
                AI Hosting bei mittwald
              </a>
              <a
                className="block truncate rounded-md px-2 py-1.5 text-[11px] text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
                href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/"
                target="_blank"
                rel="noreferrer"
              >
                Developer-Dokumentation
              </a>
              <a
                className="block truncate rounded-md px-2 py-1.5 text-[11px] text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
                href="https://www.mittwald.de/impressum"
                target="_blank"
                rel="noreferrer"
              >
                Impressum (mittwald)
              </a>
              <a
                className="block truncate rounded-md px-2 py-1.5 text-[11px] text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
                href={GITHUB_NEW_BUG_ISSUE_URL}
                target="_blank"
                rel="noreferrer"
              >
                Bug auf GitHub melden
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowGlossary(true)}
            className={`w-full rounded-md py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-neutral-800/70 ${
              sidebarCollapsed ? "px-0" : "px-2 text-left"
            }`}
            title="Begriffe erklärt"
          >
            {sidebarCollapsed ? "?" : "Einfach erklärt"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-neutral-950">
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-2 sm:px-3 dark:border-neutral-800">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label htmlFor="model-select" className="sr-only">
              Modell
            </label>
            <select
              id="model-select"
              className="max-w-full min-w-0 cursor-pointer truncate rounded-lg border border-transparent bg-transparent py-1.5 pl-2 pr-2 text-sm font-semibold text-neutral-900 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-300 dark:text-neutral-100 dark:hover:bg-neutral-800/80 dark:focus-visible:ring-neutral-600 sm:max-w-[min(100%,28rem)]"
              value={model}
              onChange={(e) => {
                const m = e.target.value;
                setModel(m);
                applyPreset(m);
              }}
              disabled={busy}
              title="Modell"
            >
              {models.length === 0 ? (
                <option value={model}>{model}</option>
              ) : (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))
              )}
            </select>
            {sidebarCollapsed ? <BetaBadge /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="theme-select" className="sr-only sm:not-sr-only text-xs text-neutral-500 dark:text-neutral-400">
              Design
            </label>
            <select
              id="theme-select"
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 shadow-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:ring-neutral-600"
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
            >
              <option value="system">System</option>
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
            </select>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center px-6 pb-40">
                <h1 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl dark:text-neutral-100">
                  Bereit loszulegen?
                </h1>
                <p className="mt-3 max-w-md text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Stelle eine Frage oder nutze + für ein Bild. Nur in diesem Browser gespeichert.
                </p>
                <p className="mt-5 max-w-md text-center text-xs text-neutral-500 dark:text-neutral-400">
                  <a
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                    href="https://www.mittwald.de/mstudio/ai-hosting"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AI Hosting
                  </a>
                  <span className="text-neutral-300 dark:text-neutral-600"> · </span>
                  <a
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                    href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Developer-Dokumentation
                  </a>
                  <span className="text-neutral-300 dark:text-neutral-600"> · </span>
                  <button
                    type="button"
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                    onClick={() => setShowModelsOverview(true)}
                  >
                    Modellübersicht
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-600"> · </span>
                  <a
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                    href="https://www.mittwald.de/impressum"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Impressum
                  </a>
                  <span className="text-neutral-300 dark:text-neutral-600"> · </span>
                  <a
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                    href={GITHUB_NEW_BUG_ISSUE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Bug melden
                  </a>
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
                {messages.map((m, i) => (
                  <ChatMessageRow
                    key={i}
                    message={m}
                    streaming={busy && m.role === "assistant" && i === messages.length - 1}
                    onImageOpen={openImageLightbox}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-transparent bg-gradient-to-t from-white via-white to-transparent px-4 pb-3 pt-2 dark:from-neutral-950 dark:via-neutral-950 dark:to-transparent">
            {contextTrimNotice && (
              <div
                className="mx-auto mb-2 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                role="status"
              >
                {contextTrimNotice}
              </div>
            )}
            {error && (
              <div
                className="mx-auto mb-2 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {error}
              </div>
            )}
            {imagePreview && (
              <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <ChatImagePreviewThumb src={imagePreview} onOpen={openImageLightbox} />
                <button type="button" className="underline" onClick={() => setImageFile(null)} disabled={busy}>
                  Bild entfernen
                </button>
              </div>
            )}
            <div className="mx-auto flex max-w-3xl items-end gap-1.5">
              <ModelSettingsDock
                open={showModelSettings}
                onOpenChange={setShowModelSettings}
                busy={busy}
                modelId={model}
                onReapplyPreset={() => applyPreset(model)}
                temperature={temperature}
                setTemperature={setTemperature}
                topP={topP}
                setTopP={setTopP}
                topK={topK}
                setTopK={setTopK}
                presencePenalty={presencePenalty}
                setPresencePenalty={setPresencePenalty}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                extraBody={extraBody}
                setExtraBody={setExtraBody}
                gptOssReasoning={gptOssReasoning}
                setGptOssReasoning={setGptOssReasoning}
                qwenVisionOcr={qwenVisionOcr}
                setQwenVisionOcr={setQwenVisionOcr}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`flex gap-2 rounded-[28px] border border-neutral-200 bg-white py-2 pl-2 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_2px_16px_rgba(0,0,0,0.35)] ${
                    voiceRecording.active ? "items-center" : "items-end"
                  }`}
                >
                  <label
                    className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 ${
                      voiceRecording.active || speechTranscribing
                        ? "pointer-events-none opacity-40"
                        : ""
                    }`}
                  >
                    <span className="text-xl font-light leading-none">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        setImageFile(f ?? null);
                      }}
                    />
                  </label>
                  {voiceRecording.active ? (
                    <SpeechWaveform stream={voiceRecording.stream} />
                  ) : speechTranscribing ? (
                    <SpeechTranscribingIndicator />
                  ) : (
                    <textarea
                      ref={inputRef}
                      className="min-h-[44px] max-h-52 flex-1 resize-none overflow-hidden bg-transparent py-2.5 text-[15px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      rows={1}
                      placeholder="Stelle irgendeine Frage"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={busy || speechBusy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                    />
                  )}
                  <div className="flex shrink-0 items-center gap-1 pb-0.5">
                    {speechToText?.enabled ? (
                      <SpeechInputButton
                        ref={speechInputRef}
                        disabled={busy}
                        language={speechToText.language}
                        maxAudioBytes={speechToText.maxAudioBytes}
                        onTranscript={handleSpeechTranscript}
                        onError={setError}
                        onBusyChange={setSpeechBusy}
                        onRecordingChange={handleVoiceRecordingChange}
                        className={voiceRecording.active ? "sr-only" : undefined}
                      />
                    ) : null}
                    {voiceRecording.active ? (
                      <VoiceRecordingControls
                        disabled={busy}
                        onCancel={() =>
                          speechInputRef.current?.stopRecording({ skipTranscribe: true })
                        }
                        onConfirm={() => speechInputRef.current?.stopRecording()}
                      />
                    ) : busy ? (
                      <button
                        type="button"
                        onClick={stop}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        title="Stoppen"
                      >
                        ■
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void send()}
                        disabled={!canSend}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        title="Senden"
                      >
                        <span className="text-sm">↑</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearChat}
                disabled={busy || speechBusy || voiceRecording.active || messages.length === 0}
                className="mb-1 shrink-0 self-end rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm outline-none hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                title="Clear conversation"
              >
                Clear chat
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl px-2 text-center text-[10px] leading-relaxed text-neutral-400 dark:text-neutral-500">
              <a
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                href="https://www.mittwald.de/mstudio/ai-hosting"
                target="_blank"
                rel="noreferrer"
              >
                AI Hosting
              </a>
              {" · "}
              <a
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/"
                target="_blank"
                rel="noreferrer"
              >
                Doku
              </a>
              {" · "}
              <button
                type="button"
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                onClick={() => setShowModelsOverview(true)}
              >
                Modellübersicht
              </button>
              {" · "}
              <a
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                href="https://www.mittwald.de/impressum"
                target="_blank"
                rel="noreferrer"
              >
                Impressum
              </a>
              {" · "}
              <a
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                href={GITHUB_NEW_BUG_ISSUE_URL}
                target="_blank"
                rel="noreferrer"
              >
                Bug melden
              </a>
              {" · "}
              <a
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300"
                href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/access-and-usage/data-protection/"
                target="_blank"
                rel="noreferrer"
              >
                Datenschutz (mittwald)
              </a>
              <br />
              <span className="mt-1 inline-block max-w-2xl text-[11px] text-neutral-500 dark:text-neutral-400">
                Dies ist ein reiner Test-Playground: Du kannst die Modelle ausprobieren und dir einen ersten Eindruck
                verschaffen. Der Chat wird nicht serverseitig gespeichert und ist weder für den produktiven Einsatz noch
                für vertrauliche oder geschäftskritische Inhalte vorgesehen.
              </span>
            </p>
          </div>
        </div>
      </div>

      <SettingsGlossaryOverlay open={showGlossary} onClose={() => setShowGlossary(false)} />
      <ModelsOverviewOverlay open={showModelsOverview} onClose={() => setShowModelsOverview(false)} />
      <ImageLightbox
        open={imageLightbox !== null}
        src={imageLightbox?.src ?? ""}
        alt={imageLightbox?.alt ?? ""}
        onClose={closeImageLightbox}
      />
    </div>
  );
}
