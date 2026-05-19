function IncognitoIcon({ className }: { className?: string }) {
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
      <path d="M12 3a7 7 0 0 0-7 7v2a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-2a7 7 0 0 0-7-7Z" />
      <path d="M9 14v2a3 3 0 0 0 6 0v-2" />
      <path d="M10 11h.01M14 11h.01" />
    </svg>
  );
}

type ToggleProps = {
  active: boolean;
  available: boolean;
  busy?: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

/** Toggle in der Eingabezeile — nur für EUrouter-Modelle sinnvoll. */
export function AnonymousModeToggle({
  active,
  available,
  busy,
  disabled,
  onToggle,
}: ToggleProps) {
  if (!available) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      title={
        active
          ? "Anonymmodus aktiv: Vor dem Versand an EUrouter werden Nachrichten über Qwen3.6 (mittwald) bereinigt. Klicken zum Deaktivieren."
          : "Anonymmodus: Personenbezogene Daten werden vor EUrouter-Anfragen über Qwen3.6 (mittwald) anonymisiert."
      }
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition sm:h-10 sm:w-10 ${
        active
          ? "bg-violet-100 text-violet-800 ring-1 ring-violet-300/70 dark:bg-violet-950/80 dark:text-violet-200 dark:ring-violet-700"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      } ${disabled ? "pointer-events-none opacity-40" : ""} ${busy ? "animate-pulse" : ""}`}
    >
      <IncognitoIcon />
    </button>
  );
}

type ChipProps = {
  active: boolean;
  busy?: boolean;
  disabled?: boolean;
  onDeactivate: () => void;
};

export function AnonymousModeChip({ active, busy, disabled, onDeactivate }: ChipProps) {
  if (!active) return null;

  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-0.5">
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-violet-100 py-1 pl-2.5 pr-1 text-xs font-medium text-violet-900 ring-1 ring-violet-200/80 dark:bg-violet-950/70 dark:text-violet-100 dark:ring-violet-800">
        <IncognitoIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
        <span className="truncate">
          {busy
            ? "Anonymisiere über Qwen3.6…"
            : "Anonym · bereinigt vor EUrouter"}
        </span>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={disabled || busy}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-violet-700 hover:bg-violet-200/80 disabled:opacity-40 dark:text-violet-200 dark:hover:bg-violet-900"
          title="Anonymmodus deaktivieren"
          aria-label="Anonymmodus deaktivieren"
        >
          <span className="text-base leading-none">×</span>
        </button>
      </span>
    </div>
  );
}
