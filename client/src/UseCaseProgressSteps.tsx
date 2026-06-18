export type UseCaseProgressStepStatus = "pending" | "active" | "done";

export type UseCaseProgressStep = {
  id: string;
  label: string;
  status: UseCaseProgressStepStatus;
};

type Props = {
  steps: UseCaseProgressStep[];
  /** Fortschrittsbalken: abgeschlossene Schritte / gesamt */
  ariaLabel?: string;
  accentClassName?: string;
  /** Kompakte Zeile für Composer-/Status-Leiste */
  variant?: "full" | "compact";
  /** Zusatzzeile unter dem aktiven Schritt (z. B. Chunk-Details). */
  detail?: string | null;
};

const ACCENT_BAR: Record<string, string> = {
  violet: "bg-violet-500 dark:bg-violet-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  sky: "bg-sky-500 dark:bg-sky-400",
  amber: "bg-amber-500 dark:bg-amber-400",
};

export function getWeekendVisitProgressSteps(
  phase: "prepare" | "sources" | "generate" | null,
): UseCaseProgressStep[] {
  const prepareActive = phase === "prepare";
  const sourcesActive = phase === "sources";
  const generateActive = phase === "generate";
  return [
    {
      id: "prepare",
      label: "Stadt & kommendes Wochenende",
      status: prepareActive ? "active" : phase === null ? "pending" : "done",
    },
    {
      id: "sources",
      label: "Wikipedia & Wetter (Open-Meteo)",
      status: prepareActive
        ? "pending"
        : sourcesActive
          ? "active"
          : generateActive
            ? "done"
            : "pending",
    },
    {
      id: "generate",
      label: "Wochenend-Ideen mit KI",
      status: sourcesActive ? "pending" : generateActive ? "active" : "pending",
    },
  ];
}

export function getAudioTranscribeProgressSteps(
  transcribing: boolean,
  formatting: boolean,
  chunk?: { current: number; total: number } | null,
  preparing?: boolean,
): UseCaseProgressStep[] {
  let transcribeLabel = "Audiodatei transkribieren";
  if (preparing) {
    transcribeLabel = "Audio dekodieren & Abschnitte planen";
  } else if (transcribing) {
    if (chunk && chunk.total > 1) {
      transcribeLabel = `Whisper transkribiert (Abschnitt ${chunk.current}/${chunk.total})`;
    } else {
      transcribeLabel = "Whisper transkribiert";
    }
  } else if (formatting) {
    transcribeLabel = "Whisper-Transkript fertig";
  }

  return [
    {
      id: "transcribe",
      label: transcribeLabel,
      status: preparing || transcribing ? "active" : formatting ? "done" : "pending",
    },
    {
      id: "format",
      label: formatting ? "Qwen bereinigt Volltranskript" : "Transkript mit Qwen bereinigen",
      status: preparing || transcribing ? "pending" : formatting ? "active" : "pending",
    },
  ];
}

export function getPriceCompareProgressSteps(
  searchRound: { round: number; total: number } | null,
  generating: boolean,
): UseCaseProgressStep[] {
  const searching = searchRound != null;
  return [
    {
      id: "search",
      label: searching
        ? `Preise suchen (Runde ${searchRound.round}/${searchRound.total})`
        : "Preise im Internet suchen",
      status: searching ? "active" : generating ? "done" : "pending",
    },
    {
      id: "compare",
      label: "Vergleich mit KI erstellen",
      status: searching ? "pending" : generating ? "active" : "pending",
    },
  ];
}

export function getAiHostingGuideProgressSteps(
  docsLoading: boolean,
  guideGenerating: boolean,
): UseCaseProgressStep[] {
  return [
    {
      id: "docs",
      label: "Developer-Doku laden",
      status: docsLoading ? "active" : "done",
    },
    {
      id: "guide",
      label: "Guide mit KI erstellen",
      status: docsLoading ? "pending" : guideGenerating ? "active" : "done",
    },
  ];
}

function useProgressMetrics(steps: UseCaseProgressStep[]) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const activeIndex = steps.findIndex((s) => s.status === "active");
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;
  const progressPct =
    total === 0
      ? 0
      : Math.round(
          ((doneCount + (activeIndex >= 0 ? 0.45 : 0)) / total) * 100,
        );
  const stepLabel = Math.min(doneCount + (activeIndex >= 0 ? 1 : 0), total);
  return { total, doneCount, activeIndex, activeStep, progressPct, stepLabel };
}

export function UseCaseProgressSteps({
  steps,
  ariaLabel = "Fortschritt",
  accentClassName = "violet",
  variant = "full",
  detail = null,
}: Props) {
  const { total, activeIndex, activeStep, progressPct, stepLabel } =
    useProgressMetrics(steps);

  const barColor = ACCENT_BAR[accentClassName] ?? ACCENT_BAR.violet;

  if (variant === "compact") {
    return (
      <div
        className="w-full min-w-0"
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="playground-text-tiny min-w-0 truncate text-playground-muted">
            {activeStep ? `${activeStep.label} …` : "Fertig"}
          </p>
          <p className="playground-text-tiny shrink-0 tabular-nums text-playground-muted">
            {stepLabel}/{total}
          </p>
        </div>
        {detail ? (
          <p className="playground-text-tiny mb-1 min-w-0 text-playground-muted/90">{detail}</p>
        ) : null}
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
          aria-hidden
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${Math.max(progressPct, activeIndex >= 0 ? 8 : 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md rounded-xl border border-playground-border bg-playground-main/80 px-3 py-3 sm:px-4"
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="playground-text-tiny font-semibold uppercase tracking-wide text-playground-muted">
          Fortschritt
        </p>
        <p className="playground-text-tiny tabular-nums text-playground-muted">
          Schritt {stepLabel} von {total}
        </p>
      </div>
      <div
        className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        aria-hidden
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.max(progressPct, activeIndex >= 0 ? 8 : 0)}%` }}
        />
      </div>
      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2.5">
            <StepIcon status={step.status} accentClassName={accentClassName} />
            <span
              className={`playground-text-small leading-snug ${
                step.status === "pending"
                  ? "text-playground-muted"
                  : step.status === "active"
                    ? "font-medium text-playground-ink"
                    : "text-playground-muted"
              }`}
            >
              {step.label}
              {step.status === "active" ? " …" : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepIcon({
  status,
  accentClassName,
}: {
  status: UseCaseProgressStepStatus;
  accentClassName: string;
}) {
  if (status === "done") {
    return (
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white dark:bg-emerald-600"
        aria-hidden
      >
        ✓
      </span>
    );
  }
  if (status === "active") {
    const spinBorder =
      accentClassName === "emerald"
        ? "border-emerald-500 dark:border-emerald-400"
        : accentClassName === "sky"
          ? "border-sky-500 dark:border-sky-400"
          : accentClassName === "amber"
            ? "border-amber-500 dark:border-amber-400"
            : "border-violet-500 dark:border-violet-400";
    return (
      <span
        className={`mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${spinBorder}`}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-neutral-300 dark:border-neutral-600"
      aria-hidden
    />
  );
}
