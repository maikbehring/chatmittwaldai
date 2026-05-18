import { GITHUB_NEW_BUG_ISSUE_URL } from "./repoLinks";

export type PlaygroundLink = {
  id: string;
  label: string;
  href: string;
};

/** Impressum, Datenschutz, AGB — nur im Footer unter dem Chat, nicht in der Sidebar. */
export const LEGAL_FOOTER_LINK_IDS = new Set(["impressum", "privacy", "terms"]);

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
