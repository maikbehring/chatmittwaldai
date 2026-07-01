import { MITTWALD_FEATURE_REQUEST_URL, type PlaygroundUseCase } from "./playgroundUseCases";
import { MODEL_GPT_OSS } from "./modelPresets";
import { WHISPER_CHUNK_MAX_SECONDS } from "./blobToWav";
import { OCR_MAX_PAGES } from "./pdfToOcrImages";
import { UseCaseExperimentalBadge } from "./UseCaseExperimentalBadge";
import { UseCaseBetaBadge } from "./UseCaseBetaBadge";
import {
  MITTWALD_SALES_URL,
  MITTWALD_TARIF_CONSULT_PHONE,
  MITTWALD_TARIF_CONSULT_PHONE_TEL,
} from "./playgroundSalesLinks";

type Props = {
  useCase: PlaygroundUseCase;
  onBack: () => void;
  onStartRecording?: () => void;
  speechEnabled?: boolean;
  recording?: boolean;
  transcribeProgress?: string | null;
  briefingValues?: Record<string, string>;
  activeBriefingFieldId?: string | null;
  onBriefingChange?: (id: string, value: string) => void;
  onBriefingFieldFocus?: (id: string) => void;
};

export function PlaygroundUseCaseGuide({
  useCase,
  onBack,
  onStartRecording,
  speechEnabled,
  recording,
  transcribeProgress,
  briefingValues = {},
  activeBriefingFieldId = null,
  onBriefingChange,
  onBriefingFieldFocus,
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
              <span className="inline-flex flex-wrap items-center gap-2">
                {useCase.title}
                {useCase.experimental ? <UseCaseExperimentalBadge /> : null}
                {useCase.beta ? <UseCaseBetaBadge /> : null}
              </span>
            </h2>
            <p className="playground-text-tiny mt-0.5 font-medium text-playground-muted">
              {useCase.id !== "ai-hosting-tarifberater" ? (
                <>Modell: {useCase.modelLabel}</>
              ) : (
                <>Persönliche Beratung zu AI Hosting</>
              )}
            </p>
            {useCase.description ? (
              <p className="playground-text-small mt-2 max-w-prose text-playground-muted">
                {useCase.description}
              </p>
            ) : null}
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

      {useCase.prefersModelCompare ? (
        <p className="playground-text-small mb-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="mr-1.5" aria-hidden>
            ⚖️
          </span>
          <strong>Modell A</strong> und <strong>Modell B</strong> im Header wählen — gleicher Prompt, Antworten
          nebeneinander. Ein Vergleich zählt als <strong>2 Chat-Anfragen</strong> (Rate-Limit).
        </p>
      ) : null}

      {useCase.prefersWebSearch ? (
        <p className="playground-text-small mb-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 font-medium text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          <span className="mr-1.5" aria-hidden>
            🌐
          </span>
          <strong>Websuche</strong> ist für diesen Use Case automatisch aktiv (Globus im Eingabefeld). Jede
          Anfrage ist <strong className="text-playground-ink">eigenständig</strong> — frühere Recherchen im selben
          Chat fließen nicht in Suche oder Antwort ein. Beim ersten Mal erscheint der Einwilligungs-Dialog.
        </p>
      ) : null}

      {useCase.modelId === MODEL_GPT_OSS ? (
        <p className="playground-text-small mb-3 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 font-medium text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
          <span className="mr-1.5" aria-hidden>
            🧠
          </span>
          <strong>Reasoning</strong> steuert die Analyse-Tiefe — im Header über das{" "}
          <strong className="text-playground-ink">Zahnrad</strong> (low / medium / high). Standard: medium; high für
          umfangreiche Unterlagen.
        </p>
      ) : null}

      {useCase.prefersImage && !useCase.prefersDocument ? (
        <p className="playground-text-small mb-3 rounded-xl border border-playground-border bg-playground-main px-3 py-2.5 font-medium text-playground-muted">
          <span className="mr-1.5" aria-hidden>
            📎
          </span>
          Screenshot oder Bild per <strong className="text-playground-ink">+</strong> im Eingabefeld
          anhängen — das Modell wertet es mit aus.
        </p>
      ) : null}

      {useCase.prefersDocument ? (
        <p className="playground-text-small mb-3 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 font-medium text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
          <span className="mr-1.5" aria-hidden>
            📄
          </span>
          <strong>PDF oder Bild</strong> per <strong className="text-playground-ink">+</strong> anhängen.
          PDFs werden im Browser in Bilder umgewandelt (bessere Kopfzeilen-Erkennung als PDF-Upload direkt an
          GLM-OCR). Bis {OCR_MAX_PAGES} Seiten.
        </p>
      ) : null}

      {useCase.prefersAudioFile ? (
        <p className="playground-text-small mb-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 font-medium text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          <span className="mr-1.5" aria-hidden>
            🎙️
          </span>
          <strong>Audiodatei</strong> (MP3, WAV, FLAC, OGG, …) per{" "}
          <strong className="text-playground-ink">+</strong> anhängen. Lange Aufnahmen (~30 min und mehr) werden
          automatisch in Abschnitte geteilt und mit <strong>Whisper</strong> transkribiert.
        </p>
      ) : null}

      {useCase.id === "ai-hosting-guide" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 font-medium text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
          <span className="mr-1.5" aria-hidden>
            🤖
          </span>
          <strong>Kurz:</strong> Lädt die aktuelle Modell- und API-Doku von developer.mittwald.de und erstellt
          daraus einen verständlichen Einstiegs-Guide — inkl. Empfehlung, welches Modell wofür passt. Falls
          Qwen3.6 nicht erreichbar ist, wird automatisch Qwen3.5 als Fallback genutzt.{" "}
          <a
            href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            Modelle
          </a>
          {" · "}
          <a
            href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/api-endpoints/supported-endpoints/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            API-Endpunkte
          </a>
        </p>
      ) : null}

      {useCase.id === "ai-hosting-tarifberater" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <strong className="font-semibold text-playground-ink">Welcher Tarif passt zu deinem Projekt?</strong>{" "}
          Beschreib kurz deinen Use Case — du bekommst eine persönliche Empfehlung zu Tarif, Setup und passenden
          Modellen, orientiert an aktuellen Live-Tarifen und Praxis-Wissen.{" "}
          <span className="text-playground-muted">
            Beta im Playground — bei konkreten Kaufentscheidungen unterstützt dich unser Vertrieb gerne:{" "}
            <a
              href={MITTWALD_TARIF_CONSULT_PHONE_TEL}
              className="font-semibold text-playground-ink underline underline-offset-2"
            >
              {MITTWALD_TARIF_CONSULT_PHONE}
            </a>
            {" · "}
            <a
              href={MITTWALD_SALES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-playground-ink underline underline-offset-2"
            >
              Beratung vereinbaren
            </a>
          </span>
        </p>
      ) : null}

      {useCase.id === "client-weekend" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="mr-1.5" aria-hidden>
            🗓️
          </span>
          <strong>Kurz:</strong> Stadt eintragen — das <strong>kommende Wochenende</strong> (Samstag & Sonntag,
          Europe/Berlin) wird automatisch berechnet. Danach lädt der Playground{" "}
          <a
            href="https://de.wikipedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            Wikipedia
          </a>{" "}
          und{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            Open-Meteo
          </a>
          -Wetter und schlägt Aktivitäten mit deinem Kunden vor.
        </p>
      ) : null}

      {useCase.id === "semantic-search" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 font-medium text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
          <span className="mr-1.5" aria-hidden>
            🔎
          </span>
          <strong>Kurz:</strong> Demo-Texte sind vorausgefüllt — eigene Passagen mit <strong>Leerzeile</strong>{" "}
          trennen. Die Frage stellst du unten im Eingabefeld. Pipeline:{" "}
          <strong>Embedding</strong> (Vektorsuche) → <strong>Rerank</strong> (präzise Sortierung) →{" "}
          <strong>Qwen-Antwort</strong> mit Vergleichstabelle.
        </p>
      ) : null}

      {useCase.id === "price-compare" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 font-medium text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          <span className="mr-1.5" aria-hidden>
            💰
          </span>
          <strong>Kurz:</strong> Produkt und <strong>zwei Anbieter</strong> eintragen — der Playground sucht in mehreren
          Runden im Web nach Preisen (DuckDuckGo bzw. SerpAPI in Produktion), bis genug brauchbare Treffer da sind.
          Danach erstellt die KI einen Vergleich — nur mit Fakten aus den Treffern, keine erfundenen Preise.
        </p>
      ) : null}

      {useCase.id === "feature-requests-feed" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <span className="mr-1.5" aria-hidden>
            📋
          </span>
          Live aus{" "}
          <a
            href="https://github.com/mittwald/feature-requests"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            github.com/mittwald/feature-requests
          </a>
          {" "}— die 10 zuletzt erstellten Issues (öffentliche GitHub-API).
        </p>
      ) : null}

      {useCase.id === "feature-request" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <span className="mr-1.5" aria-hidden>
            🚀
          </span>
          Issue einreichen:{" "}
          <a
            href={MITTWALD_FEATURE_REQUEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-playground-ink underline underline-offset-2"
          >
            Feature request auf GitHub
          </a>
          {" "}— Vorlage „Feature request 🚀“ wählen, Titel und Beschreibung aus dem Playground einfügen.
        </p>
      ) : null}

      {useCase.id === "linkedin-post" ? (
        <p className="playground-text-small mb-3 rounded-xl border border-[#0A66C2]/20 bg-[#0A66C2]/5 px-3 py-2.5 font-medium text-playground-ink dark:border-[#0A66C2]/35 dark:bg-[#0A66C2]/10">
          <span className="mr-1.5" aria-hidden>
            💼
          </span>
          <strong>Tipp:</strong> Persönliches Profil posten (nicht nur Firmenseite). Keine Hashtags, keine Links im
          Text — Link ggf. in den ersten Kommentar. Feld anklicken, dann{" "}
          <strong className="text-playground-ink">🎙</strong>.
        </p>
      ) : null}

      {useCase.briefingFields && useCase.briefingFields.length > 0 && onBriefingChange && onBriefingFieldFocus ? (
        <div className="mb-4 space-y-3 rounded-xl border border-playground-border bg-playground-main p-3 sm:p-4">
          <p className="playground-text-tiny font-bold uppercase tracking-wide text-playground-muted">
            Briefing
          </p>
          {useCase.briefingFields.map((field) => {
            const active = activeBriefingFieldId === field.id;
            return (
              <label key={field.id} className="block">
                <span className="playground-text-small mb-1 block font-semibold text-playground-ink">
                  {field.label}
                </span>
                <textarea
                  value={briefingValues[field.id] ?? ""}
                  onChange={(e) => onBriefingChange(field.id, e.target.value)}
                  onFocus={() => onBriefingFieldFocus(field.id)}
                  placeholder={field.placeholder}
                  rows={
                    field.rows ??
                    (field.id === "kernbotschaft" || field.id === "cta" ? 2 : 1)
                  }
                  className={`playground-text-small w-full resize-none rounded-xl border bg-playground-sidebar px-3 py-2 font-medium text-playground-ink outline-none transition placeholder:text-playground-muted/70 ${
                    active
                      ? "border-playground-send ring-2 ring-playground-send/25"
                      : "border-playground-border focus:border-playground-send/50"
                  }`}
                />
              </label>
            );
          })}
        </div>
      ) : null}

      {useCase.copyableOutput && useCase.id !== "ai-hosting-tarifberater" ? (
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
