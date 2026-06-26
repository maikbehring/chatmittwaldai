import type { ReactNode } from "react";
import type { PlaygroundLink } from "./playgroundLinks";

const inlineLinkClass =
  "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300";

const footerLinkClass =
  "font-medium text-playground-muted underline decoration-playground-border underline-offset-2 hover:text-playground-ink";

const sidebarLinkClass =
  "playground-text-tiny block truncate rounded-lg px-3 py-2 font-medium text-playground-ink hover:bg-playground-muted/5";

const sidebarLinkMutedClass =
  "playground-text-tiny block truncate rounded-lg px-3 py-2 font-medium text-playground-muted hover:bg-playground-muted/5 hover:text-playground-ink";

const sidebarLinkStrongClass =
  "playground-text-tiny block truncate rounded-lg px-3 py-2 font-medium text-playground-ink hover:bg-playground-muted/5";

function interleave(nodes: ReactNode[], sep: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  nodes.forEach((node, i) => {
    if (i > 0) out.push(sep);
    out.push(node);
  });
  return out;
}

export function PlaygroundLinksSidebar({
  links,
  muted = false,
}: {
  links: PlaygroundLink[];
  muted?: boolean;
}) {
  if (links.length === 0) return null;
  const linkClass = muted ? sidebarLinkMutedClass : sidebarLinkClass;
  return (
    <>
      {links.map((l) => (
        <a
          key={l.id}
          className={linkClass}
          href={l.href}
          target="_blank"
          rel="noreferrer"
        >
          {l.label}
        </a>
      ))}
    </>
  );
}

export function PlaygroundSidebarActionLink({
  children,
  onClick,
  muted = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  muted?: boolean;
  className?: string;
}) {
  const base = muted ? sidebarLinkMutedClass : sidebarLinkStrongClass;
  return (
    <button type="button" onClick={onClick} className={`${base} w-full text-left ${className}`.trim()}>
      {children}
    </button>
  );
}

type InlineProps = {
  links: PlaygroundLink[];
  className?: string;
  linkClassName?: string;
  children?: ReactNode;
};

export function PlaygroundLinksInline({
  links,
  className,
  linkClassName = inlineLinkClass,
  children,
}: InlineProps) {
  const nodes: ReactNode[] = links.map((l) => (
    <a key={l.id} className={linkClassName} href={l.href} target="_blank" rel="noreferrer">
      {l.label}
    </a>
  ));
  if (children) nodes.push(children);

  if (nodes.length === 0) return null;

  return (
    <p className={className}>
      {interleave(
        nodes,
        <span className="text-neutral-300 dark:text-neutral-600"> · </span>,
      )}
    </p>
  );
}

export function PlaygroundLinksFooter({ links, children }: InlineProps) {
  const nodes: ReactNode[] = links.map((l) => (
    <a key={l.id} className={footerLinkClass} href={l.href} target="_blank" rel="noreferrer">
      {l.label}
    </a>
  ));
  if (children) nodes.push(children);

  if (nodes.length === 0) return null;

  return (
    <>
      {interleave(nodes, " · ")}
    </>
  );
}

const accentClass =
  "font-medium text-playground-link underline decoration-playground-link/40 underline-offset-2 hover:text-playground-link-hover";

export function PlaygroundGlossaryLinks({ links }: { links: PlaygroundLink[] }) {
  const parts: ReactNode[] = [];

  const ai = links.find((l) => l.id === "aiHosting");
  const docs = links.find((l) => l.id === "docs");
  const impressum = links.find((l) => l.id === "impressum");
  const privacy = links.find((l) => l.id === "privacy");
  const bug = links.find((l) => l.id === "bug");

  if (ai) {
    parts.push(
      <>
        Tarife und Überblick:{" "}
        <a className={accentClass} href={ai.href} target="_blank" rel="noreferrer">
          {ai.label}
        </a>
      </>,
    );
  }
  if (docs) {
    parts.push(
      <>
        {ai ? " " : ""}
        Technische Details in der{" "}
        <a className={accentClass} href={docs.href} target="_blank" rel="noreferrer">
          {docs.label}
        </a>
      </>,
    );
  }
  if (impressum) {
    parts.push(
      <>
        {" "}
        <a className={accentClass} href={impressum.href} target="_blank" rel="noreferrer">
          {impressum.label}
        </a>
      </>,
    );
  }
  if (privacy) {
    parts.push(
      <>
        {" "}
        <a className={accentClass} href={privacy.href} target="_blank" rel="noreferrer">
          {privacy.label}
        </a>
      </>,
    );
  }
  if (bug) {
    parts.push(
      <>
        {" "}
        Bugs und Wünsche am besten direkt{" "}
        <a className={accentClass} href={bug.href} target="_blank" rel="noreferrer">
          {bug.label}
        </a>
        .
      </>,
    );
  }

  if (parts.length === 0) return null;

  return <>{parts}</>;
}
