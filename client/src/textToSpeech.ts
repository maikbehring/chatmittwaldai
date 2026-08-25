import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

/**
 * Presets laut mittwald-Doku (Qwen3-TTS CustomVoice).
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-tts-customvoice/
 */
export const MODEL_QWEN_TTS = "Qwen3-TTS-12Hz-1.7B-CustomVoice";

export const TTS_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-tts-customvoice/";

/** Server-Limit (PLAYGROUND_TTS_MAX_INPUT_CHARS). */
export const TTS_MAX_INPUT_CHARS = 4000;

export const TTS_VOICES = [
  "aiden",
  "dylan",
  "eric",
  "ono_anna",
  "ryan",
  "serena",
  "sohee",
  "uncle_fu",
  "vivian",
] as const;

export type TtsVoice = (typeof TTS_VOICES)[number];

export const TTS_LANGUAGES = [
  "Auto",
  "German",
  "English",
  "French",
  "Italian",
  "Spanish",
  "Portuguese",
  "Japanese",
  "Korean",
  "Russian",
  "Chinese",
  "Beijing_Dialect",
  "Sichuan_Dialect",
] as const;

export type TtsLanguage = (typeof TTS_LANGUAGES)[number];

export const TTS_RESPONSE_FORMATS = ["mp3", "opus", "wav", "flac", "pcm"] as const;

export type TtsResponseFormat = (typeof TTS_RESPONSE_FORMATS)[number];

export type TtsInferencePreset = {
  voice: TtsVoice;
  language: TtsLanguage;
  speed: number;
  responseFormat: TtsResponseFormat;
  /** Nur sinnvoll bei English + englischsprachiger Stimme (Doku). */
  instructions?: string;
  hint: string;
};

/** Deutsch-Demo ohne starke Anglizismen (Doku-Beispiel umgeschrieben — weniger Denglisch). */
export const TTS_DEMO_TEXT =
  "Dein Webhosting, vollständig verwaltet. Keine Rechner zum Aktualisieren und kein Alarm um drei Uhr nachts. " +
  "Jedes Ausrollen ist in Sekunden erledigt, und jede Änderung lässt sich mit einem Klick zurücknehmen.";

/** Doku: opus ≈ ein Zehntel von wav — ideal für Browser-Wiedergabe. */
export function getTtsInferencePreset(language: TtsLanguage | string = "German"): TtsInferencePreset {
  const lang = normalizeTtsLanguage(language);
  if (lang === "English") {
    return {
      voice: "ryan",
      language: "English",
      speed: 1.0,
      responseFormat: "opus",
      hint: "Doku EN: ryan, speed 1.0, opus; instructions optional (max. 500 Zeichen).",
    };
  }
  return {
    // vivian: in Doku-DE-Beispielen für klareren DE-Ton; instructions wirken auf DE nicht.
    voice: "vivian",
    language: lang === "Auto" ? "Auto" : "German",
    speed: 0.95,
    responseFormat: "opus",
    hint: "Doku DE: vivian/serena, language German, speed ≈0.95, opus; Anglizismen ersetzen; instructions weglassen.",
  };
}

export type TtsSynthesisRequest = {
  input: string;
  voice?: string;
  language?: string;
  speed?: number;
  responseFormat?: TtsResponseFormat;
  instructions?: string;
};

export type TtsSynthesisResult = {
  blob: Blob;
  mimeType: string;
  fileName: string;
};

export type TtsResultPayload = {
  audioBase64: string;
  mimeType: string;
  fileName: string;
  voice: string;
  language: string;
  speed: number;
  format: string;
  inputChars: number;
  preparedInput?: boolean;
};

/**
 * Doku: Abkürzungen + englische Fachbegriffe im deutschen Satz werden oft falsch/
 * englisch gelesen. Wir ersetzen gängige Anglizismen durch deutsche Formulierung.
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-tts-customvoice/
 */
const DE_TTS_REPLACEMENTS: [RegExp, string][] = [
  [/\bu\.\s*a\./gi, "unter anderem"],
  [/\bz\.\s*B\./gi, "zum Beispiel"],
  [/\bggf\./gi, "gegebenenfalls"],
  [/\binkl\./gi, "inklusive"],
  [/\bca\.\s*/gi, "circa "],
  [/\bNr\.\s*/gi, "Nummer "],
  [/\s&\s/g, " und "],
  [/\bGmbH\s*&\s*Co\.\s*KG\b/gi, "GmbH und Co. KG"],
  // IT-/Hosting-Anglizismen (häufigster Denglisch-Fall laut Doku)
  [/\bZero[-\s]?Downtime(?:-Updates?)?\b/gi, "Aktualisierungen ohne Ausfallzeit"],
  [/\bContinuous\s+Deployment\b/gi, "fortlaufendes Ausrollen"],
  [/\bDeployments?\b/gi, "Ausrollen"],
  [/\bdeploy(?:en|t|ed)?\b/gi, "ausrollen"],
  [/\bRollbacks?\b/gi, "Zurücksetzen"],
  [/\bzum\s+Patchen\b/gi, "zum Aktualisieren"],
  [/\bPatch(?:en|es|ing)?\b/gi, "Aktualisieren"],
  [/\bPager\b/gi, "Bereitschaftsalarm"],
  [/\bDowntime\b/gi, "Ausfallzeit"],
  [/\bUptime\b/gi, "Verfügbarkeit"],
  [/\bFeatures\b/gi, "Funktionen"],
  [/\bFeature\b/gi, "Funktion"],
  [/\bSetups?\b/gi, "Einrichtung"],
  [/\bUpdates\b/gi, "Aktualisierungen"],
  [/\bUpdate\b/gi, "Aktualisierung"],
  [/\bKubernetes[-\s]?Cluster\b/gi, "Kubernetes-Verbund"],
  [/\bCluster\b/gi, "Verbund"],
  [/\bServer\b/gi, "Rechner"],
  [/\bHosting\b/gi, "Webhosting"],
];

/** Doku: deutsche Texte vor dem Senden aufbereiten (Abkürzungen + Anglizismen). */
export function prepareGermanTtsText(text: string): string {
  let out = text.trim();
  for (const [re, rep] of DE_TTS_REPLACEMENTS) {
    out = out.replace(re, rep);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

export function prepareTextForTts(text: string, language: string): { text: string; prepared: boolean } {
  const raw = text.trim();
  const lang = normalizeTtsLanguage(language);
  if (lang !== "German") return { text: raw, prepared: false };
  const prepared = prepareGermanTtsText(raw);
  return { text: prepared, prepared: prepared !== raw };
}

export function parseTtsSpeed(raw: string | undefined, fallback = 1.0): number {
  const n = Number(String(raw ?? String(fallback)).trim().replace(",", "."));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(4, Math.max(0.25, n));
}

export function normalizeTtsVoice(raw: string | undefined, language?: string): TtsVoice {
  const preset = getTtsInferencePreset(language ?? "German");
  const v = (raw ?? preset.voice).trim().toLowerCase();
  return TTS_VOICES.includes(v as TtsVoice) ? (v as TtsVoice) : preset.voice;
}

export function normalizeTtsLanguage(raw: string | undefined): TtsLanguage {
  const t = (raw ?? "German").trim();
  const match = TTS_LANGUAGES.find((l) => l.toLowerCase() === t.toLowerCase());
  return match ?? "German";
}

export function normalizeTtsFormat(raw: string | undefined, language?: string): TtsResponseFormat {
  const preset = getTtsInferencePreset(language ?? "German");
  const f = (raw ?? preset.responseFormat).trim().toLowerCase();
  return TTS_RESPONSE_FORMATS.includes(f as TtsResponseFormat)
    ? (f as TtsResponseFormat)
    : preset.responseFormat;
}

/** instructions nur bei Englisch — Doku: auf Deutsch wirkungslos. */
export function resolveTtsInstructions(
  language: string,
  rawInstructions: string | undefined,
): string | undefined {
  const lang = normalizeTtsLanguage(language);
  if (lang !== "English") return undefined;
  const t = rawInstructions?.trim() ?? "";
  if (!t) return undefined;
  return t.slice(0, 500);
}

export type TtsBriefingValues = {
  text?: string;
  voice?: string;
  language?: string;
  speed?: string;
  format?: string;
  instructions?: string;
};

export function resolveTtsFromBriefing(values: TtsBriefingValues): {
  input: string;
  voice: TtsVoice;
  language: TtsLanguage;
  speed: number;
  responseFormat: TtsResponseFormat;
  instructions?: string;
  prepared: boolean;
} {
  const language = normalizeTtsLanguage(values.language);
  const preset = getTtsInferencePreset(language);
  const { text: input, prepared } = prepareTextForTts(values.text ?? "", language);
  return {
    input,
    voice: normalizeTtsVoice(values.voice, language),
    language,
    speed: parseTtsSpeed(values.speed, preset.speed),
    responseFormat: normalizeTtsFormat(values.format, language),
    instructions: resolveTtsInstructions(language, values.instructions),
    prepared,
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

const TTS_MIME: Record<TtsResponseFormat, string> = {
  mp3: "audio/mpeg",
  opus: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  pcm: "audio/pcm",
};

export function buildTtsResultMarkdown(options: {
  voice: string;
  language: string;
  speed: number;
  format: string;
  inputChars: number;
  fileName: string;
  preparedInput?: boolean;
}): string {
  const prep = options.preparedInput
    ? " · Text für Deutsch aufbereitet (Abkürzungen/Anglizismen)"
    : "";
  return (
    `🔊 **Vorgelesen** — ${options.inputChars.toLocaleString("de-DE")} Zeichen · ` +
    `\`${options.voice}\` · ${options.language} · Tempo ${options.speed} · ${options.format}${prep}`
  );
}

export async function synthesizeSpeech(
  options: TtsSynthesisRequest & {
    rateLimits?: PlaygroundRateLimits | null;
    signal?: AbortSignal;
  },
): Promise<TtsSynthesisResult> {
  const language = options.language ?? "German";
  const preset = getTtsInferencePreset(language);
  const responseFormat = options.responseFormat ?? preset.responseFormat;
  const input = options.input.trim();
  if (!input) throw new Error("Text zum Vorlesen fehlt.");
  if (input.length > TTS_MAX_INPUT_CHARS) {
    throw new Error(`Text zu lang (max. ${TTS_MAX_INPUT_CHARS} Zeichen).`);
  }

  const res = await fetch(apiUrl("/api/audio/speech"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    signal: options.signal,
    body: JSON.stringify({
      input,
      voice: options.voice ?? preset.voice,
      language,
      speed: options.speed ?? preset.speed,
      response_format: responseFormat,
      instructions: resolveTtsInstructions(language, options.instructions),
    }),
  });

  if (!res.ok) {
    await ensureOkApiResponse(res, options.rateLimits ?? null);
  }

  const blob = await res.blob();
  const mimeType = blob.type || TTS_MIME[responseFormat] || "audio/mpeg";
  return {
    blob,
    mimeType,
    fileName: `tts.${responseFormat}`,
  };
}
