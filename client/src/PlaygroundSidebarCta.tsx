type Props = {
  href: string;
  label?: string;
  className?: string;
};

export function PlaygroundSidebarCta({
  href,
  label = "AI Hosting buchen",
  className = "",
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`playground-cta-gradient playground-text-body inline-flex h-12 min-w-[120px] max-w-[280px] items-center justify-center rounded-full px-5 font-bold !leading-5 text-white transition hover:brightness-110 ${className}`.trim()}
    >
      {label}
    </a>
  );
}
