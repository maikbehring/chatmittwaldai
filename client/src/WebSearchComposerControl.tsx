import { providerLabel, webSearchDataTransferHint, type WebSearchConfig } from "./webSearch";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

type SharedProps = {
  config: WebSearchConfig | null;
  active: boolean;
  searching: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onDeactivate: () => void;
};

/** Aktiver Modus-Chip über dem Eingabefeld (ChatGPT-Stil). */
export function WebSearchModeChip({
  config,
  active,
  searching,
  disabled,
  onDeactivate,
}: Omit<SharedProps, "onToggle"> & { onDeactivate: () => void }) {
  if (!active || config?.enabled === false) return null;
  const label = providerLabel(config);

  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-0.5">
      <span
        id="web-search-privacy-hint"
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sky-100 py-1 pl-2.5 pr-1 text-xs font-medium text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/70 dark:text-sky-100 dark:ring-sky-800"
      >
        <GlobeIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
        <span className="truncate">
          {searching ? `Suche · ${label}…` : `Im Web suchen · ${label}`}
        </span>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={disabled || searching}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sky-700 hover:bg-sky-200/80 disabled:opacity-40 dark:text-sky-200 dark:hover:bg-sky-900"
          title="Websuche für diesen Chat deaktivieren"
          aria-label="Websuche deaktivieren"
        >
          <span className="text-base leading-none">×</span>
        </button>
      </span>
    </div>
  );
}

/** Globus-Toggle in der Eingabezeile (ChatGPT-Stil). */
export function WebSearchGlobeToggle({
  config,
  active,
  searching,
  disabled,
  onToggle,
}: Pick<SharedProps, "config" | "active" | "searching" | "disabled" | "onToggle">) {
  if (config?.enabled === false) return null;

  const label = providerLabel(config);
  const hint = webSearchDataTransferHint(config);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      title={
        active
          ? `${hint} Klicken zum Deaktivieren.`
          : `Im Web suchen (${label}). ${hint}`
      }
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
        active
          ? "bg-sky-100 text-sky-700 ring-1 ring-sky-300/70 dark:bg-sky-950/80 dark:text-sky-300 dark:ring-sky-700"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      } ${disabled ? "pointer-events-none opacity-40" : ""} ${searching ? "animate-pulse" : ""}`}
    >
      <GlobeIcon />
    </button>
  );
}
