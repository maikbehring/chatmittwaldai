import {
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
  getInferencePreset,
  getQwenVisionInference,
  getQwenVisionOcrInference,
  isQwen3Model,
  type GptOssReasoning,
} from "./modelPresets";
import { normalizeApiMessagesForModel } from "./playgroundSystemContext";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ModelCompareUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  outputTokensPerSec: number | null;
};

export type ModelCompareSlot = {
  modelId: string;
  content: string | ContentPart[];
  usage?: ModelCompareUsage;
};

export type ModelComparePayload = {
  modelA: ModelCompareSlot;
  modelB: ModelCompareSlot;
};

export type CompareHistoryMessage = {
  role: "user" | "assistant";
  content: string | ContentPart[];
  compare?: ModelComparePayload;
};

export type ApiMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

const MODEL_SHORT_LABELS: Record<string, string> = {
  [MODEL_MINISTRAL]: "Ministral 14B",
  [MODEL_GPT_OSS]: "gpt-oss 120B",
  [MODEL_QWEN_35]: "Qwen3.5 122B",
  [MODEL_QWEN_36]: "Qwen3.6 35B",
};

export function modelShortLabel(modelId: string): string {
  return MODEL_SHORT_LABELS[modelId] ?? modelId;
}

function assistantTextForModel(
  message: CompareHistoryMessage,
  modelId: string,
  modelAId: string,
): string | ContentPart[] | null {
  if (message.role !== "assistant") return null;
  if (message.compare) {
    const slot =
      modelId === modelAId ? message.compare.modelA : message.compare.modelB;
    return slot.content;
  }
  if (modelId === modelAId) return message.content;
  return null;
}

/** Verlauf für ein Modell: nur eigene Assistant-Antworten aus Vergleichsrunden. */
export function buildCompareApiMessages(options: {
  history: CompareHistoryMessage[];
  targetModelId: string;
  modelAId: string;
  modelBId: string;
  systemPrompt: string;
  gptOssReasoning: GptOssReasoning;
  todayContext: string;
}): ApiMessage[] {
  const api: ApiMessage[] = [{ role: "system", content: options.todayContext }];

  if (options.targetModelId === MODEL_GPT_OSS) {
    const line = `Reasoning: ${options.gptOssReasoning}`;
    const rest = options.systemPrompt.trim();
    api.push({ role: "system", content: rest ? `${line}\n\n${rest}` : line });
  } else if (options.systemPrompt.trim()) {
    api.push({ role: "system", content: options.systemPrompt.trim() });
  }

  for (const m of options.history) {
    if (m.role === "user") {
      api.push({ role: "user", content: m.content });
      continue;
    }
    const text = assistantTextForModel(m, options.targetModelId, options.modelAId);
    if (text != null && (typeof text === "string" ? text.length > 0 : true)) {
      api.push({ role: "assistant", content: text });
    }
  }

  return normalizeApiMessagesForModel(api, options.targetModelId);
}

export type CompareInferenceParams = {
  temperature: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  maxTokens: number | null;
  extraBody: Record<string, unknown> | null;
};

export function inferenceParamsForCompareModel(
  modelId: string,
  hasVision: boolean,
  qwenVisionOcr: boolean,
  userMaxTokens: number | null,
): CompareInferenceParams {
  const preset = getInferencePreset(modelId);
  let effTemp = preset.temperature;
  let effTopP = preset.topP;
  let effTopK = preset.topK;
  let effPresence = preset.presencePenalty;
  let effMax = userMaxTokens ?? preset.maxTokens;
  let effExtra = preset.extraBody ? { ...preset.extraBody } : null;

  if (hasVision) {
    if (modelId === MODEL_MINISTRAL) {
      effTemp = 0.1;
    } else if (isQwen3Model(modelId)) {
      const qv = qwenVisionOcr ? getQwenVisionOcrInference() : getQwenVisionInference();
      effTemp = qv.temperature;
      effTopP = qv.topP ?? effTopP;
      effTopK = qv.topK ?? effTopK;
      effExtra = qv.extraBody ? { ...qv.extraBody } : effExtra;
      const cap = qv.maxTokens ?? 2048;
      effMax = effMax === null ? cap : Math.min(effMax, cap);
    }
  }

  return {
    temperature: effTemp,
    topP: effTopP,
    topK: effTopK,
    presencePenalty: effPresence,
    maxTokens: effMax,
    extraBody: effExtra,
  };
}

export function buildCompareChatBody(
  modelId: string,
  messages: ApiMessage[],
  params: CompareInferenceParams,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: modelId,
    messages,
    temperature: params.temperature,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (typeof params.topP === "number") body.top_p = params.topP;
  if (typeof params.topK === "number") body.top_k = params.topK;
  if (typeof params.presencePenalty === "number") body.presence_penalty = params.presencePenalty;
  if (params.maxTokens !== null && params.maxTokens > 0) body.max_tokens = params.maxTokens;
  if (params.extraBody && Object.keys(params.extraBody).length > 0) {
    body.extra_body = params.extraBody;
  }
  return body;
}
