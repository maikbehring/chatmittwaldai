/**
 * Voreinstellungen laut mittwald-Doku (Chat-Allround, ggf. Vision beim Senden).
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-8-27b-nvfp4/
 */

export type GptOssReasoning = "low" | "medium" | "high";
export type Qwen38ReasoningEffort = "low" | "medium" | "xhigh";

export type InferencePresetSlice = {
  temperature: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  extraBody: Record<string, unknown> | null;
  maxTokens: number | null;
  /** Kurztext unter dem Modell-Dropdown */
  hint: string;
};

export const MODEL_MINISTRAL = "Ministral-3-14B-Instruct-2512";
export const MODEL_GPT_OSS = "gpt-oss-120b";
export const MODEL_QWEN_08 = "Qwen3.5-0.8B";
export const MODEL_QWEN_35 = "Qwen3.5-122B-A10B-FP8";
export const MODEL_QWEN_36 = "Qwen3.6-35B-A3B-FP8";
export const MODEL_QWEN_38 = "Qwen3.8-27B-NVFP4";
/** Dediziertes OCR-Modell (mittwald) — Texterkennung aus Dokumenten/Bildern. */
export const MODEL_GLM_OCR = "GLM-OCR";

const QWEN38_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-8-27b-nvfp4/";

export function getInferencePreset(modelId: string): InferencePresetSlice {
  switch (modelId) {
    case MODEL_MINISTRAL:
      return {
        temperature: 0.1,
        extraBody: null,
        maxTokens: 2048,
        hint: "Doku: Chat & Vision — temperature 0.1; Bilder max. 1024 px.",
      };
    case MODEL_GPT_OSS:
      return {
        temperature: 1.0,
        topP: 1.0,
        extraBody: null,
        maxTokens: 8192,
        hint: "Doku: temperature & top_p 1.0; Reasoning-Stufe per Systemzeile „Reasoning: …“.",
      };
    case MODEL_QWEN_08:
      return {
        temperature: 0.7,
        extraBody: null,
        maxTokens: 2048,
        hint: "Kleines Qwen-Modell — nur eine System-Nachricht; Playground-Kontext wird automatisch zusammengeführt.",
      };
    case MODEL_QWEN_35:
    case MODEL_QWEN_36:
      return {
        temperature: 0.7,
        topP: 0.8,
        topK: 20,
        presencePenalty: 1.5,
        extraBody: { chat_template_kwargs: { enable_thinking: false } },
        maxTokens: 32768,
        hint: "Doku: Non-Thinking (enable_thinking false), Allgemein 0.7/0.8/20, presence_penalty 1.5; Vision separat.",
      };
    case MODEL_QWEN_38:
      return getQwen38ThinkingInference("low");
    default:
      return {
        temperature: 0.7,
        extraBody: null,
        maxTokens: 2048,
        hint: "Kein festes Doku-Preset — Werte manuell anpassen.",
      };
  }
}

export function isQwen3Model(modelId: string): boolean {
  return modelId === MODEL_QWEN_35 || modelId === MODEL_QWEN_36 || modelId === MODEL_QWEN_38;
}

export function isQwen38Model(modelId: string): boolean {
  return modelId === MODEL_QWEN_38;
}

/** Thinking-Modus laut Qwen3.8-Doku (reasoning_effort steuerbar). */
export function getQwen38ThinkingInference(
  reasoningEffort: Qwen38ReasoningEffort,
): InferencePresetSlice {
  return {
    temperature: 1.0,
    topP: 0.95,
    topK: 20,
    presencePenalty: 0.0,
    extraBody: { chat_template_kwargs: { reasoning_effort: reasoningEffort } },
    maxTokens: 32768,
    hint: `Doku: Thinking-Modus 1.0/0.95/20; reasoning_effort ${reasoningEffort} (Alltagschat: low); Non-Thinking oder Vision separat. ${QWEN38_DOCS_URL}`,
  };
}

/** Non-Thinking laut Qwen3.8-Doku (Klassifikation, kurze Antworten). */
export function getQwen38NonThinkingInference(): InferencePresetSlice {
  return {
    temperature: 0.7,
    topP: 0.8,
    topK: 20,
    presencePenalty: 1.5,
    extraBody: { chat_template_kwargs: { enable_thinking: false } },
    maxTokens: 32768,
    hint: "Doku: Non-Thinking (enable_thinking false), 0.7/0.8/20, presence_penalty 1.5; Vision separat.",
  };
}

export function resolveQwen38InferenceParams(options: {
  thinkingEnabled: boolean;
  reasoningEffort: Qwen38ReasoningEffort;
  hasVision: boolean;
  qwenVisionOcr: boolean;
  userMaxTokens: number | null;
}): Pick<
  InferencePresetSlice,
  "temperature" | "topP" | "topK" | "presencePenalty" | "extraBody" | "maxTokens"
> {
  if (options.hasVision) {
    const qv = options.qwenVisionOcr ? getQwenVisionOcrInference() : getQwenVisionInference();
    const cap = qv.maxTokens ?? 2048;
    const effMax =
      options.userMaxTokens === null
        ? cap
        : Math.min(options.userMaxTokens, cap);
    return {
      temperature: qv.temperature,
      topP: qv.topP,
      topK: qv.topK,
      presencePenalty: undefined,
      extraBody: qv.extraBody,
      maxTokens: effMax,
    };
  }

  const base = options.thinkingEnabled
    ? getQwen38ThinkingInference(options.reasoningEffort)
    : getQwen38NonThinkingInference();
  return {
    temperature: base.temperature,
    topP: base.topP,
    topK: base.topK,
    presencePenalty: base.presencePenalty,
    extraBody: base.extraBody,
    maxTokens: options.userMaxTokens ?? base.maxTokens,
  };
}

export function applyQwen38ModeToState(
  thinkingEnabled: boolean,
  reasoningEffort: Qwen38ReasoningEffort,
  setters: {
    setTemperature: (n: number) => void;
    setTopP: (n: number | null) => void;
    setTopK: (n: number | null) => void;
    setPresencePenalty: (n: number | null) => void;
    setExtraBody: (b: Record<string, unknown> | null) => void;
    setMaxTokens: (n: number | null) => void;
  },
): void {
  const p = thinkingEnabled
    ? getQwen38ThinkingInference(reasoningEffort)
    : getQwen38NonThinkingInference();
  setters.setTemperature(p.temperature);
  setters.setTopP(typeof p.topP === "number" ? p.topP : null);
  setters.setTopK(typeof p.topK === "number" ? p.topK : null);
  setters.setPresencePenalty(typeof p.presencePenalty === "number" ? p.presencePenalty : null);
  setters.setExtraBody(p.extraBody);
  setters.setMaxTokens(p.maxTokens);
}

/** Upstream akzeptiert bei diesem Modell nur eine System-Nachricht (mehrere → 400). */
export function modelRequiresSingleSystemMessage(modelId: string): boolean {
  return modelId === MODEL_QWEN_08;
}

/** Vision-Overrides laut Qwen-Modellseiten (Thinking aus, Parameter, kürzere Ausgabe). */
export function getQwenVisionInference(): Pick<
  InferencePresetSlice,
  "temperature" | "topP" | "topK" | "extraBody" | "maxTokens"
> {
  return {
    temperature: 0.7,
    topP: 0.8,
    topK: 20,
    extraBody: { chat_template_kwargs: { enable_thinking: false } },
    maxTokens: 2048,
  };
}

/** OCR / sehr präzise Texterkennung laut Qwen-Doku */
export function getQwenVisionOcrInference(): Pick<
  InferencePresetSlice,
  "temperature" | "topP" | "topK" | "extraBody" | "maxTokens"
> {
  return {
    ...getQwenVisionInference(),
    temperature: 0.1,
  };
}
