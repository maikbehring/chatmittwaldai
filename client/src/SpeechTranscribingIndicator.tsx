type Props = {
  className?: string;
};

export function SpeechTranscribingIndicator({ className = "" }: Props) {
  return (
    <div
      className={`flex min-h-[44px] flex-1 items-center gap-2.5 px-1 py-2.5 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="voice-transcribe-dots flex gap-1" aria-hidden>
        <span className="voice-transcribe-dot" />
        <span className="voice-transcribe-dot" />
        <span className="voice-transcribe-dot" />
      </span>
      <span className="text-[15px] text-neutral-500 dark:text-neutral-400">Wird verarbeitet…</span>
    </div>
  );
}
