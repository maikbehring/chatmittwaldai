import { formatCo2Grams, SESSION_CO2_TOOLTIP } from "./inferenceFootprint";

type Props = {
  grams: number;
  /** Nur Kurzform (z. B. eingeklappte Sidebar). */
  compact?: boolean;
  /** Als Inline-Element (z. B. Chat-Footer). */
  inline?: boolean;
  className?: string;
};

export function SessionCo2Footprint({ grams, compact, inline, className = "" }: Props) {
  if (grams <= 0) return null;

  const formatted = formatCo2Grams(grams);
  const base =
    "cursor-help tabular-nums text-neutral-400 dark:text-neutral-500 " +
    (inline || compact ? "text-[10px]" : "text-[10px] leading-snug");

  const label = compact
    ? `≈ ${formatted} g CO₂`
    : `≈ ${formatted} g CO₂eq gesamt (alle Chats)`;

  if (inline) {
    return (
      <span
        className={`${base} underline decoration-dotted decoration-neutral-300 underline-offset-2 dark:decoration-neutral-600 ${className}`.trim()}
        title={SESSION_CO2_TOOLTIP}
      >
        {label}
      </span>
    );
  }

  if (compact) {
    return (
      <p className={`${base} text-center ${className}`.trim()} title={SESSION_CO2_TOOLTIP}>
        {label}
      </p>
    );
  }

  return (
    <p className={`${base} ${className}`.trim()} title={SESSION_CO2_TOOLTIP}>
      <span className="underline decoration-dotted decoration-neutral-300 underline-offset-2 dark:decoration-neutral-600">
        ≈ {formatted} g CO₂eq
      </span>{" "}
      <span className="no-underline">gesamt (alle Chats)</span>
    </p>
  );
}
