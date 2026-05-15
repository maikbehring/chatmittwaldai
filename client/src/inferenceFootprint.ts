import {
  MODEL_DEVSTRAL,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
} from "./modelPresets";

/**
 * Geschätztes Verhältnis Energie/CO₂: Ausgabe-Token zu Eingabe-Token (Decode vs. Prefill).
 * Kalibriert auf typischen Chat (ca. 10k Prompt / 1,5k Completion), vgl. Inferenz-Benchmarks.
 */
export const CO2_OUTPUT_TO_INPUT_RATIO = 2.5;

/** Referenz-Workload zur Ableitung getrennter Faktoren aus dem Blended-Wert. */
const REFERENCE_PROMPT_TOKENS = 10_000;
const REFERENCE_COMPLETION_TOKENS = 1_500;

/** Blended: kg CO₂eq pro 1 Mio. Token (Mittel aus Eingabe+Ausgabe im Referenz-Mix). */
export const CO2_KG_PER_MILLION_TOKENS: Record<string, number> = {
  [MODEL_QWEN_36]: 0.36,
  [MODEL_GPT_OSS]: 0.39,
  [MODEL_MINISTRAL]: 0.72,
  [MODEL_QWEN_35]: 1.08,
  [MODEL_DEVSTRAL]: 1.17,
};

export const DEFAULT_CO2_KG_PER_MILLION_TOKENS = 0.72;

export function getCo2KgPerMillionTokens(modelId: string): number {
  return CO2_KG_PER_MILLION_TOKENS[modelId] ?? DEFAULT_CO2_KG_PER_MILLION_TOKENS;
}

function splitCo2Factors(blendedKgPerMio: number): {
  promptKgPerMio: number;
  completionKgPerMio: number;
} {
  const refTotal = REFERENCE_PROMPT_TOKENS + REFERENCE_COMPLETION_TOKENS;
  const promptKgPerMio =
    (blendedKgPerMio * refTotal) /
    (REFERENCE_PROMPT_TOKENS + CO2_OUTPUT_TO_INPUT_RATIO * REFERENCE_COMPLETION_TOKENS);
  return {
    promptKgPerMio,
    completionKgPerMio: promptKgPerMio * CO2_OUTPUT_TO_INPUT_RATIO,
  };
}

export function getCo2KgPerMillionPromptTokens(modelId: string): number {
  return splitCo2Factors(getCo2KgPerMillionTokens(modelId)).promptKgPerMio;
}

export function getCo2KgPerMillionCompletionTokens(modelId: string): number {
  return splitCo2Factors(getCo2KgPerMillionTokens(modelId)).completionKgPerMio;
}

function tokensToCo2Grams(tokens: number, kgPerMillion: number): number {
  if (tokens <= 0) return 0;
  return (tokens / 1_000_000) * kgPerMillion * 1000;
}

/**
 * CO₂-Äquivalent in Gramm; Eingabe- und Ausgabe-Token mit unterschiedlichen Faktoren.
 */
export function estimateInferenceCo2Grams(
  promptTokens: number,
  completionTokens: number,
  modelId: string,
): number {
  const { promptKgPerMio, completionKgPerMio } = splitCo2Factors(getCo2KgPerMillionTokens(modelId));
  return (
    tokensToCo2Grams(promptTokens, promptKgPerMio) +
    tokensToCo2Grams(completionTokens, completionKgPerMio)
  );
}

export const CO2_FOOTPRINT_TOOLTIP =
  "Schätzung: Eingabe- und Ausgabe-Token getrennt (Ausgabe ~2,5× Eingabe pro Token, Referenz ~10k/1,5k). " +
  "Blended kg/Mio.: Qwen3.6 ~0,36, gpt-oss ~0,39, Ministral ~0,72, Qwen3.5 ~1,08, Devstral ~1,17. " +
  "Ohne API-Nutzungsdaten nur Ausgabe-Token grob geschätzt.";
