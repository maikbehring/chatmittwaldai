type Props = {
  className?: string;
};

export function UseCaseExperimentalBadge({ className = "" }: Props) {
  return (
    <span
      className={`playground-text-tiny shrink-0 rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 font-bold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100 ${className}`}
    >
      Experimental
    </span>
  );
}
