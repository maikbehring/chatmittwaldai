import { GITHUB_NEW_BUG_ISSUE_URL } from "./repoLinks";

export type PlaygroundLink = {
  id: string;
  label: string;
  href: string;
};

/** Impressum, Datenschutz, AGB — erscheinen in der Haupt-Fußzeile. */
export const LEGAL_FOOTER_LINK_IDS = new Set(["impressum", "privacy", "terms"]);

const MAIN_FOOTER_LINK_ORDER = ["impressum", "terms", "privacy", "bug"] as const;

/** Impressum, Datenschutz, AGB, Bug melden — Reihenfolge laut Figma-Fußzeile. */
export function mainFooterLinks(links: PlaygroundLink[]): PlaygroundLink[] {
  const byId = new Map(links.map((l) => [l.id, l]));
  return MAIN_FOOTER_LINK_ORDER.map((id) => byId.get(id)).filter(
    (l): l is PlaygroundLink => l != null,
  );
}

export function legalFooterLinks(links: PlaygroundLink[]): PlaygroundLink[] {
  return links.filter((l) => LEGAL_FOOTER_LINK_IDS.has(l.id));
}

export function sidebarMenuLinks(links: PlaygroundLink[]): PlaygroundLink[] {
  return links.filter((l) => !LEGAL_FOOTER_LINK_IDS.has(l.id));
}

/** Standard-Bug-Link zum Upstream-Repo, falls nicht per .env gesetzt. */
export function withDefaultBugLink(links: PlaygroundLink[]): PlaygroundLink[] {
  if (links.some((l) => l.id === "bug")) return links;
  return [
    ...links,
    { id: "bug", label: "Bug melden", href: GITHUB_NEW_BUG_ISSUE_URL },
  ];
}

export function linkById(links: PlaygroundLink[], id: string): PlaygroundLink | undefined {
  return links.find((l) => l.id === id);
}
