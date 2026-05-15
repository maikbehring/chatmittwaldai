import {
  MODEL_DEVSTRAL,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
} from "./modelPresets";

/** Geschätzter CO₂-Ausstoß in kg pro 1 Mio. Token (Eingabe + Ausgabe). */
export const CO2_KG_PER_MILLION_TOKENS: Record<string, number> = {
  [MODEL_QWEN_36]: 0.36,
  [MODEL_GPT_OSS]: 0.39,
  [MODEL_MINISTRAL]: 0.72,
  [MODEL_QWEN_35]: 1.08,
  [MODEL_DEVSTRAL]: 1.17,
};

/** Fallback für nicht gelistete Modelle (Mittelwert der Playground-Modelle). */
export const DEFAULT_CO2_KG_PER_MILLION_TOKENS = 0.72;

export function getCo2KgPerMillionTokens(modelId: string): number {
  return CO2_KG_PER_MILLION_TOKENS[modelId] ?? DEFAULT_CO2_KG_PER_MILLION_TOKENS;
}

/**
 * CO₂-Äquivalent in Gramm aus Gesamt-Tokenzahl und modellspezifischem kg/Mio.-Faktor.
 */
export function estimateInferenceCo2Grams(totalTokens: number, modelId: string): number {
  if (totalTokens <= 0) return 0;
  const kgPerMio = getCo2KgPerMillionTokens(modelId);
  return (totalTokens / 1_000_000) * kgPerMio * 1000;
}

export const CO2_FOOTPRINT_TOOLTIP =
  "Schätzung aus Tokenzahl × modellspezifischem Faktor (kg CO₂eq pro 1 Mio. Token, Eingabe+Ausgabe): " +
  "Qwen3.6 ~0,36, gpt-oss ~0,39, Ministral ~0,72, Qwen3.5 ~1,08, Devstral ~1,17. " +
  "Ohne API-Nutzungsdaten nur Ausgabe-Token grob geschätzt.";
