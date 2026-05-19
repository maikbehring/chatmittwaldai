import { useEffect } from "react";
import {
  getInferencePreset,
  MODEL_DEEPSEEK_V4_PRO,
  MODEL_DEVSTRAL,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
} from "./modelPresets";

const MODEL_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/";
const EUROUTER_DEEPSEEK_URL = "https://www.eurouter.ai/models/deepseek-v4-pro";

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
    id: MODEL_DEVSTRAL,
    title: "Devstral Small (24B Instruct)",
    teaser:
      "Stärker auf Code und technische Aufgaben ausgerichtet; freundlicher Parameter‑Mix für Chat und Umsetzung.",
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
    id: MODEL_DEEPSEEK_V4_PRO,
    title: "DeepSeek V4 Pro (EUrouter)",
    teaser:
      "Großes Reasoning‑/Chat‑Modell mit EU‑Routing; Anfragen laufen über EUrouter, nicht über mittwald AI Hosting.",
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
              className="text-accent underline"
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
              const docHref = id === MODEL_DEEPSEEK_V4_PRO ? EUROUTER_DEEPSEEK_URL : MODEL_DOCS_URL;
              const docLabel =
                id === MODEL_DEEPSEEK_V4_PRO
                  ? "EUrouter Modellseite"
                  : "Modell‑Dokumentation (mittwald Developer)";
              return (
                <li
                  key={id}
                  className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-700"
                >
                  <p className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {id}
                  </p>
                  <p className="mt-1 font-medium text-ink">{title}</p>
                  <p className="mt-1 text-ink-muted">{teaser}</p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-ink">Preset‑Hinweis:</span> {hint}{" "}
                    <a className="text-accent underline" href={docHref} target="_blank" rel="noreferrer">
                      ({docLabel})
                    </a>
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">
            Mit gesetztem <span className="font-mono text-[11px]">EUROUTER_API_KEY</span> ergänzt der Server
            die Modellliste um IDs aus{" "}
            <span className="font-mono text-[11px]">PLAYGROUND_EUROUTER_MODELS</span> (Standard:{" "}
            <span className="font-mono text-[11px]">deepseek-v4-pro</span>; Abschalten:{" "}
            <span className="font-mono text-[11px]">PLAYGROUND_EUROUTER_MODELS=none</span>). Welche IDs im
            Dropdown erscheinen, kann zusätzlich über{" "}
            <span className="font-mono text-[11px]">PLAYGROUND_ALLOWED_MODELS</span> eingeschränkt sein.
          </p>
        </div>
      </div>
    </div>
  );
}