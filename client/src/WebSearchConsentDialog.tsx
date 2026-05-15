import { useEffect } from "react";
import { providerLabel, webSearchDataTransferHint, type WebSearchConfig } from "./webSearch";

type Props = {
  open: boolean;
  webSearchConfig: WebSearchConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
};

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
          Websuche aktivieren?
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>{webSearchDataTransferHint(webSearchConfig)}</p>
          <p>
            Der Anbieter <strong className="font-medium text-neutral-800 dark:text-neutral-100">{provider}</strong>{" "}
            kann Suchanfragen und technische Daten (z. B. IP-Adresse) verarbeiten und nach eigenen Regeln speichern.
            Dein Chatverlauf bleibt im Browser; nur die <strong className="font-medium">Suchanfrage</strong> geht über
            unseren Server an den Suchdienst.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Diese Bestätigung wird einmalig in diesem Browser gespeichert. Du kannst die Websuche jederzeit wieder
            deaktivieren.
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
