import {
  MODEL_DEVSTRAL,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
} from "./modelPresets";

/** Eingabe-Token zählen mit 1/4 Gewicht (Prefill vs. Decode). */
export const PROMPT_TOKEN_ENERGY_WEIGHT = 0.25;

/**
 * Gemessene GPU-Energie pro 1 Mio. gewichtete Token (kWh), Benchmark-Tabelle Mittwald AI Hosting.
 */
export const KWH_PER_MILLION_TOKENS: Record<string, number> = {
  [MODEL_QWEN_36]: 0.55,
  [MODEL_GPT_OSS]: 0.73,
  [MODEL_QWEN_35]: 1.31,
  [MODEL_MINISTRAL]: 1.5,
  [MODEL_DEVSTRAL]: 2.5,
};

export const DEFAULT_KWH_PER_MILLION_TOKENS = KWH_PER_MILLION_TOKENS[MODEL_MINISTRAL];

/**
 * Deutscher Strommix (UBA, vorläufig 2025): spezifische CO₂-Emissionen je kWh Stromverbrauch.
 * @see https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2025-nur
 */
export const GRID_CO2_GRAMS_PER_KWH = 344;

export function getKwhPerMillionTokens(modelId: string): number {
  return KWH_PER_MILLION_TOKENS[modelId] ?? DEFAULT_KWH_PER_MILLION_TOKENS;
}

/** Gewichtete Tokenzahl: Eingabe × 1/4 + Ausgabe. */
export function effectiveInferenceTokens(
  promptTokens: number,
  completionTokens: number,
): number {
  return promptTokens * PROMPT_TOKEN_ENERGY_WEIGHT + completionTokens;
}

/**
 * CO₂-Äquivalent in Gramm:
 * ((Eingabe × 1/4) + Ausgabe) / 1 Mio. × kWh/Mio. × g CO₂/kWh
 */
export function estimateInferenceCo2Grams(
  promptTokens: number,
  completionTokens: number,
  modelId: string,
): number {
  const weighted = effectiveInferenceTokens(promptTokens, completionTokens);
  if (weighted <= 0) return 0;
  const kwh = (weighted / 1_000_000) * getKwhPerMillionTokens(modelId);
  return kwh * GRID_CO2_GRAMS_PER_KWH;
}

export const CO2_FOOTPRINT_TOOLTIP =
  "Schätzung aus Benchmark-Energie (kWh pro 1 Mio. gewichtete Token): " +
  "Eingabe-Token × 1/4 + Ausgabe-Token, dann × deutscher Strommix (UBA 2025) 344 g CO₂/kWh. " +
  "kWh/Mio.: Qwen3.6 0,55 · gpt-oss 0,73 · Qwen3.5 1,31 · Ministral 1,50 · Devstral 2,50. " +
  "Ohne API-Nutzungsdaten nur Ausgabe-Token grob geschätzt.";

export const SESSION_CO2_TOOLTIP =
  `${CO2_FOOTPRINT_TOOLTIP} Summe aller Antworten über alle Chats in diesem Browser.`;

export function formatCo2Grams(grams: number): string {
  return grams.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: grams < 1 ? 3 : 2,
  });
}

export type Co2UsageMessage = {
  role: string;
  usage?: { co2Grams?: number | null };
};

/** Summiert gespeicherte CO₂-Schätzungen aller Assistenten-Antworten. */
export function sumCo2GramsFromAssistantMessages(
  messages: ReadonlyArray<Co2UsageMessage>,
): number {
  let sum = 0;
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const g = m.usage?.co2Grams;
    if (typeof g === "number" && g > 0) sum += g;
  }
  return sum;
}
