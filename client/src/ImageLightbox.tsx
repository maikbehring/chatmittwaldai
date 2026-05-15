import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ImageLightbox({ open, src, alt, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || !src) return null;

  return createPortal(
    <div
      className="image-lightbox-root fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="presentation"
    >
      <button
        type="button"
        className="image-lightbox-backdrop absolute inset-0 bg-black/85 backdrop-blur-sm"
        aria-label="Bildvorschau schließen"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt || "Bildvorschau"}
        className="image-lightbox-panel relative z-10 flex max-h-full max-w-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:-right-12 sm:top-0"
          aria-label="Schließen"
        >
          <CloseIcon />
        </button>
        <img
          src={src}
          alt={alt}
          className="image-lightbox-img max-h-[min(90vh,900px)] max-w-[min(92vw,1200px)] rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
          draggable={false}
        />
      </div>
    </div>,
    document.body,
  );
}
