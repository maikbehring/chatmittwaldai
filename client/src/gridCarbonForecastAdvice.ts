import {
  formatGridCarbonBerlinDateTime,
  formatGridCarbonRating,
  gridCarbonHintLabel,
  type GridCarbonSummary,
} from "./gridCarbonForecast";

const NEAR_MIN_GAP = 15;

/** Deterministische Antwort für typische Nutzerfragen — ohne LLM-Halluzination. */
export function buildGridCarbonForecastAdvice(summary: GridCarbonSummary): string {
  const cur = summary.current.rating;
  const min = summary.next24h.min;
  const max = summary.next24h.max;
  const minAt = formatGridCarbonBerlinDateTime(summary.next24h.minAt);
  const curAt = formatGridCarbonBerlinDateTime(summary.current.at);
  const nearMin = Math.abs(cur - min) < NEAR_MIN_GAP;
  const hint = gridCarbonHintLabel(summary.hint);

  const nowLine = nearMin
    ? `Gerade (~${formatGridCarbonRating(cur)} g/kWh, ${curAt}) seid ihr nahe am günstigsten Fenster der nächsten 24 h — ein guter Zeitpunkt für flexible Batch-Jobs, Embeddings oder lokale LLM-Läufe.`
    : `Gerade (~${formatGridCarbonRating(cur)} g/kWh, ${curAt}) ist **noch nicht** das günstigste Fenster. Sinnvoller Start: ca. **${minAt}** (~${formatGridCarbonRating(min)} g/kWh), wenn laut Prognose mehr Erneuerbare im Netz sind.`;

  return (
    `**Was du damit anfangen kannst**\n\n` +
    `Der Forecast zeigt, wann im deutschen Stromnetz besonders viel regenerativer Strom erwartet wird — niedrigere g/kWh bedeuten typischerweise mehr Sonne und Wind im Mix. ` +
    `Damit timst du **nicht zeitkritische KI-Jobs**: Embedding-Batches, Indizierung, Reports, Datenpipelines oder lokale LLM-Läufe auf eigener GPU.\n\n` +
    `**Konkret (nächste 24 h)**\n` +
    `- ${nowLine}\n` +
    `- Günstigstes Fenster: ~${formatGridCarbonRating(min)} g/kWh (ca. ${minAt})\n` +
    `- Höchster Wert im Verlauf: ~${formatGridCarbonRating(max)} g/kWh\n` +
    (hint ? `- ${hint.charAt(0).toUpperCase()}${hint.slice(1)}\n` : "") +
    `\n**Sofort ohne Timing:** Chat und synchrone API-Aufrufe.\n\n` +
    `Die Grafik und Tabelle im Panel oben zeigen den Verlauf im Detail. ` +
    `Die CO₂-Zeile unter Chat-Antworten ist etwas anderes: Schätzung pro Anfrage (Token × UBA-Jahresmittel ${summary.baselineUba2025} g/kWh), noch nicht dieser Live-Forecast.`
  );
}

const STATIC_QUESTION_RE =
  /was kann ich damit anfangen|wofür (ist )?(das|der forecast|es)|was ist das|was bedeutet das|wie nutze ich|wann.*(batch|embedding|starten|llm|job|laufen)/i;

export function getGridCarbonForecastStaticResponse(
  userText: string,
  summary: GridCarbonSummary | null | undefined,
): string | null {
  if (!summary?.series24h?.length) return null;
  const q = userText.trim();
  if (!q || !STATIC_QUESTION_RE.test(q)) return null;
  return buildGridCarbonForecastAdvice(summary);
}

export function formatGridCarbonForecastSubmission(userText: string): string {
  return (
    `Beantworte die Frage zum Strommix-Forecast kurz auf Deutsch (4–7 Sätze, Markdown erlaubt).\n` +
    `REGELN: Niedrigere g/kWh = mehr Erneuerbare = besser für Batch-Jobs. ` +
    `„Gerade“ und „günstigstes Fenster“ NIEMALS verwechseln — nur Zahlen aus dem Forecast-Kontext. ` +
    `UBA-Jahresmittel ist Referenz, nicht das aktuelle Fenster.\n\n` +
    `--- Frage ---\n${userText.trim()}`
  );
}
