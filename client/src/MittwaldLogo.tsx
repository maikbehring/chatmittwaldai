import { assetUrl } from "./appPaths";

type MittwaldLogoProps = {
  className?: string;
  /** sm: 24px · md: 32px · lg: 40px · xl: 48–56px */
  size?: "sm" | "md" | "lg" | "xl";
  /** wordmark: volles Logo (Hell: PNG) · mark: m+Punkt (SVG, z. B. schmale Sidebar) */
  variant?: "wordmark" | "mark";
  title?: string;
};

const sizeClass: Record<NonNullable<MittwaldLogoProps["size"]>, string> = {
  sm: "h-5 w-auto",
  md: "h-7 w-auto",
  lg: "h-9 w-auto",
  xl: "h-10 w-auto sm:h-11",
};

const WORDMARK_LIGHT_SRC = assetUrl("brand/mittwald-wordmark-light.png");

function MittwaldMarkSvg({
  className,
  title,
}: {
  className: string;
  title: string;
}) {
  return (
    <svg
      viewBox="0 0 88 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <path d="M5.8 52.2V21.4c0-7.8 5.8-13.4 14.6-13.4 6.4 0 11.2 3.2 13.6 8.4V19.2C33.2 12.4 38.4 7.2 45.8 7.2c7.2 0 12.4 4.2 14 11V52.2H49V34.6c0-4.2-2.6-6.8-6.6-6.8-3.8 0-6.4 2.6-6.4 6.8v17.6H26.2V34.6c0-4.2-2.6-6.8-6.5-6.8-3.9 0-6.5 2.6-6.5 6.8v17.6H5.8z" />
      <circle cx="68.8" cy="10.4" r="6.6" />
    </svg>
  );
}

/**
 * mittwald-Logo — Hellmodus: offizielle Wortmarke (PNG).
 * Dunkelmodus: SVG-Markierung (currentColor / invertierte Wortmarke).
 */
export function MittwaldLogo({
  className = "",
  size = "md",
  variant = "wordmark",
  title = "mittwald",
}: MittwaldLogoProps) {
  const dimensionClass = `${sizeClass[size]} shrink-0 ${className}`.trim();

  if (variant === "mark") {
    return <MittwaldMarkSvg className={dimensionClass} title={title} />;
  }

  return (
    <span className="inline-flex shrink-0 items-center" role="img" aria-label={title}>
      <img
        src={WORDMARK_LIGHT_SRC}
        alt=""
        className={`${dimensionClass} object-contain object-left dark:hidden`}
      />
      <img
        src={WORDMARK_LIGHT_SRC}
        alt=""
        className={`${dimensionClass} hidden object-contain object-left dark:block dark:brightness-0 dark:invert`}
      />
    </span>
  );
}
