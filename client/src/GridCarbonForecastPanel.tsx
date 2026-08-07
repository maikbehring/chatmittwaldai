import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchGridCarbonSummary,
  formatGridCarbonBerlinDateTime,
  formatGridCarbonBerlinTime,
  formatGridCarbonRating,
  GRID_CARBON_AWARE_COMPUTING_URL,
  GRID_CARBON_EXPLAIN_OEKOSTROM,
  GRID_CARBON_EXPLAIN_USE_CASE_POINTS,
  GRID_CARBON_SOURCE_LINKS,
  MITTWALD_OEKOSTROM_URL,
  gridCarbonBarTone,
  gridCarbonHintLabel,
  gridCarbonIntensityTone,
  type GridCarbonSummary,
} from "./gridCarbonForecast";

const BAR_TONE_CLASS = {
  best: "bg-emerald-500",
  low: "bg-emerald-500/70",
  mid: "bg-sky-500/60",
  high: "bg-amber-500/80",
} as const;

/** Alle ~3 h eine Zeitmarke (bei 15-Min-Slots = alle 12 Punkte). */
const LABEL_EVERY_N = 12;

function buildChartLabelIndices(length: number): Set<number> {
  const indices = new Set<number>();
  if (length <= 0) return indices;
  for (let i = 0; i < length; i += LABEL_EVERY_N) {
    indices.add(i);
  }
  indices.add(length - 1);
  return indices;
}

function ForecastBarChart({ summary }: { summary: GridCarbonSummary }) {
  const points = summary.series24h;
  const labelIndices = useMemo(
    () => buildChartLabelIndices(points.length),
    [points.length],
  );
  if (points.length === 0) return null;

  const min = summary.next24h.min;
  const max = summary.next24h.max;
  const span = Math.max(max - min, 1);

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-end gap-px overflow-x-auto pt-1"
        role="img"
        aria-label="Strommix-Prognose nächste 24 Stunden"
      >
        {points.map((p, i) => {
          const tone = gridCarbonBarTone(p.rating, min, max);
          const isCurrent = p.time === summary.current.at;
          const showLabel = labelIndices.has(i);
          return (
            <div
              key={p.time}
              className="flex min-w-[6px] flex-1 flex-col items-center justify-end"
              title={`${formatGridCarbonBerlinDateTime(p.time)} · ${formatGridCarbonRating(p.rating)} g/kWh`}
            >
              <div
                className={`w-full min-h-[4px] rounded-t-sm ${BAR_TONE_CLASS[tone]} ${
                  isCurrent
                    ? "ring-2 ring-playground-send ring-offset-1 dark:ring-offset-playground-sidebar"
                    : ""
                } opacity-90`}
                style={{ height: `${Math.round(8 + ((p.rating - min) / span) * 64)}px` }}
              />
              <div className="mt-1 flex h-7 w-full flex-col items-center justify-start">
                {showLabel ? (
                  <>
                    <span className="h-1.5 w-px bg-playground-border" aria-hidden />
                    <span className="playground-text-tiny whitespace-nowrap tabular-nums text-playground-muted">
                      {formatGridCarbonBerlinTime(p.time)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="playground-text-tiny text-playground-muted">
        CO₂-Intensität je 15 Min. (Uhrzeit DE) ·{" "}
        <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500 align-middle" /> günstigste Phase · Ring =
        aktueller Slot
      </p>
    </div>
  );
}

function ForecastTable({ summary }: { summary: GridCarbonSummary }) {
  const hourly = aggregateHourly(summary.series24h);
  if (hourly.length === 0) return null;

  return (
    <div className="max-h-52 overflow-y-auto rounded-xl border border-playground-border">
      <table className="w-full border-collapse playground-text-tiny">
        <thead className="sticky top-0 bg-playground-sidebar">
          <tr className="text-left text-playground-muted">
            <th className="px-2.5 py-1.5 font-semibold">Zeit (DE)</th>
            <th className="px-2.5 py-1.5 font-semibold tabular-nums">g/kWh</th>
            <th className="hidden px-2.5 py-1.5 font-semibold sm:table-cell">Einordnung</th>
          </tr>
        </thead>
        <tbody>
          {hourly.map((row) => {
            const tone = gridCarbonIntensityTone(row.avgRating);
            const label =
              row.isMin
                ? "günstigstes Fenster (≈)"
                : tone === "low"
                  ? "eher günstig"
                  : tone === "high"
                    ? "eher hoch"
                    : "mittel";
            return (
              <tr
                key={row.label}
                className={`border-t border-playground-border/60 ${row.isMin ? "bg-emerald-500/10" : ""}`}
              >
                <td className="px-2.5 py-1 font-medium text-playground-ink">{row.label}</td>
                <td className="px-2.5 py-1 tabular-nums text-playground-ink">
                  ~{formatGridCarbonRating(row.avgRating)}
                </td>
                <td className="hidden px-2.5 py-1 text-playground-muted sm:table-cell">{label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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

function aggregateHourly(points: GridCarbonSummary["series24h"]) {
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
        label: `${formatGridCarbonBerlinDateTime(b.sampleTime).replace(/:\d{2}(?=\s)/, ":00")}`,
        avgRating,
      };
    });
  return rows.map((r) => ({
    ...r,
    isMin: Math.abs(r.avgRating - minAvg) < 0.5,
  }));
}

export function GridCarbonForecastPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<GridCarbonSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGridCarbonSummary();
      if (!data?.series24h?.length) {
        throw new Error("Keine Forecast-Daten für die nächsten 24 Stunden.");
      }
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forecast konnte nicht geladen werden.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hint = summary ? gridCarbonHintLabel(summary.hint) : null;

  return (
    <div className="w-full max-w-5xl space-y-3 text-left">
      {error ? (
        <p className="playground-text-small rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-800 dark:text-red-100">
          {error}
        </p>
      ) : null}

      {summary && !loading ? (
        <>
          <section className="rounded-2xl border border-playground-border bg-playground-sidebar p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="playground-text-small font-bold text-playground-ink">
                Verlauf (15-Min-Slots, nächste 24 h)
              </h3>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="shrink-0 rounded-lg bg-playground-send px-3 py-1.5 playground-text-tiny font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aktualisieren
              </button>
            </div>
            <ForecastBarChart summary={summary} />
          </section>

          <section className="grid gap-2 rounded-2xl border border-playground-border bg-playground-sidebar p-3 sm:grid-cols-3 sm:p-4">
            <div>
              <p className="playground-text-tiny font-semibold uppercase tracking-wide text-playground-muted">
                Gerade
              </p>
              <p className="mt-0.5 playground-text-body font-display font-semibold tabular-nums text-playground-ink">
                ~{formatGridCarbonRating(summary.current.rating)} g/kWh
              </p>
              <p className="playground-text-tiny text-playground-muted">
                {formatGridCarbonBerlinTime(summary.current.at)} Uhr
              </p>
            </div>
            <div>
              <p className="playground-text-tiny font-semibold uppercase tracking-wide text-playground-muted">
                Niedrigste Phase
              </p>
              <p className="mt-0.5 playground-text-body font-display font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                ~{formatGridCarbonRating(summary.next24h.min)} g/kWh
              </p>
              <p className="playground-text-tiny text-playground-muted">
                ca. {formatGridCarbonBerlinDateTime(summary.next24h.minAt)}
              </p>
            </div>
            <div>
              <p className="playground-text-tiny font-semibold uppercase tracking-wide text-playground-muted">
                Spitze
              </p>
              <p className="mt-0.5 playground-text-body font-display font-semibold tabular-nums text-playground-ink">
                ~{formatGridCarbonRating(summary.next24h.max)} g/kWh
              </p>
              {hint ? (
                <p className="playground-text-tiny font-medium text-emerald-800 dark:text-emerald-200">
                  Tipp: {hint}
                </p>
              ) : (
                <p className="playground-text-tiny text-playground-muted">Tagesverlauf schwankt</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-playground-border bg-playground-sidebar px-3 py-3 sm:px-4">
            <p className="playground-text-small text-playground-muted">
              <strong className="font-semibold text-playground-ink">Wofür?</strong> Rechenintensive KI-Jobs
              (Embeddings, Batch, lokale LLMs) in Phasen mit viel Sonne und Wind legen — wenn sie nicht sofort
              laufen müssen. Chat und synchrone APIs starten weiter sofort.
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 playground-text-tiny text-playground-muted">
              {GRID_CARBON_EXPLAIN_USE_CASE_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="mt-2 playground-text-tiny text-playground-muted">
              {GRID_CARBON_EXPLAIN_OEKOSTROM}{" "}
              <a
                href={MITTWALD_OEKOSTROM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-playground-link underline decoration-playground-link/30 underline-offset-2"
              >
                100&nbsp;% Ökostrom
              </a>
              {" · "}
              <a
                href={GRID_CARBON_AWARE_COMPUTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-playground-link underline decoration-playground-link/30 underline-offset-2"
              >
                Carbon Aware Computing
              </a>
              {" · UBA "}
              <span className="tabular-nums">{summary.baselineUba2025} g/kWh</span>
            </p>
          </section>

          <section className="rounded-2xl border border-playground-border bg-playground-sidebar p-3 sm:p-4">
            <h4 className="mb-2 playground-text-small font-bold text-playground-ink">Stunden-Mittel</h4>
            <ForecastTable summary={summary} />
          </section>

          <section className="rounded-2xl border border-playground-border bg-playground-sidebar p-3 sm:p-4">
            <h4 className="mb-2 playground-text-small font-bold text-playground-ink">Quellen</h4>
            <ul className="columns-1 gap-x-6 space-y-1.5 sm:columns-2">
              {GRID_CARBON_SOURCE_LINKS.map((source) => (
                <li key={source.url} className="break-inside-avoid">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="playground-text-tiny font-semibold text-playground-link underline decoration-playground-link/30 underline-offset-2"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : loading ? (
        <p className="playground-text-small text-center text-playground-muted">Forecast wird geladen …</p>
      ) : null}
    </div>
  );
}
