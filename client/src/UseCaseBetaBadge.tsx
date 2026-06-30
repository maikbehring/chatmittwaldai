type Props = {
  className?: string;
};

export function UseCaseBetaBadge({ className = "" }: Props) {
  return (
    <span
      className={`playground-text-tiny shrink-0 rounded-full border border-sky-300/80 bg-sky-50 px-2 py-0.5 font-bold uppercase tracking-wide text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100 ${className}`}
    >
      Beta
    </span>
  );
}
