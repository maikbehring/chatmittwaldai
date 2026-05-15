import type { ReactNode } from "react";
import type { PlaygroundLink } from "./playgroundLinks";

const inlineLinkClass =
  "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-300";

const footerLinkClass =
  "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 dark:decoration-neutral-600 dark:hover:text-neutral-300";

const sidebarLinkClass =
  "block truncate rounded-md px-2 py-1.5 text-[11px] text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200";

function interleave(nodes: ReactNode[], sep: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  nodes.forEach((node, i) => {
    if (i > 0) out.push(sep);
    out.push(node);
  });
  return out;
}

export function PlaygroundLinksSidebar({ links }: { links: PlaygroundLink[] }) {
  if (links.length === 0) return null;
  return (
    <>
      {links.map((l) => (
        <a
          key={l.id}
          className={sidebarLinkClass}
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

const accentClass = "text-accent underline";

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
