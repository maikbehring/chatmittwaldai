import type { GptOssReasoning } from "./modelPresets";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type StoredChatMessage = {
  role: "user" | "assistant";
  content: string | ContentPart[];
  usage?: Record<string, unknown>;
};

export const STORAGE_KEY_V3 = "mittwald-ai-playground-state-v3";
const STORAGE_KEY_V2 = "mittwald-ai-playground-state-v2";
const LEGACY_STORAGE_KEY = "mittwald-ai-playground-state-v1";

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** Websuche für diesen Chat aktiv (pro Chat umschaltbar). */
  webSearchEnabled?: boolean;
  messages: StoredChatMessage[];
};

export type PlaygroundSettings = {
  model: string;
  temperature: number;
  topP: number | null;
  topK: number | null;
  presencePenalty: number | null;
  extraBody: Record<string, unknown> | null;
  gptOssReasoning: GptOssReasoning;
  maxTokens: number | null;
  systemPrompt: string;
  qwenVisionOcr: boolean;
  /** Standard für neu erstellte Chats (nur Browser). */
  webSearchDefaultEnabled?: boolean;
};

export type PersistedV3 = PlaygroundSettings & {
  v: 3;
  activeThreadId: string;
  threads: ChatThread[];
};

type PersistedV2 = PlaygroundSettings & {
  v: 2;
  messages: StoredChatMessage[];
};

function readJsonKey(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createThreadId(): string {
  return crypto.randomUUID?.() ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function plainTextFromContent(content: StoredChatMessage["content"]): string {
  if (typeof content === "string") return content.trim();
  return content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

/** Slack/Teams-Zeitstempel am Zeilenanfang entfernen. */
function stripLeadingTimestamp(text: string): string {
  return text
    .replace(/^(\[\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*)+/i, "")
    .replace(/^(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*[-–—]\s*)+/i, "")
    .trim();
}

function looksLikeBulkPaste(text: string): boolean {
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
  return text.length > 220 || lines.length > 5 || (lines.length > 2 && text.length > 100);
}

function truncateTitle(text: string, max = 42): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Titel aus erster Nutzer-Nachricht — bei langen Paste-Blöcken kein Rohtext in der Sidebar. */
export function deriveThreadTitle(messages: StoredChatMessage[], fallback = "Neuer Chat"): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return fallback;
  const text = plainTextFromContent(firstUser.content);
  if (!text) return fallback;

  if (looksLikeBulkPaste(text)) {
    const lines = text.split(/\n/).map((l) => stripLeadingTimestamp(l.trim())).filter(Boolean);
    for (const line of lines) {
      if (line.length >= 12 && line.length <= 72 && !looksLikeBulkPaste(line)) {
        return truncateTitle(line);
      }
    }
    const shortLine = lines.find((l) => l.length >= 8 && l.length <= 72);
    if (shortLine) return truncateTitle(shortLine);
    return "Eingefügter Text";
  }

  const oneLine = stripLeadingTimestamp(text.replace(/\s+/g, " "));
  if (!oneLine) return fallback;
  return truncateTitle(oneLine);
}

export function createEmptyThread(webSearchDefault = false): ChatThread {
  const now = Date.now();
  return {
    id: createThreadId(),
    title: "Neuer Chat",
    createdAt: now,
    updatedAt: now,
    webSearchEnabled: webSearchDefault,
    messages: [],
  };
}

export function sortThreadsByRecent(threads: ChatThread[]): ChatThread[] {
  return [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadPlaygroundState(): {
  settings: Partial<PlaygroundSettings>;
  threads: ChatThread[];
  activeThreadId: string;
} {
  const v3 = readJsonKey(STORAGE_KEY_V3) as Partial<PersistedV3> | null;
  if (v3?.v === 3 && Array.isArray(v3.threads) && v3.threads.length > 0) {
    const threads = sortThreadsByRecent(
      v3.threads
        .filter((t): t is ChatThread => Boolean(t?.id && Array.isArray(t.messages)))
        .map((t) => ({ ...t, webSearchEnabled: Boolean(t.webSearchEnabled) })),
    );
    const active =
      threads.find((t) => t.id === v3.activeThreadId)?.id ?? threads[0].id;
    const { v: _v, activeThreadId: _a, threads: _t, ...settings } = v3;
    return { settings, threads, activeThreadId: active };
  }

  const v2 = readJsonKey(STORAGE_KEY_V2) as Partial<PersistedV2> | null;
  if (v2?.v === 2) {
    const thread = createEmptyThread();
    thread.messages = Array.isArray(v2.messages) ? v2.messages : [];
    thread.title = deriveThreadTitle(thread.messages);
    thread.updatedAt = Date.now();
    const { v: _v, messages: _m, ...settings } = v2;
    return {
      settings,
      threads: [thread],
      activeThreadId: thread.id,
    };
  }

  const legacy = readJsonKey(LEGACY_STORAGE_KEY) as {
    v?: number;
    messages?: StoredChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number | null;
    systemPrompt?: string;
  } | null;
  if (legacy?.v === 1) {
    const thread = createEmptyThread();
    thread.messages = Array.isArray(legacy.messages) ? legacy.messages : [];
    thread.title = deriveThreadTitle(thread.messages);
    return {
      settings: {
        model: legacy.model,
        temperature: legacy.temperature,
        maxTokens: legacy.maxTokens,
        systemPrompt: legacy.systemPrompt,
      },
      threads: [thread],
      activeThreadId: thread.id,
    };
  }

  const thread = createEmptyThread(false);
  return { settings: {}, threads: [thread], activeThreadId: thread.id };
}

export function savePlaygroundState(state: PersistedV3): void {
  try {
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state));
    localStorage.removeItem(STORAGE_KEY_V2);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* Quota oder private mode */
  }
}
