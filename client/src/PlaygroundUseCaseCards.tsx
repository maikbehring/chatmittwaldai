import { useCallback, useRef, useState } from "react";
import type { PlaygroundUseCase, PlaygroundUseCaseId } from "./playgroundUseCases";
import {
  getUseCaseShowcaseHighlights,
  getUseCasesByShowcaseGroup,
  RECOMMENDED_USE_CASE_ID,
  type PlaygroundUseCaseShowcaseGroup,
} from "./playgroundUseCases";
import { UseCaseExperimentalBadge } from "./UseCaseExperimentalBadge";
import { UseCaseBetaBadge } from "./UseCaseBetaBadge";

type Props = {
  cases: PlaygroundUseCase[];
  activeId: PlaygroundUseCaseId | null;
  disabled?: boolean;
  onSelect: (id: PlaygroundUseCaseId) => void;
};

function UseCaseCard({
  uc,
  active,
  recommended,
  disabled,
  onSelect,
}: {
  uc: PlaygroundUseCase;
  active: boolean;
  recommended?: boolean;
  disabled?: boolean;
  onSelect: (id: PlaygroundUseCaseId) => void;
}) {
  const highlights = getUseCaseShowcaseHighlights(uc);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(uc.id)}
      className={`group flex w-[min(100%,17.5rem)] shrink-0 snap-start flex-col gap-2.5 overflow-hidden rounded-2xl border-2 p-4 text-left transition sm:w-[17.5rem] sm:p-4 ${
        active || recommended
          ? "border-playground-send bg-playground-sidebar shadow-sm ring-1 ring-playground-send/20"
          : "border-playground-border bg-playground-sidebar hover:border-playground-muted/30 hover:bg-playground-muted/[0.04]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="space-y-2">
        {(recommended || uc.experimental || (uc.beta && !recommended)) ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {recommended ? (
              <span className="playground-text-tiny inline-flex items-center gap-0.5 rounded-full bg-playground-send/10 px-2 py-0.5 font-bold text-playground-send">
                <span aria-hidden>★</span> Empfohlen
              </span>
            ) : null}
            {uc.experimental ? <UseCaseExperimentalBadge /> : null}
            {uc.beta && !recommended ? <UseCaseBetaBadge /> : null}
          </div>
        ) : null}
        <span
          className="playground-text-tiny block max-w-full truncate rounded-full bg-playground-muted/[0.08] px-2 py-0.5 font-medium text-playground-ink"
          title={uc.modelLabel}
        >
          {uc.modelLabel}
        </span>
      </div>
      <div className="space-y-1">
        <p className="playground-text-tiny font-bold uppercase tracking-[0.1em] text-playground-muted">
          {uc.subtitle}
        </p>
        <h2 className="playground-text-body font-display font-semibold leading-snug text-playground-ink">
          {uc.title}
        </h2>
        <p className="playground-text-small line-clamp-3 font-medium leading-snug text-playground-muted">
          {uc.description}
        </p>
      </div>
      {highlights.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {highlights.map((tag) => (
            <li
              key={tag}
              className="playground-text-tiny rounded-full bg-playground-muted/[0.06] px-2 py-0.5 font-medium text-playground-ink"
            >
              ✓ {tag}
            </li>
          ))}
        </ul>
      ) : null}
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

function ScrollButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Zurück scrollen" : "Weiter scrollen"}
      className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-playground-border bg-playground-sidebar text-playground-ink shadow-md transition hover:bg-playground-muted/[0.06] sm:flex"
    >
      <span aria-hidden className="text-lg leading-none">
        {direction === "left" ? "‹" : "›"}
      </span>
    </button>
  );
}

export function PlaygroundUseCaseCards({ cases, activeId, disabled, onSelect }: Props) {
  const groups = getUseCasesByShowcaseGroup(cases);
  const [activeGroup, setActiveGroup] = useState<PlaygroundUseCaseShowcaseGroup>(
    groups[0]?.group ?? "chat-agenten",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCases = groups.find((g) => g.group === activeGroup)?.cases ?? [];

  const scrollBy = useCallback((delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return (
    <div className="w-full max-w-[960px] space-y-3">
      <div
        className="flex gap-1 overflow-x-auto border-b border-playground-border pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Use-Case-Kategorien"
      >
        {groups.map((group) => {
          const selected = group.group === activeGroup;
          return (
            <button
              key={group.group}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveGroup(group.group)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 playground-text-small font-bold transition ${
                selected
                  ? "border-playground-send text-playground-send"
                  : "border-transparent text-playground-muted hover:text-playground-ink"
              }`}
            >
              <span aria-hidden>{group.icon}</span>
              {group.label}
              <span
                className={`playground-text-tiny rounded-full px-1.5 py-0.5 font-semibold ${
                  selected ? "bg-playground-send/10 text-playground-send" : "bg-playground-muted/10"
                }`}
              >
                {group.cases.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <ScrollButton direction="left" onClick={() => scrollBy(-320)} />
        <div
          ref={scrollRef}
          className="min-w-0 flex flex-1 gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tabpanel"
        >
          {activeCases.map((uc) => (
            <UseCaseCard
              key={uc.id}
              uc={uc}
              active={activeId === uc.id}
              recommended={uc.id === RECOMMENDED_USE_CASE_ID}
              disabled={disabled}
              onSelect={onSelect}
            />
          ))}
        </div>
        <ScrollButton direction="right" onClick={() => scrollBy(320)} />
      </div>
    </div>
  );
}
