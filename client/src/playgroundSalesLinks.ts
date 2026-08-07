/** Öffentliche Vertriebs- und Tarifberatungs-Kontakte (mittwald.de). */

export const MITTWALD_TARIF_CONSULT_PHONE = "+49 5772 293 150";
export const MITTWALD_TARIF_CONSULT_PHONE_TEL = "tel:+495772293150";
export const MITTWALD_SALES_URL = "https://www.mittwald.de/darum-mittwald/vertrieb";

/** mittwald Startseite — Produktübersicht. */
export const MITTWALD_WEBSITE_URL = "https://www.mittwald.de";

/** Hosting-Produktseiten (Website / Buchung). */
export const MITTWALD_WEBHOSTING_URL = "https://www.mittwald.de/webhosting";
export const MITTWALD_VSERVER_URL = "https://www.mittwald.de/vserver";
export const MITTWALD_DEDICATED_SERVER_URL = "https://www.mittwald.de/dedicated-server";
export const MITTWALD_EMAIL_MIGRATION_URL = "https://www.mittwald.de/lp/e-mail-migration";
export const MITTWALD_MSTUDIO_PRODUCT_URL = "https://www.mittwald.de/mstudio";
export const MITTWALD_CONTAINER_HOSTING_URL = "https://www.mittwald.de/mstudio/container-hosting";

/** AI-Hosting-Tarifseite (Website) — Shared-Tarife wählen & buchen. */
export const MITTWALD_AI_HOSTING_TARIFF_URL = "https://www.mittwald.de/mstudio/ai-hosting";

/** Dedicated AI Hosting — Produktseite (Managed Dedicated AI M / L / XL). */
export const MITTWALD_AI_DEDICATED_HOSTING_URL =
  "https://www.mittwald.de/mstudio/ai-dedicated-hosting";

/** mStudio-Kundenportal — Anmeldung (auch kostenlos neu), Verwaltung, API-Keys. */
export const MITTWALD_MSTUDIO_URL = "https://mstudio.mittwald.de/";

/** Konkrete Links für Nicht-AI-Hosting-Anliegen (Follow-up „Ja“, Ehrenamt, Website+Mail+Cloud). */
export function formatMittwaldHostingProductLinksBlock(): string {
  return (
    `**Website / CMS:** ${MITTWALD_WEBHOSTING_URL}\n` +
    `**vServer** (mehrere Projekte, Container): ${MITTWALD_VSERVER_URL}\n` +
    `**Dedicated Server:** ${MITTWALD_DEDICATED_SERVER_URL}\n` +
    `**E-Mail** (inkl. Migration): ${MITTWALD_EMAIL_MIGRATION_URL}\n` +
    `**mStudio** (Produktinfo): ${MITTWALD_MSTUDIO_PRODUCT_URL}\n` +
    `**mStudio anmelden** (Verwaltung): ${MITTWALD_MSTUDIO_URL}\n` +
    `**Container Hosting** (Nextcloud, Aufgabenboards, Vorlagen): ${MITTWALD_CONTAINER_HOSTING_URL}`
  );
}
