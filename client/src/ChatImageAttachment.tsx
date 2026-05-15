type Props = {
  src: string;
  alt?: string;
  className?: string;
  onOpen: (src: string, alt: string) => void;
};

function ExpandIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

export function ChatImageAttachment({ src, alt = "Anhang", className = "", onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(src, alt)}
      className={`group relative block max-w-full cursor-zoom-in overflow-hidden rounded-xl border border-neutral-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:focus-visible:ring-offset-neutral-950 ${className}`}
      aria-label={`${alt} vergrößern`}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-56 max-w-full object-cover transition duration-200 group-hover:brightness-[0.97] dark:group-hover:brightness-110"
        draggable={false}
      />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15"
        aria-hidden
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow-lg backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <ExpandIcon />
        </span>
      </span>
    </button>
  );
}

/** Kleine Vorschau (Eingabeleiste) — gleiche Lightbox-Aktion. */
export function ChatImagePreviewThumb({
  src,
  alt = "Anhang-Vorschau",
  onOpen,
}: {
  src: string;
  alt?: string;
  onOpen: (src: string, alt: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(src, alt)}
      className="h-9 w-9 shrink-0 cursor-zoom-in overflow-hidden rounded-lg ring-1 ring-neutral-200 transition hover:ring-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:ring-neutral-700 dark:hover:ring-neutral-500"
      aria-label="Bildvorschau vergrößern"
    >
      <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
    </button>
  );
}
