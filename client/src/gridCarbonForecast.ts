import { apiUrl } from "./appPaths";
import { ensureOkApiResponse } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

export type GridCarbonHint = "morgen_frueh_guenstiger" | "heute_nacht_guenstiger";

export type GridCarbonSeriesPoint = {
  time: string;
  rating: number;
};

export type GridCarbonSummary = {
  region: string;
  unit: string;
  updatedAt: string | null;
  current: { rating: number; at: string };
  baselineUba2025: number;
  next24h: { min: number; minAt: string; max: number };
  series24h: GridCarbonSeriesPoint[];
  hint: GridCarbonHint | null;
  sourceUrl: string;
};

export type GridCarbonConfig = {
  enabled: boolean;
  region: string;
  baselineUba2025: number;
  sourceUrl: string;
};

const REFRESH_MS = 15 * 60 * 1000;

export const GRID_CARBON_SDK_URL =
  "https://github.com/Green-Software-Foundation/carbon-aware-sdk";

export const GRID_CARBON_FORECAST_DATA_URL =
  "https://carbonawarecomputing.blob.core.windows.net/forecasts/de.json";

export const GRID_CARBON_AWARE_COMPUTING_URL = "https://www.carbon-aware-computing.com/";

export const MITTWALD_OEKOSTROM_URL =
  "https://www.mittwald.de/blog/nachhaltigkeit/100-oekostrom-mit-herkunftsnachweis-so-sichern-wir-nachhaltige-energie-bei-mittwald";

export type GridCarbonSourceLink = {
  title: string;
  description: string;
  url: string;
};

/** Weiterführende Quellen — Panel, Badge-Tooltip und Chat-Kontext. */
export const GRID_CARBON_SOURCE_LINKS: GridCarbonSourceLink[] = [
  {
    title: "Carbon-Aware-Forecast DE (Rohdaten)",
    description: "15-Minuten-Prognose der CO₂-Intensität des deutschen Strommixes (g/kWh) — Datengrundlage dieses Panels.",
    url: GRID_CARBON_FORECAST_DATA_URL,
  },
  {
    title: "Carbon Aware Computing",
    description: "Open-Source-Tools, APIs und Open Data für Time Shifting — rechenintensive Aufgaben in Phasen mit viel erneuerbarem Strom im Netz legen.",
    url: GRID_CARBON_AWARE_COMPUTING_URL,
  },
  {
    title: "Carbon Aware SDK",
    description: "Open-Source-Bibliothek der Green Software Foundation für carbon-aware Scheduling in produktiven Anwendungen und Pipelines.",
    url: GRID_CARBON_SDK_URL,
  },
  {
    title: "Software Carbon Intensity (SCI)",
    description: "Standard zur Messung und Reduktion der Carbon Intensity von Software — ergänzend zu zeitlichem Scheduling.",
    url: "https://sci.greensoftware.foundation/",
  },
  {
    title: "Green Software Foundation",
    description: "Initiative zu nachhaltiger Software, Green Coding und Carbon-Aware Computing.",
    url: "https://greensoftware.foundation/",
  },
  {
    title: "UBA — Strommix in Zahlen",
    description: "Umweltbundesamt: Emissionsfaktoren und Entwicklung des deutschen Strommixes (Referenz Jahresmittel 344 g/kWh, 2025).",
    url: "https://www.umweltbundesamt.de/themen/klima-energie/energieversorgung/strom-waermeversorgung-in-zahlen",
  },
  {
    title: "mittwald — 100 % Ökostrom",
    description: "Herkunftsnachweise und Hintergrund zum Strombezug aus nachhaltigen Quellen (Wind, Sonne, Biomasse) — unabhängig vom Strommix-Forecast.",
    url: MITTWALD_OEKOSTROM_URL,
  },
  {
    title: "mittwald AI Hosting — Doku",
    description: "Managed KI-Modelle in deutschen Rechenzentren — technische Basis für Chat, API und Batch-Workloads.",
    url: "https://developer.mittwald.de/de/docs/v2/platform/aihosting/",
  },
];

export function formatGridCarbonSourcesBlock(): string {
  return GRID_CARBON_SOURCE_LINKS.map((s) => `• ${s.title}: ${s.url}\n  ${s.description}`).join("\n");
}

/**
 * Kompakte Fakten aus den Quellen — für System-Prompt und Chat-Kontext.
 * Stand: UBA 2025, Carbon Aware Computing, SCI, mittwald Ökostrom-Blog.
 */
export const GRID_CARBON_SOURCE_KNOWLEDGE =
  `## Quellenwissen (für Antworten nutzen — keine erfundenen Fakten)\n\n` +
  `### Carbon Aware Computing (https://www.carbon-aware-computing.com/)\n` +
  `- Idee: Time Shifting / Demand Shifting — Rechenlast in Zeiten legen, in denen der Strommix möglichst viel Erneuerbare hat (niedrige Grid Carbon Intensity).\n` +
  `- Open-Source-Libs (.NET NuGet, PowerShell, Hangfire, Java Quartz), Forecast- und Intensity-APIs, Prometheus/KEDA-Exporter.\n` +
  `- Forecast-Daten Europa (ohne UK): Energy Charts (Fraunhofer ISE), Lizenz CC0; Basis u. a. ENTSO-E (Wind on-/offshore, Solar); weitere Erneuerbare oft Interpolation.\n` +
  `- Aktive Regionen u. a. DE, FR, AT, CH, UK. DE-Rohdaten (JSON, 15-Min): ${GRID_CARBON_FORECAST_DATA_URL}\n` +
  `- Nutzt das Carbon Aware SDK der Green Software Foundation; APIs: forecast.carbon-aware-computing.com, intensity.carbon-aware-computing.com\n\n` +
  `### Carbon Aware SDK (GSF)\n` +
  `- Open-Source-SDK der Green Software Foundation: beste Ausführungszeit / Carbon Intensity für Regionen berechnen — produktiv für Pipelines und Batch-Jobs.\n` +
  `- ${GRID_CARBON_SDK_URL}\n\n` +
  `### Software Carbon Intensity — SCI (https://sci.greensoftware.foundation/)\n` +
  `- Rate (nicht Totale): SCI = (O + M) / R — O = E × I (Energie × regionsspezifische Intensität gCO₂eq/kWh), M = anteilige Hardware-Emissionen, R = Funktionseinheit (z. B. API-Call, Batch).\n` +
  `- Drei Hebel: Energy Efficiency, Hardware Efficiency, Carbon Awareness (Zeit-/Region-Shift zu saubererem Strom).\n` +
  `- Location-based Grid-Intensität; Market-based Measures (RECs, Offsets, PPAs) senken den SCI-Score nicht.\n` +
  `- ISO-Standard (ISO 21031); GSF: auch SCI for AI (Training/Inference).\n\n` +
  `### UBA — deutscher Strommix\n` +
  `- Spezifische CO₂-Emissionen je kWh Stromverbrauch (Jahresmittel): 2025 = 344 g/kWh, 2024 = 353, 2023 = 379.\n` +
  `- Indikator für Klimaverträglichkeit der Stromerzeugung; beeinflusst u. a. durch EE-Anteil, Verbrauch, Stromhandelssaldo.\n` +
  `- https://www.umweltbundesamt.de/themen/klima-energie/energieversorgung/strom-waermeversorgung-in-zahlen\n\n` +
  `### mittwald — 100 % Ökostrom\n` +
  `- Rechenzentrum/Hosting: 100 % Strom aus erneuerbaren Quellen in Europa (Wind, Sonne, Biomasse) über Grün-Tarif mit Herkunftsnachweisen (HKN).\n` +
  `- Bewusst keine Wasserkraft-Nachweise (Greenwashing-Risiko). HKN werden im UBA-Herkunftsnachweisregister entwertet (einmalige Anrechnung).\n` +
  `- Physischer Netzstrom bleibt ein Mix; HKN ordnen rechnerisch EE zu. Forecast (Grid Intensity) ≠ Herkunftsnachweis — Time Shifting ergänzt Ökostrom-Bezug.\n` +
  `- Zusätzlich u. a. eigene PV, Energiemanagement ISO 50001. ${MITTWALD_OEKOSTROM_URL}\n\n` +
  `### mittwald AI Hosting\n` +
  `- Managed LLM-API in DE (OpenAI-kompatibel), Modelle fully managed — Chat, Embeddings, Batch. Doku: https://developer.mittwald.de/de/docs/v2/platform/aihosting/\n`;

export const GRID_CARBON_EXPLAIN_SHORT =
  "24-Stunden-Prognose: Wann im deutschen Stromnetz besonders viel regenerativer Strom erwartet wird — als Orientierung, rechenintensive KI-Jobs passend zu timen.";

/** Abgrenzung Ökostrom-Bezug (mittwald) vs. Strommix-Forecast — nur im Use-Case-Panel. */
export const GRID_CARBON_EXPLAIN_OEKOSTROM =
  "mittwald bezieht 100 % Ökostrom aus nachhaltigen Quellen — per Herkunftsnachweis dokumentiert. " +
  "Der Forecast zeigt zusätzlich, wann im Gesamtnetz besonders viel Sonne, Wind und andere Erneuerbare verfügbar sind — " +
  "ein Timing-Hinweis für flexible Workloads, kein Widerspruch zum Ökostrom-Bezug.";

/** Nutzen für den Strommix-Forecast-Use-Case (Panel + Chat-Kontext). */
export const GRID_CARBON_EXPLAIN_USE_CASE =
  "Im Tagesverlauf schwankt, wie viel regenerativer Strom im deutschen Netz ist — tagsüber oft Solarstrom, " +
  "bei Wind hohe Nacht- oder Morgenphasen. Rechenintensive KI-Jobs lassen sich in diese Fenster legen, " +
  "wenn sie nicht sofort laufen müssen — lokal auf eigener Hardware oder in der Cloud.";

export const GRID_CARBON_EXPLAIN_USE_CASE_POINTS = [
  "Lokale LLMs und GPU-Server: Embeddings, Fine-Tuning oder Batch-Inferenz starten, wenn viel Erneuerbare im Netz erwartet werden.",
  "Nicht zeitkritische Cloud-Jobs: Indizierung, Reports oder Datenpipelines verschieben; Chat und synchrone APIs laufen sofort.",
  "Niedrigere g/kWh im Forecast bedeuten typischerweise mehr Wind- und Solarstrom im Mix — ein praktischer Scheduling-Hinweis nach dem Prinzip Carbon Aware Computing, keine Live-Messung.",
] as const;

export const GRID_CARBON_BADGE_TOOLTIP =
  "Prognose in 15-Min-Slots: Wann im Netz viel regenerativer Strom erwartet wird — niedrigere g/kWh = gute Phase für Batch-Jobs und lokale LLMs. " +
  "Die CO₂-Zeile unter Antworten ist separat: Token-Schätzung × UBA-Jahresmittel 344 g/kWh, noch kein Live-Strommix zum Prompt-Zeitpunkt.";

export const GRID_CARBON_FORECAST_SYSTEM_PROMPT =
  "Du beantwortest Fragen zum Use Case „Strommix-Forecast 24 h“ im mittwald KI-Playground.\n\n" +
  "Der Nutzer sieht ein Panel mit der Prognose der CO₂-Intensität des deutschen Strommixes (g CO₂/kWh).\n\n" +
  "KERNLOGIK (niemals vertauschen):\n" +
  "- Niedrigere g/kWh = mehr Erneuerbare im Netz = BESSER für Batch-Jobs, Embeddings, lokale LLMs.\n" +
  "- „GERADE“ (current) ist NICHT automatisch das günstigste Fenster — das steht separat als GÜNSTIGSTES FENSTER (24 h).\n" +
  "- UBA-Jahresmittel 344 g/kWh (2025) = Referenzwert, nicht „jetzt“ und nicht das Minimum.\n" +
  "- Wenn gerade > Minimum: Batch verschieben auf Minimum-Zeitpunkt empfehlen, nicht „jetzt starten“.\n\n" +
  "ÖKOSTROM: mittwald bezieht 100 % Ökostrom (HKN) — Forecast ergänzt das um Timing im Gesamtnetz, widerspricht nicht.\n\n" +
  GRID_CARBON_SOURCE_KNOWLEDGE +
  "\nREGELN:\n" +
  "- Nur g/kWh-Zahlen aus dem Forecast-Kontext — keine erfundenen Intensitätswerte.\n" +
  "- Bei Begriffen wie Time Shifting, SCI, HKN, Carbon Aware SDK: aus Quellenwissen antworten und passende URL nennen.\n" +
  "- „Was kann ich damit anfangen?“ → nicht zeitkritische KI-Jobs timen; konkret: gerade vs. günstigstes Fenster.\n" +
  "- Chat/synchrone APIs: sofort OK. Batch: günstigstes Fenster nennen.\n" +
  "- CO₂-Zeile unter Antworten = Token × UBA-Jahresmittel, nicht dieser Forecast.\n" +
  "- Deutsch, klar, 4–8 Sätze, Markdown ok. Keine erfundenen URLs.";

export function formatGridCarbonRating(rating: number): string {
  return rating.toLocaleString("de-DE", {
    maximumFractionDigits: rating < 100 ? 1 : 0,
  });
}

export function formatGridCarbonBerlinTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatGridCarbonBerlinDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function gridCarbonHintLabel(hint: GridCarbonHint | null): string | null {
  if (hint === "morgen_frueh_guenstiger") return "morgen früh oft günstiger";
  if (hint === "heute_nacht_guenstiger") return "heute Nacht günstigeres Fenster";
  return null;
}

export function gridCarbonIntensityTone(rating: number): "low" | "mid" | "high" {
  if (rating < 380) return "low";
  if (rating > 500) return "high";
  return "mid";
}

export function gridCarbonBarTone(
  rating: number,
  min: number,
  _max: number,
): "low" | "mid" | "high" | "best" {
  if (rating <= min + 0.01) return "best";
  return gridCarbonIntensityTone(rating);
}

function berlinHourBucket(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pick = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}`;
}

function aggregateHourlyForContext(points: GridCarbonSeriesPoint[]) {
  const buckets = new Map<string, { sum: number; count: number; sampleTime: string }>();
  for (const p of points) {
    const key = berlinHourBucket(p.time);
    const b = buckets.get(key) ?? { sum: 0, count: 0, sampleTime: p.time };
    b.sum += p.rating;
    b.count += 1;
    buckets.set(key, b);
  }
  let minAvg = Infinity;
  const rows = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, b]) => {
      const avgRating = b.sum / b.count;
      if (avgRating < minAvg) minAvg = avgRating;
      return {
        label: formatGridCarbonBerlinDateTime(b.sampleTime).replace(/:\d{2}(?=\s)/, ":00"),
        avgRating,
      };
    });
  return rows.map((r) => ({
    ...r,
    isMin: Math.abs(r.avgRating - minAvg) < 0.5,
  }));
}

const NEAR_MIN_GAP = 15;

/** Klare Einordnung für LLM-Kontext — verhindert Vertauschung von aktuell vs. Minimum. */
export function formatGridCarbonInterpretation(summary: GridCarbonSummary): string {
  const cur = summary.current.rating;
  const min = summary.next24h.min;
  const max = summary.next24h.max;
  const minAt = formatGridCarbonBerlinDateTime(summary.next24h.minAt);
  const curAt = formatGridCarbonBerlinDateTime(summary.current.at);
  const nearMin = Math.abs(cur - min) < NEAR_MIN_GAP;
  const hint = gridCarbonHintLabel(summary.hint);

  return (
    `GERADE (Prognose): ~${formatGridCarbonRating(cur)} g/kWh (${curAt})\n` +
    `GÜNSTIGSTES FENSTER (24 h): ~${formatGridCarbonRating(min)} g/kWh (ca. ${minAt}) ← Batch/Embeddings/lokale LLMs hier planen\n` +
    `SPITZE (24 h): ~${formatGridCarbonRating(max)} g/kWh\n` +
    `UBA-Jahresmittel ${summary.baselineUba2025} g/kWh = Referenzwert 2025, NICHT „gerade“ und NICHT das günstigste Fenster.\n` +
    `EINORDNUNG JETZT: ${
      nearMin
        ? "Aktueller Wert nahe am Minimum — gute Phase für flexible Jobs."
        : `Aktueller Wert (${formatGridCarbonRating(cur)}) ist HÖHER als das günstigste Fenster (${formatGridCarbonRating(min)}) — nicht „jetzt“ als optimale Batch-Phase empfehlen.`
    }\n` +
    (hint ? `TIPP: ${hint}` : "")
  );
}

/** Live-Forecast für Chat-Kontext — nur im Strommix-Use-Case anhängen. */
export function formatGridCarbonForecastContext(summary: GridCarbonSummary): string {
  const hourly = aggregateHourlyForContext(summary.series24h);
  const hourlyLines = hourly
    .map(
      (h) =>
        `${h.label}: ~${formatGridCarbonRating(h.avgRating)} g/kWh${
          h.isMin ? " ← günstigstes Fenster (Stundenmittel)" : ""
        }`,
    )
    .join("\n");
  const updated =
    summary.updatedAt != null
      ? summary.updatedAt.slice(0, 16).replace("T", " ")
      : "unbekannt";

  return (
    `[Playground — Strommix-Forecast DE: Live-Prognosedaten für die nächsten 24 Stunden. Stand: ${updated}. ` +
    `Quelle: Carbon-Aware-Forecast.]\n\n` +
    `WICHTIG: Beantworte die Nutzerfrage NUR anhand dieser Zahlen. Keine erfundenen g/kWh, kein Wetter, keine Preise.\n\n` +
    `--- Was das Panel ist ---\n` +
    `Prognose der CO₂-Intensität des deutschen Stromnetzes (${summary.unit}), je 15 Min. — Orientierung für Carbon Aware Computing (Time Shifting). ` +
    `Mehr: ${GRID_CARBON_AWARE_COMPUTING_URL} ` +
    `Das ist nicht die Chat-GPU-CO₂-Anzeige unter Assistenten-Antworten.\n\n` +
    `--- Ökostrom & Forecast ---\n${GRID_CARBON_EXPLAIN_OEKOSTROM}\n\n` +
    `--- Wofür (Praxis) ---\n` +
    `${GRID_CARBON_EXPLAIN_USE_CASE}\n` +
    `${GRID_CARBON_EXPLAIN_USE_CASE_POINTS.map((p) => `• ${p}`).join("\n")}\n\n` +
    `--- Weiterführende Quellen (Links) ---\n${formatGridCarbonSourcesBlock()}\n` +
    `(Ausführliches Quellenwissen steht im System-Prompt — bei SCI, Time Shifting, HKN, UBA daraus antworten.)\n\n` +
    `--- Einordnung (WICHTIG — nicht vertauschen) ---\n${formatGridCarbonInterpretation(summary)}\n\n` +
    `--- Stundenmittel ---\n${hourlyLines}`
  );
}

export async function fetchGridCarbonSummary(): Promise<GridCarbonSummary | null> {
  const res = await fetch(apiUrl("/api/carbon/grid-de"), {
    headers: playgroundApiHeaders({ Accept: "application/json" }),
  });
  await ensureOkApiResponse(res);
  return (await res.json()) as GridCarbonSummary;
}

export function gridCarbonRefreshIntervalMs(): number {
  return REFRESH_MS;
}
