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
 * Gemessene GPU-Energie pro 1 Mio. gewichtete Token (kWh) an der mittwald AI-Hosting-Infrastruktur.
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
  "Orientierungswert auf Basis von Energie-Messungen an der mittwald AI-Hosting-Infrastruktur " +
  "(kWh pro 1 Mio. gewichtete Token je Modell): Eingabe-Token × 1/4 + Ausgabe-Token, " +
  "dann × deutscher Strommix (UBA 2025) 344 g CO₂/kWh. " +
  "kWh/Mio.: Qwen3.6 0,55 · gpt-oss 0,73 · Qwen3.5 1,31 · Ministral 1,50 · Devstral 2,50. " +
  "Keine exakte Ökobilanz — nur Chat-Inferenz; ohne API-Nutzungsdaten grob geschätzt.";

export const SESSION_CO2_TOOLTIP =
  `${CO2_FOOTPRINT_TOOLTIP} Summe aller Antworten über alle Chats in diesem Browser.`;

/** Kurzer Kontext für KI-Antworten, wenn Nutzer nach der CO₂-Anzeige fragen. */
export function formatPlaygroundCo2Context(): string {
  return (
    `[Playground — CO₂-Anzeige]\n` +
    `Unter jeder Assistenten-Antwort und im Footer zeigt dieser Playground automatisch „≈ … g CO₂eq“ — ein Orientierungswert für diese Chat-Inferenz.\n` +
    `Grundlage: Energie-Messungen an der mittwald AI-Hosting-Infrastruktur (je Modell) × Token-Nutzung der Anfrage × Strommix-Faktor. Trotzdem nur Orientierung, keine exakte Messung pro Klick, keine Ökobilanz fürs Reporting. Websuche, Whisper, OCR, Embeddings nicht einbezogen.\n` +
    `WICHTIG: Fragt der Nutzer nach „CO₂“, „CO2“, „CO₂eq“, „CO₂-Wert“ o. Ä. ohne explizit nach globalem Klima/Industrie/Chemie zu fragen, meint er fast immer diese Playground-Anzeige.\n` +
    `Dann: 2–4 kurze Sätze auf Deutsch — eigene Infrastruktur, Orientierung, nicht für Reporting. KEIN allgemeiner Text über Klimawandel, Verbrennung, Zement, Sensoren, Mauna Loa o. Ä.\n` +
    `NIEMALS CO₂-Zahlen, „≈ … g CO₂eq“ oder Hinweise dazu in deiner Antwort nennen — die Oberfläche berechnet und zeigt den Wert separat unter der Nachricht.`
  );
}

const PLAYGROUND_CO2_QUESTION_RE =
  /\b(co[\s_\-]?2|co₂|co2eq|co₂eq|kohlendioxid|carbon\s*footprint|treibhausgas(?:e)?)\b/i;

const GENERAL_CO2_TOPIC_RE =
  /\b(klimawandel|mauna\s*loa|zement(?:produktion)?|verbrennungsmotor|atmosphäre|weltweit|global(?:e)?\s+emission|kraftwerk|entwaldung|vulkan|ccs|haber[\s-]?bosch)\b/i;

export function isPlaygroundCo2Question(text: string): boolean {
  const t = text.trim();
  if (!t || !PLAYGROUND_CO2_QUESTION_RE.test(t)) return false;
  return !GENERAL_CO2_TOPIC_RE.test(t);
}

/** Leitet CO₂-Nachfragen auf die Playground-Anzeige um (nur API — nicht in der Chat-UI anzeigen). */
export function enrichUserMessageForPlaygroundCo2Question(
  rawUserText: string,
  messageText: string,
): string {
  if (!isPlaygroundCo2Question(rawUserText)) return messageText;
  return (
    `[Kontext: Frage zur CO₂eq-Anzeige im Mittwald KI-Playground — nur diese kurz erklären, kein allgemeiner CO₂-/Klima-Vortrag. Keine CO₂-Zahlen in der Antwort — die UI zeigt sie automatisch unter der Nachricht.]\n\n` +
    messageText
  );
}

const HALLUCINATED_CO2_SUFFIX_RE =
  /\s*\(≈\s*[\d.,]+\s*g\s*CO₂(?:eq)?\)\s*$/i;

const HALLUCINATED_CO2_HINT_RE =
  /\n?\s*\*?\(?Hinweis:\s*Der Wert bezieht sich auf die Antwort[^*\n)]*\*?\)?\s*$/i;

/** Entfernt vom Modell erfundene CO₂-Zeilen — die UI zeigt den berechneten Wert separat. */
export function stripHallucinatedCo2FromAssistantText(text: string): string {
  let out = text;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(HALLUCINATED_CO2_SUFFIX_RE, "").replace(HALLUCINATED_CO2_HINT_RE, "");
    if (next === out) break;
    out = next;
  }
  return out.trimEnd();
}

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
