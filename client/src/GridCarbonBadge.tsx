import {
  formatGridCarbonBerlinTime,
  formatGridCarbonRating,
  gridCarbonHintLabel,
  gridCarbonIntensityTone,
  GRID_CARBON_BADGE_TOOLTIP,
  type GridCarbonSummary,
} from "./gridCarbonForecast";

type Props = {
  summary: GridCarbonSummary | null;
  /** Use Case „Strommix-Forecast 24 h“ öffnen. */
  onOpenUseCase?: () => void;
  active?: boolean;
  className?: string;
};

const TONE_CLASS = {
  low: "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  mid: "border-playground-border bg-playground-sidebar/80 text-playground-ink",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
} as const;

export function GridCarbonBadge({ summary, onOpenUseCase, active = false, className = "" }: Props) {
  if (!summary) return null;

  const rating = formatGridCarbonRating(summary.current.rating);
  const hint = gridCarbonHintLabel(summary.hint);
  const tone = gridCarbonIntensityTone(summary.current.rating);
  const minTime = formatGridCarbonBerlinTime(summary.next24h.minAt);
  const minRating = formatGridCarbonRating(summary.next24h.min);

  const chipClass =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 " +
    "playground-text-tiny font-medium leading-snug transition hover:opacity-90 " +
    TONE_CLASS[tone] +
    (active ? " ring-2 ring-playground-send/40 ring-offset-1 dark:ring-offset-playground-main" : "");

  return (
    <button
      type="button"
      onClick={onOpenUseCase}
      className={`${chipClass} hidden cursor-pointer sm:inline-flex ${className}`.trim()}
      title={`${GRID_CARBON_BADGE_TOOLTIP} Klicken: Use Case „Strommix-Forecast 24 h“.`}
      aria-label="Strommix-Forecast 24 Stunden — Use Case öffnen"
    >
      <span aria-hidden>🌿</span>
      <span className="whitespace-nowrap tabular-nums">
        Strommix DE ~{rating} g/kWh
      </span>
      {hint ? (
        <span className="hidden font-normal text-playground-muted md:inline">
          · {hint}
        </span>
      ) : minTime ? (
        <span className="hidden font-normal text-playground-muted lg:inline">
          · min. ~{minRating} ab {minTime}
        </span>
      ) : null}
    </button>
  );
}
