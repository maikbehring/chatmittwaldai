import { useEffect, useId, useRef, useState } from "react";

export type PlaygroundSelectOption = {
  value: string;
  label: string;
};

type PlaygroundSelectProps = {
  id?: string;
  value: string;
  options: PlaygroundSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
  /** Kompakter Trigger wie Theme-Umschalter */
  compact?: boolean;
  className?: string;
};

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 7.5l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const triggerBase =
  "relative flex items-center rounded-lg border border-transparent font-bold text-playground-muted outline-none transition hover:bg-playground-muted/5 focus-visible:ring-2 focus-visible:ring-playground-border disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Custom-Dropdown statt nativem &lt;select&gt; — Windows/Chromium rendert native Listen
 * im Dark Mode oft als weißen Block ohne lesbare Optionen.
 */
export function PlaygroundSelect({
  id,
  value,
  options,
  onChange,
  disabled = false,
  title,
  "aria-label": ariaLabel,
  compact = false,
  className = "",
}: PlaygroundSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const obs = new MutationObserver(() => setOpen(false));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [open]);

  const sizeClass = compact
    ? "playground-text-small max-w-[6.5rem] py-1.5 pl-2 pr-7 sm:max-w-none"
    : "playground-text-small max-w-full min-w-0 py-1.5 pl-2 pr-8 sm:max-w-[min(100%,14rem)]";

  return (
    <div ref={rootRef} className={`relative ${compact ? "shrink-0" : "min-w-0 max-w-full shrink"}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={`${triggerBase} ${sizeClass} w-full cursor-pointer ${className}`.trim()}
      >
        <span className="min-w-0 truncate text-left">{selected?.label ?? value}</span>
        <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 opacity-80" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 top-full z-50 mt-1 max-h-72 w-max min-w-full overflow-y-auto rounded-lg border border-playground-border bg-playground-sidebar py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`playground-text-small cursor-pointer truncate px-3 py-2 text-playground-ink ${
                  isSelected
                    ? "bg-playground-muted/10 font-bold"
                    : "font-medium hover:bg-playground-muted/5"
                }`}
                onClick={() => {
                  if (opt.value !== value) onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
