import { useEffect } from "react";
import {
  getInferencePreset,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
  MODEL_QWEN_38,
} from "./modelPresets";

const MODEL_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Feste Reihenfolge wie im Playground-Dropdown üblich */
const MODEL_ROWS: { id: string; title: string; teaser: string }[] = [
  {
    id: MODEL_MINISTRAL,
    title: "Ministral 3 (14B Instruct)",
    teaser:
      "Kompaktes Allround-Modell für Text und Vision; in der Regel eher nüchtern und konsistent eingestellt.",
  },
  {
    id: MODEL_GPT_OSS,
    title: "gpt-oss (120B)",
    teaser:
      "Großes Modell mit einstellbarem Reasoning (low / medium / high). Reasoning wird bei diesem Modell über die Systemzeile mitgeschickt.",
  },
  {
    id: MODEL_QWEN_35,
    title: "Qwen 3.5 (122B)",
    teaser:
      "Sehr großes Kontext‑ und Chat‑Modell im Non‑Thinking‑Preset; Vision nutzt bei Bedarf eigene Parameter.",
  },
  {
    id: MODEL_QWEN_36,
    title: "Qwen 3.6 (35B)",
    teaser:
      "Effizientes Qwen‑Modell mit hohem Kontext; gleiche Instruct‑Logik wie 3.5, andere Modellgröße.",
  },
  {
    id: MODEL_QWEN_38,
    title: "Qwen 3.8 (27B)",
    teaser:
      "Neuestes Qwen mit Thinking-Modus und drei Reasoning-Tiefen (low / medium / xhigh); stark bei Code und Agenten.",
  },
];

export function ModelsOverviewOverlay({ open, onClose }: Props) {
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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="models-overview-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-600">
          <h2 id="models-overview-title" className="text-base font-semibold text-ink">
            Modelle im Playground
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 text-sm leading-relaxed">
          <p className="mb-4 text-ink-muted">
            Kurzüberblick über die im Dropdown wählbaren Modelle. Technische Details und Tarife in der{" "}
            <a
              className="font-medium text-playground-link underline decoration-playground-link/40 underline-offset-2 hover:text-playground-link-hover"
              href={MODEL_DOCS_URL}
              target="_blank"
              rel="noreferrer"
            >
              Modell‑Dokumentation (mittwald Developer)
            </a>
            .
          </p>
          <ul className="space-y-4">
            {MODEL_ROWS.map(({ id, title, teaser }) => {
              const hint = getInferencePreset(id).hint;
              return (
                <li key={id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-700">
                  <p className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">{id}</p>
                  <p className="mt-1 font-medium text-ink">{title}</p>
                  <p className="mt-1 text-ink-muted">{teaser}</p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-ink">Preset‑Hinweis:</span> {hint}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">
            Welche IDs im Dropdown erscheinen, kann auf dem Server über{" "}
            <span className="font-mono text-[11px]">PLAYGROUND_ALLOWED_MODELS</span> eingeschränkt sein.
          </p>
        </div>
      </div>
    </div>
  );
}
