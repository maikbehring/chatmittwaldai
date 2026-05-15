/**
 * Konfigurierbare Footer-/Sidebar-Links (Impressum, Datenschutz, …) per .env
 */

function linkFromEnv(id, urlKey, labelKey, defaultLabel) {
  const href = process.env[urlKey]?.trim();
  if (!href) return null;
  const label = process.env[labelKey]?.trim() || defaultLabel;
  return { id, label, href };
}

export function getPlaygroundLinks() {
  return [
    linkFromEnv(
      "aiHosting",
      "PLAYGROUND_LINK_AI_HOSTING_URL",
      "PLAYGROUND_LINK_AI_HOSTING_LABEL",
      "AI Hosting",
    ),
    linkFromEnv("docs", "PLAYGROUND_LINK_DOCS_URL", "PLAYGROUND_LINK_DOCS_LABEL", "Dokumentation"),
    linkFromEnv(
      "impressum",
      "PLAYGROUND_LINK_IMPRESSUM_URL",
      "PLAYGROUND_LINK_IMPRESSUM_LABEL",
      "Impressum",
    ),
    linkFromEnv(
      "privacy",
      "PLAYGROUND_LINK_PRIVACY_URL",
      "PLAYGROUND_LINK_PRIVACY_LABEL",
      "Datenschutz",
    ),
    linkFromEnv("terms", "PLAYGROUND_LINK_TERMS_URL", "PLAYGROUND_LINK_TERMS_LABEL", "Nutzungsbedingungen"),
    linkFromEnv("bug", "PLAYGROUND_LINK_BUG_URL", "PLAYGROUND_LINK_BUG_LABEL", "Bug melden"),
  ].filter(Boolean);
}
