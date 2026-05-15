import { useEffect, useMemo, useRef, useState } from "react";
import {
  getInferencePreset,
  isQwen3Model,
  MODEL_GPT_OSS,
  type GptOssReasoning,
} from "./modelPresets";

export type ModelSettingsDockProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  modelId: string;
  onReapplyPreset: () => void;
  temperature: number;
  setTemperature: (v: number) => void;
  topP: number | null;
  setTopP: (v: number | null) => void;
  topK: number | null;
  setTopK: (v: number | null) => void;
  presencePenalty: number | null;
  setPresencePenalty: (v: number | null) => void;
  maxTokens: number | null;
  setMaxTokens: (v: number | null) => void;
  extraBody: Record<string, unknown> | null;
  setExtraBody: (v: Record<string, unknown> | null) => void;
  gptOssReasoning: GptOssReasoning;
  setGptOssReasoning: (v: GptOssReasoning) => void;
  qwenVisionOcr: boolean;
  setQwenVisionOcr: (v: boolean) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  webSearchConfig: import("./webSearch").WebSearchConfig | null;
  webSearchDefaultEnabled: boolean;
  onWebSearchDefaultChange: (enabled: boolean) => void;
  webSearchConsentGranted: boolean;
  onRevokeWebSearchConsent: () => void;
};

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function numOrNull(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ModelSettingsDock(props: ModelSettingsDockProps) {
  const {
    open,
    onOpenChange,
    busy,
    modelId,
    onReapplyPreset,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    presencePenalty,
    setPresencePenalty,
    maxTokens,
    setMaxTokens,
    extraBody,
    setExtraBody,
    gptOssReasoning,
    setGptOssReasoning,
    qwenVisionOcr,
    setQwenVisionOcr,
    systemPrompt,
    setSystemPrompt,
    webSearchConfig,
    webSearchDefaultEnabled,
    onWebSearchDefaultChange,
    webSearchConsentGranted,
    onRevokeWebSearchConsent,
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const [extraDraft, setExtraDraft] = useState("");
  const [extraErr, setExtraErr] = useState<string | null>(null);

  const hint = useMemo(() => getInferencePreset(modelId).hint, [modelId]);

  useEffect(() => {
    if (!open) return;
    setExtraDraft(extraBody && Object.keys(extraBody).length > 0 ? JSON.stringify(extraBody, null, 2) : "");
    setExtraErr(null);
  }, [open, extraBody]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const commitExtraBody = () => {
    const t = extraDraft.trim();
    if (t === "") {
      setExtraBody(null);
      setExtraErr(null);
      return;
    }
    try {
      const parsed = JSON.parse(t) as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        setExtraErr("extra_body muss ein JSON-Objekt sein.");
        return;
      }
      setExtraBody(parsed as Record<string, unknown>);
      setExtraErr(null);
    } catch {
      setExtraErr("Ungültiges JSON.");
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0 self-end pb-1">
      <button
        type="button"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Modell-Einstellungen"
        onClick={() => onOpenChange(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <GearIcon />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Modell-Einstellungen"
          className="absolute bottom-full left-0 z-50 mb-2 w-[min(calc(100vw-2rem),20rem)] max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 text-xs shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
        >
          <p className="mb-2 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{hint}</p>
          <button
            type="button"
            className="mb-3 w-full rounded-lg border border-neutral-200 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => {
              onReapplyPreset();
              setExtraErr(null);
            }}
          >
            Vorgaben für aktuelles Modell übernehmen
          </button>

          <label className="mb-2 block">
            <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">Temperatur</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="min-w-0 flex-1 accent-neutral-800 dark:accent-neutral-200"
              />
              <span className="w-10 shrink-0 tabular-nums text-neutral-800 dark:text-neutral-100">
                {temperature.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </label>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">top_p</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="—"
                value={topP === null ? "" : String(topP)}
                onChange={(e) => setTopP(numOrNull(e.target.value))}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">top_k</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="—"
                value={topK === null ? "" : String(topK)}
                onChange={(e) => setTopK(numOrNull(e.target.value))}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>
          </div>

          <label className="mb-2 block">
            <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">presence_penalty</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="—"
              value={presencePenalty === null ? "" : String(presencePenalty)}
              onChange={(e) => setPresencePenalty(numOrNull(e.target.value))}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="mb-2 block">
            <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">max_tokens</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="—"
              value={maxTokens === null ? "" : String(maxTokens)}
              onChange={(e) => {
                const n = numOrNull(e.target.value);
                setMaxTokens(n === null ? null : Math.max(1, Math.floor(n)));
              }}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          {modelId === MODEL_GPT_OSS ? (
            <fieldset className="mb-2">
              <legend className="mb-1 text-neutral-600 dark:text-neutral-400">Reasoning</legend>
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high"] as const).map((r) => (
                  <label key={r} className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="reasoning"
                      checked={gptOssReasoning === r}
                      onChange={() => setGptOssReasoning(r)}
                      className="accent-neutral-800 dark:accent-neutral-200"
                    />
                    <span className="capitalize text-neutral-800 dark:text-neutral-100">{r}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {isQwen3Model(modelId) ? (
            <label className="mb-2 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={qwenVisionOcr}
                onChange={(e) => setQwenVisionOcr(e.target.checked)}
                className="accent-neutral-800 dark:accent-neutral-200"
              />
              <span className="text-neutral-800 dark:text-neutral-100">OCR-Modus bei Qwen-Bildern</span>
            </label>
          ) : null}

          {webSearchConfig && webSearchConfig.enabled !== false ? (
            <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/50">
              <p className="mb-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
                Websuche (Server)
              </p>
              <p className="mb-2 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
                Standard: {webSearchConfig.providers.duckduckgo?.label ?? "DuckDuckGo"} (kostenlos, ohne
                API-Key). Pro Chat im Header mit „Websuche“ ein-/ausschalten.
                {webSearchConfig.provider === "serpapi"
                  ? " Aktiv: Google (SerpAPI)."
                  : webSearchConfig.provider === "serper"
                    ? " Aktiv: Google (Serper)."
                    : ""}
              </p>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={webSearchDefaultEnabled}
                  onChange={(e) => onWebSearchDefaultChange(e.target.checked)}
                  disabled={!webSearchConsentGranted}
                  className="accent-neutral-800 dark:accent-neutral-200"
                />
                <span className="text-[11px] text-neutral-800 dark:text-neutral-100">
                  Neue Chats starten mit aktivierter Websuche
                </span>
              </label>
              {webSearchConsentGranted ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  onClick={() => {
                    const ok = window.confirm(
                      "Websuche-Einwilligung für diesen Browser zurückziehen?\n\nDie Websuche wird in allen Chats deaktiviert. Beim nächsten Aktivieren erscheint der Hinweis-Dialog erneut.",
                    );
                    if (ok) onRevokeWebSearchConsent();
                  }}
                >
                  Einwilligung zurückziehen
                </button>
              ) : null}
            </div>
          ) : null}

          <label className="mb-2 block">
            <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">Systemanweisung</span>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              placeholder="Optional — Leer lassen für keine zusätzliche Systemzeile."
              className="w-full resize-y rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[11px] leading-relaxed text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>

          <label className="mb-1 block">
            <span className="mb-0.5 block text-neutral-600 dark:text-neutral-400">extra_body (JSON-Objekt)</span>
            <textarea
              value={extraDraft}
              onChange={(e) => setExtraDraft(e.target.value)}
              onBlur={commitExtraBody}
              spellCheck={false}
              rows={4}
              placeholder="{ }"
              className="w-full resize-y rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-neutral-900 outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
          {extraErr ? <p className="mb-2 text-[11px] text-red-600 dark:text-red-400">{extraErr}</p> : null}
          <button
            type="button"
            className="w-full rounded-md bg-neutral-200 py-1 text-[11px] font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            onClick={commitExtraBody}
          >
            extra_body anwenden
          </button>
        </div>
      ) : null}
    </div>
  );
}
