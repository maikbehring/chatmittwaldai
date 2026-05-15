type Props = {
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
};

function CancelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConfirmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Abbrechen (X) und Bestätigen (Haken) wie bei ChatGPT während der Sprachaufnahme. */
export function VoiceRecordingControls({ onCancel, onConfirm, disabled = false }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        title="Aufnahme verwerfen"
        aria-label="Aufnahme verwerfen"
        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <CancelIcon />
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        title="Aufnahme beenden und transkribieren"
        aria-label="Aufnahme beenden und transkribieren"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-500 text-neutral-800 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sky-400 dark:text-neutral-100 dark:hover:bg-sky-950/40"
      >
        <ConfirmIcon />
      </button>
    </div>
  );
}
