import { useEffect } from "react";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ClearBrowserCacheDialog({ open, onConfirm, onCancel }: Props) {
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
        aria-labelledby="clear-browser-cache-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-600 dark:bg-slate-900"
      >
        <h2
          id="clear-browser-cache-title"
          className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Browsercache löschen?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          In diesem Browser werden alle gespeicherten Playground-Daten entfernt: Chatverläufe,
          Modell-Einstellungen, Design-Auswahl und die Einwilligung zur Websuche. Auf dem Server
          werden keine Chats gespeichert — betroffen ist nur der lokale Speicher (
          <span className="font-medium">localStorage</span>).
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Die Seite wird danach neu geladen.
        </p>
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Cache löschen
          </button>
        </div>
      </div>
    </div>
  );
}
