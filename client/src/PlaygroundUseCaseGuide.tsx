import type { PlaygroundUseCase } from "./playgroundUseCases";
import { WHISPER_CHUNK_MAX_SECONDS } from "./blobToWav";

type Props = {
  useCase: PlaygroundUseCase;
  onBack: () => void;
  onStartRecording?: () => void;
  speechEnabled?: boolean;
  recording?: boolean;
  transcribeProgress?: string | null;
};

export function PlaygroundUseCaseGuide({
  useCase,
  onBack,
  onStartRecording,
  speechEnabled,
  recording,
  transcribeProgress,
}: Props) {
  const chunkMin = Math.round(WHISPER_CHUNK_MAX_SECONDS / 60);

  return (
    <div className="w-full max-w-[960px] rounded-2xl border border-playground-border bg-playground-sidebar px-5 py-5 sm:rounded-3xl sm:px-6 sm:py-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-playground-send/10 text-xl"
            aria-hidden
          >
            {useCase.icon}
          </span>
          <div>
            <p className="playground-text-small font-bold text-playground-muted">{useCase.subtitle}</p>
            <h2 className="playground-text-lead font-display font-semibold text-playground-ink">
              {useCase.title}
            </h2>
            <p className="playground-text-tiny mt-0.5 font-medium text-playground-muted">
              Modell: {useCase.modelLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="playground-text-small shrink-0 font-medium text-playground-muted underline decoration-playground-border underline-offset-2 hover:text-playground-ink"
        >
          Alle Use Cases
        </button>
      </div>

      {useCase.prefersLongSpeech ? (
        <p className="playground-text-small mb-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 font-medium text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          <span className="mr-1.5" aria-hidden>
            ⏱
          </span>
          Whisper-Limit ~20 min — Aufnahmen länger als <strong>{chunkMin} min</strong> werden automatisch in
          Abschnitte geteilt und nacheinander transkribiert. Du kannst die Aufnahme beliebig lang halten.
        </p>
      ) : null}

      {useCase.prefersImage ? (
        <p className="playground-text-small mb-3 rounded-xl border border-playground-border bg-playground-main px-3 py-2.5 font-medium text-playground-muted">
          <span className="mr-1.5" aria-hidden>
            📎
          </span>
          Screenshot oder Bild per <strong className="text-playground-ink">+</strong> im Eingabefeld
          anhängen — das Modell wertet es mit aus.
        </p>
      ) : null}

      {useCase.copyableOutput ? (
        <p className="playground-text-small mb-3 rounded-xl border border-playground-border bg-playground-main px-3 py-2.5 font-medium text-playground-muted">
          <span className="mr-1.5" aria-hidden>
            ⧉
          </span>
          Nach der Antwort erscheinen <strong className="text-playground-ink">Kopieren-Buttons</strong>{" "}
          — fertige Texte direkt übernehmen.
        </p>
      ) : null}

      <ol className="playground-text-small mb-4 list-decimal space-y-1.5 pl-4 font-medium text-playground-muted marker:font-semibold marker:text-playground-ink">
        {useCase.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {transcribeProgress ? (
        <p className="playground-text-tiny mb-3 font-medium text-playground-muted" role="status">
          {transcribeProgress}
        </p>
      ) : null}

      {useCase.prefersSpeech && speechEnabled && onStartRecording ? (
        <button
          type="button"
          onClick={onStartRecording}
          disabled={recording}
          className="playground-text-small inline-flex h-10 items-center justify-center gap-2 rounded-full bg-playground-send px-4 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          <span aria-hidden>🎙</span>
          {recording
            ? "Aufnahme läuft …"
            : (useCase.recordButtonLabel ?? "Kundengespräch aufnehmen")}
        </button>
      ) : null}
    </div>
  );
}
