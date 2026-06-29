/**
 * Voreinstellungen laut mittwald-Doku (Chat-Allround, ggf. Vision beim Senden).
 * @see https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/
 */

export type GptOssReasoning = "low" | "medium" | "high";

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
export const MODEL_QWEN_35 = "Qwen3.5-122B-A10B-FP8";
export const MODEL_QWEN_36 = "Qwen3.6-35B-A3B-FP8";
/** Dediziertes OCR-Modell (mittwald) — Texterkennung aus Dokumenten/Bildern. */
export const MODEL_GLM_OCR = "GLM-OCR";

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
  return modelId === MODEL_QWEN_35 || modelId === MODEL_QWEN_36;
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
