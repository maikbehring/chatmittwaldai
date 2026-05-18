import { useEffect } from "react";
import { providerLabel, type WebSearchConfig } from "./webSearch";

type Props = {
  open: boolean;
  webSearchConfig: WebSearchConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function providerStorageNote(cfg: WebSearchConfig | null, provider: string): string | null {
  if (cfg?.provider === "serpapi") {
    return `In diesem Playground kann bereits ein SerpAPI-Schlüssel hinterlegt sein, damit du die Websuche direkt ausprobieren kannst. Suchanfragen werden dabei an SerpAPI (Google-Ergebnisse) übermittelt und können dort gemäß den Bedingungen von SerpAPI gespeichert oder protokolliert werden.`;
  }
  if (cfg?.provider === "serper") {
    return `In diesem Playground kann bereits ein Serper-Schlüssel hinterlegt sein, damit du die Websuche direkt ausprobieren kannst. Suchanfragen werden dabei an Serper (Google-Ergebnisse) übermittelt und können dort gemäß den Bedingungen des Anbieters gespeichert oder protokolliert werden.`;
  }
  if (cfg?.provider === "duckduckgo") {
    return `Die Suche läuft über ${provider}. Auch dort können technische Daten der Anfrage (z. B. IP-Adresse) verarbeitet werden.`;
  }
  return `Suchanfragen gehen an ${provider} und können beim jeweiligen Anbieter verarbeitet oder gespeichert werden.`;
}

export function WebSearchConsentDialog({ open, webSearchConfig, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const provider = providerLabel(webSearchConfig);
  const storageNote = providerStorageNote(webSearchConfig, provider);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Dialog schließen"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-search-consent-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-600 dark:bg-slate-900"
      >
        <h2 id="web-search-consent-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Websuche im Playground ausprobieren?
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            Mit der Websuche sollst du erleben, wie sich eine gut eingebundene Live-Suche im Chat anfühlt — das ist
            Teil der <strong className="font-medium text-neutral-800 dark:text-neutral-100">Demo</strong> dieses
            Playgrounds, kein Produktiv-Feature.
          </p>
          <p>
            Aus deiner aktuellen Eingabe und einem kurzen Auszug des Chats formuliert die mittwald-KI serverseitig{" "}
            <strong className="font-medium">eine kompakte Suchzeile</strong>. Nur diese Kurzanfrage geht an{" "}
            <strong className="font-medium text-neutral-800 dark:text-neutral-100">{provider}</strong> — nicht dein
            gesamter Verlauf. Die Chats selbst bleiben wie gewohnt nur in deinem Browser.
          </p>
          {storageNote ? <p>{storageNote}</p> : null}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Diese Bestätigung speichern wir einmalig in diesem Browser. Du kannst die Websuche jederzeit wieder
            ausschalten oder die Einwilligung unter Modell-Einstellungen (Zahnrad) → Websuche zurückziehen.
          </p>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
          >
            Verstanden, Websuche aktivieren
          </button>
        </div>
      </div>
    </div>
  );
}
