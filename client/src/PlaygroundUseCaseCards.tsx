import type { PlaygroundUseCase, PlaygroundUseCaseId } from "./playgroundUseCases";
import { getUseCasesByCategory } from "./playgroundUseCases";

type Props = {
  cases: PlaygroundUseCase[];
  activeId: PlaygroundUseCaseId | null;
  disabled?: boolean;
  onSelect: (id: PlaygroundUseCaseId) => void;
};

function UseCaseCard({
  uc,
  active,
  disabled,
  onSelect,
}: {
  uc: PlaygroundUseCase;
  active: boolean;
  disabled?: boolean;
  onSelect: (id: PlaygroundUseCaseId) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(uc.id)}
      className={`group flex h-full flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition sm:gap-3 sm:rounded-3xl sm:p-5 ${
        active
          ? "border-playground-send bg-playground-sidebar shadow-sm ring-1 ring-playground-send/20"
          : "border-playground-border bg-playground-sidebar hover:border-playground-muted/30 hover:bg-playground-muted/[0.04]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition ${
            active
              ? "bg-playground-send/10"
              : "bg-playground-muted/[0.08] group-hover:bg-playground-muted/[0.12]"
          }`}
          aria-hidden
        >
          {uc.icon}
        </span>
        <span className="playground-text-tiny rounded-full bg-playground-muted/[0.08] px-2 py-0.5 font-medium text-playground-ink">
          {uc.modelLabel}
        </span>
      </div>
      <div className="space-y-1">
        <p className="playground-text-small font-bold uppercase tracking-wide text-playground-muted">
          {uc.subtitle}
        </p>
        <h2 className="playground-text-lead font-display font-semibold leading-snug text-playground-ink">
          {uc.title}
        </h2>
        <p className="playground-text-small font-medium leading-snug text-playground-muted">
          {uc.description}
        </p>
      </div>
      <span
        className={`playground-text-small mt-auto font-bold ${
          active ? "text-playground-send" : "text-playground-muted group-hover:text-playground-ink"
        }`}
      >
        {active ? "Aktiv — loslegen ↓" : "Use Case starten →"}
      </span>
    </button>
  );
}

export function PlaygroundUseCaseCards({ cases, activeId, disabled, onSelect }: Props) {
  const grouped = getUseCasesByCategory().map((group) => ({
    ...group,
    cases: group.cases.filter((uc) => cases.some((c) => c.id === uc.id)),
  }));

  return (
    <div className="w-full max-w-[960px] space-y-4 sm:space-y-5">
      {grouped.map((group) =>
        group.cases.length > 0 ? (
          <section key={group.category} aria-labelledby={`uc-cat-${group.category}`}>
            <h2
              id={`uc-cat-${group.category}`}
              className="playground-text-tiny mb-2 text-center font-bold uppercase tracking-[0.12em] text-playground-muted sm:mb-2.5"
            >
              {group.label}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {group.cases.map((uc) => (
                <UseCaseCard
                  key={uc.id}
                  uc={uc}
                  active={activeId === uc.id}
                  disabled={disabled}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
