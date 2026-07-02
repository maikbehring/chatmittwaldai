/**
 * Statischer Kontext für den Playground-Use-Case „Shopware MCP Demo“.
 * Emuliert Shopware Admin MCP — keine Live-API, keine externen Chat-Produkte.
 */

import {
  MITTWALD_AI_HOSTING_TARIFF_URL,
  MITTWALD_CONTAINER_HOSTING_URL,
  MITTWALD_MSTUDIO_URL,
  MITTWALD_VSERVER_URL,
  MITTWALD_WEBHOSTING_URL,
} from "./playgroundSalesLinks";

export const SHOPWARE_MCP_DOCS_URL =
  "https://developer.shopware.com/docs/products/tools/mcp-server/getting-started.html";
export const SHOPWARE_ADMIN_MCP_GITHUB_URL = "https://github.com/shopware/shopware-admin-mcp";
export const MITTWALD_AI_HOSTING_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/";
export const MITTWALD_AI_HOSTING_MODELS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/";
export const MITTWALD_AI_HOSTING_API_URL = "https://llm.aihosting.mittwald.de/v1";

export type ShopwareMcpBriefingScenario = "eigener-shop" | "kunden-shop" | "setup-only" | "demo";

export function normalizeShopwareMcpScenario(raw: string | undefined): ShopwareMcpBriefingScenario {
  const s = (raw ?? "").trim().toLowerCase();
  if (s.includes("kunde") || s.includes("agentur") || s.includes("mandant")) return "kunden-shop";
  if (s.includes("setup") || s.includes("anleitung") || s.includes("einricht")) return "setup-only";
  if (s.includes("eigen")) return "eigener-shop";
  return "demo";
}

export function formatShopwareMcpMittwaldSetupGuide(scenario: ShopwareMcpBriefingScenario): string {
  const showEigen = scenario === "eigener-shop" || scenario === "setup-only" || scenario === "demo";
  const showKunden = scenario === "kunden-shop" || scenario === "setup-only" || scenario === "demo";

  const blocks: string[] = [
    `## Gesamtarchitektur (mittwald)\n` +
      `Drei Schichten — getrennt buchen und verbinden:\n\n` +
      `| Schicht | mittwald-Produkt | Rolle |\n` +
      `|---------|------------------|-------|\n` +
      `| **Shop** | [Webhosting](${MITTWALD_WEBHOSTING_URL}) | Shopware 6.7+ inkl. Admin API & eingebautem MCP unter \`/api/_mcp\` |\n` +
      `| **KI-Modelle** | [AI Hosting](${MITTWALD_AI_HOSTING_TARIFF_URL}) | OpenAI-kompatible API (\`${MITTWALD_AI_HOSTING_API_URL}\`) — Tool Calling für Agenten |\n` +
      `| **Assistent / Bridge** (optional) | [Container Hosting](${MITTWALD_CONTAINER_HOSTING_URL}) auf [vServer](${MITTWALD_VSERVER_URL}) | Open WebUI, n8n, eigene MCP-Bridge — AI-Hosting-Zugangsdaten oft vorkonfiguriert |\n\n` +
      `**mStudio:** ${MITTWALD_MSTUDIO_URL} — Shopware-Projekt, AI-Hosting-Tarif, API-Keys, Container.\n` +
      `**Doku AI Hosting:** ${MITTWALD_AI_HOSTING_DOCS_URL}`,
  ];

  if (showEigen) {
    blocks.push(
      `## Setup — eigener Shop bei mittwald\n` +
        `**Ziel:** Du betreibst **deinen** Shopware-Shop und steuerst ihn per Sprache (Produkte, Bestellungen, Theme).\n\n` +
        `### 1. Shopware hosten\n` +
        `- Im **mStudio** → **Webhosting** buchen (${MITTWALD_WEBHOSTING_URL})\n` +
        `- Shopware **6.7 oder neuer** installieren (Shopware-Template / Installer im Projekt)\n` +
        `- Domain & SSL im mStudio zuweisen\n` +
        `- Shopware-Admin erreichbar unter \`https://dein-shop.de/admin\`\n\n` +
        `### 2. Eingebauten MCP-Server aktivieren (Shopware 6.7+)\n` +
        `Laut [Shopware MCP Getting Started](${SHOPWARE_MCP_DOCS_URL}):\n` +
        `- In \`.env\`: \`MCP_SERVER=1\`\n` +
        `- \`symfony/mcp-bundle\` vorhanden (\`composer show symfony/mcp-bundle\`)\n` +
        `- Endpoint: \`https://dein-shop.de/api/_mcp\`\n` +
        `- Prüfen: \`bin/console debug:mcp\`\n\n` +
        `### 3. Integration anlegen\n` +
        `- Shopware-Admin → **Einstellungen → System → Integrationen**\n` +
        `- Oder CLI: \`bin/console integration:create "Mein MCP Client" --admin\` (Produktion: **ohne** \`--admin\`, eigene ACL-Rolle)\n` +
        `- **Access Key** (\`SWIA…\`) und **Secret** sicher speichern\n` +
        `- Optional: **Edit MCP Allowlist** — nur benötigte Tools freigeben\n\n` +
        `### 4. MCP-Client verbinden\n` +
        `**Variante A — IDE / lokaler MCP-Client** (streamable-http, direkt an den Shop):\n` +
        `\`\`\`json\n` +
        `{\n` +
        `  "mcpServers": {\n` +
        `    "shopware": {\n` +
        `      "type": "streamable-http",\n` +
        `      "url": "https://dein-shop.de/api/_mcp",\n` +
        `      "headers": {\n` +
        `        "sw-access-key": "SWIA...",\n` +
        `        "sw-secret-access-key": "..."\n` +
        `      }\n` +
        `    }\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n` +
        `Credentials **nie** ins Git — nur lokal oder als Umgebungsvariablen.\n\n` +
        `**Variante B — Externer Admin-MCP** (\`@shopware-ag/admin-mcp\`, stdio): ${SHOPWARE_ADMIN_MCP_GITHUB_URL}\n` +
        `- Sinnvoll, wenn der Client nur stdio-MCP spricht\n` +
        `- Env: \`SHOPWARE_API_URL\`, \`SHOPWARE_API_CLIENT_ID\`, \`SHOPWARE_API_CLIENT_SECRET\`\n` +
        `- Prozess z. B. auf lokalem Rechner oder in einem **Container** bei mittwald\n\n` +
        `### 5. mittwald AI Hosting (Sprache → Aktionen)\n` +
        `- Tarif buchen: ${MITTWALD_AI_HOSTING_TARIFF_URL} oder mStudio → AI Hosting\n` +
        `- **API-Key** im mStudio anlegen\n` +
        `- Base-URL: \`${MITTWALD_AI_HOSTING_API_URL}\`\n` +
        `- Für **Tool Calling / Agenten**: z. B. **Qwen3.6-35B-A3B-FP8**, **gpt-oss-120b**, **Ministral-3-14B** (Liste: ${MITTWALD_AI_HOSTING_MODELS_URL})\n` +
        `- Der MCP-Client (IDE oder eigene App) verbindet **KI** + **Shopware-MCP-Tools** — die KI entscheidet, welches Tool wann aufgerufen wird\n\n` +
        `### 6. Optional: Chat-Oberfläche im Container\n` +
        `- **vServer** + **Container Hosting** im mStudio\n` +
        `- Vorlage **Open WebUI** oder **n8n** — AI Hosting oft **vorkonfiguriert**\n` +
        `- Shopware-MCP weiter per streamable-http oder Admin-MCP anbinden (eigene Bridge/workflow)\n\n` +
        `### Checkliste eigener Shop\n` +
        `1. Webhosting + Shopware 6.7+ ✓\n` +
        `2. \`MCP_SERVER=1\` + Integration ✓\n` +
        `3. MCP-Client mit \`/api/_mcp\` ✓\n` +
        `4. AI-Hosting-Tarif + API-Key ✓\n` +
        `5. Erste Testaufgabe: z. B. „Liste 5 Produkte“ oder „Lege Testprodukt an“`,
    );
  }

  if (showKunden) {
    blocks.push(
      `## Setup — für Kunden (Agentur / Dienstleister)\n` +
        `**Ziel:** Du betreust **mehrere Kunden-Shops** und willst Shop-Pflege per Sprache anbieten — DSGVO-konform bei mittwald in Deutschland.\n\n` +
        `### 1. Pro Kunde: Shopware auf Webhosting\n` +
        `- **Ein Webhosting-Projekt pro Kunden-Shop** (oder klar getrennte Instanzen)\n` +
        `- Shopware 6.7+, Domain des Kunden, AVV/Datenschutz mit dem Kunden klären\n` +
        `- Updates & Backups über mStudio / Shopware-Workflows\n\n` +
        `### 2. Pro Kunde: eigene Integration (Pflicht)\n` +
        `- **Niemals** einen Access Key über mehrere Kunden-Shops teilen\n` +
        `- Pro Shop: eigene Integration, eigene MCP-Allowlist (nur benötigte Tools)\n` +
        `- Produktion: **kein** volles \`--admin\` — ACL-Rolle z. B. nur Produkte, Kategorien, Medien, Bestellungen lesen\n` +
        `- Zugangsdaten im **Passwort-Manager** des Kunden oder in eurem Agentur-Vault — nicht in Repos\n\n` +
        `### 3. Zentrale KI-Infrastruktur (Agentur)\n` +
        `- **Ein AI-Hosting-Tarif** für die Agentur (Token nach Volumen aller Kunden-Workflows)\n` +
        `- API-Key zentral im mStudio — in euren Tools/Containern hinterlegen\n` +
        `- Optional **ein vServer** mit Container Hosting für:\n` +
        `  - internes **Open WebUI** / **n8n** für das Team\n` +
        `  - Mandanten-Trennung über **Workflows pro Shop-URL** oder Konfiguration pro Kunde\n\n` +
        `### 4. MCP-Anbindung pro Mandant\n` +
        `- Pro Kunde eigene \`mcp.json\`/Konfiguration mit **shop-spezifischer URL** und **eigenen Keys**\n` +
        `- Beispiel-URL: \`https://kunde-a.de/api/_mcp\` vs. \`https://kunde-b.de/api/_mcp\`\n` +
        `- Team nutzt IDE mit projektbezogener MCP-Config **oder** zentrales n8n mit Shopware-MCP-Schritten\n\n` +
        `### 5. Typische Agentur-Use-Cases\n` +
        `- Produkte anlegen (Texte, Preise, Varianten, Bilder per URL)\n` +
        `- Kategorien pflegen, SEO-Texte, Theme-Farben\n` +
        `- Bestellstatus prüfen, nicht automatisch löschen (Delete-Tools oft gesperrt)\n` +
        `- **Nicht** ohne Freigabe: Massenänderungen, Theme-Wechsel, Sales-Channel abschalten\n\n` +
        `### 6. Abrechnung & Skalierung\n` +
        `- **Webhosting:** pro Kunden-Shop\n` +
        `- **AI Hosting:** nach Gesamt-Token (Starter/Pro/Business — ${MITTWALD_AI_HOSTING_TARIFF_URL})\n` +
        `- **vServer/Container:** einmalig für Agentur-Tools, nicht pro Shop zwingend\n` +
        `- Große Shops mit hohem Traffic: ggf. mehr Webhosting-Ressourcen oder Dedicated — Shopware-Hosting ≠ AI-Hosting-Tarif`,
    );
  }

  blocks.push(
    `## Sicherheit & Betrieb\n` +
      `- Integration-Keys rotieren bei Teamwechsel\n` +
      `- MCP-Allowlist: nur Tools freischalten, die ihr wirklich braucht\n` +
      `- Erste Verbindung kann Sekunden dauern (Shopware Kernel/Cache)\n` +
      `- Rate Limits der Admin API beachten — große Kataloge in Schritten\n` +
      `- Bilder: oft \`upload_media_by_url\` oder Medien-Pipeline — in Workflows testen`,
  );

  return blocks.join("\n\n");
}

export function formatPlaygroundShopwareMcpDemoContext(scenario: ShopwareMcpBriefingScenario = "demo"): string {
  const setupGuide = formatShopwareMcpMittwaldSetupGuide(scenario);

  return (
    `[Playground — Shopware Admin MCP Demo (Simulation)]\n` +
    `Shopware **6.7+** mit **eingebautem MCP** (Model Context Protocol) — Endpoint \`/api/_mcp\`, Zugriff auf die **Admin API** über standardisierte Tools.\n` +
    `Offizielle Doku: ${SHOPWARE_MCP_DOCS_URL}\n` +
    `Alternative (stdio): ${SHOPWARE_ADMIN_MCP_GITHUB_URL} (@shopware-ag/admin-mcp)\n` +
    `KI-Schicht: **mittwald AI Hosting** — ${MITTWALD_AI_HOSTING_DOCS_URL}\n\n` +
    `${setupGuide}\n\n` +
    `## Verfügbare MCP-Tools (Auszug — Simulation / Admin-MCP)\n` +
    `| Tool | Zweck |\n` +
    `|------|-------|\n` +
    `| product_list / product_get | Produkte suchen & Details |\n` +
    `| product_create / product_update | Anlegen & bearbeiten inkl. Varianten, Medien, Kategorien |\n` +
    `| upload_media_by_url | Bilder von URL ins Medienmanagement |\n` +
    `| category_list / category_create | Kategorien |\n` +
    `| sales_channel_list | Verkaufskanäle für Sichtbarkeit |\n` +
    `| order_list / order_detail / order_update | Bestellungen |\n` +
    `| theme_config_get / theme_config_change | Theme-Farben, Logo |\n\n` +
    `Shopware 6.7+ eingebaut: Tool-Namen können abweichen (z. B. \`shopware-entity-*\`) — siehe \`bin/console debug:mcp\`.\n\n` +
    `## Praxis-Hinweise\n` +
    `- **Bilder:** oft Workaround nötig (upload_media_by_url oder Medien-Pipeline)\n` +
    `- **Löschen:** product_delete oft deaktiviert → Produkt **deaktivieren** (\`active: false\`)\n` +
    `- **Rate Limits:** Admin API bei vielen Tool-Calls\n\n` +
    `## Was diese Demo **nicht** tut\n` +
    `- Keine echte Shopware-Instanz, keine echten API-Calls\n` +
    `- Keine Verbindung zu fremden Chat-Produkten — nur **mittwald + Shopware MCP** illustrieren`
  );
}

export function isShopwareMcpSetupQuestion(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /einricht|aufsetz|setup|anleitung|wie (richt|stell|verbind)|architektur|hosting|ai hosting|mstudio|integration|mcp\.json|api\/_mcp/.test(
      t,
    ) || t.includes("für kunden") || t.includes("eigener shop") || t.includes("agentur")
  );
}

export function extractShopwareMcpScenarioFromSubmission(text: string): ShopwareMcpBriefingScenario {
  const match = text.match(/Szenario:\s*(.+)/i);
  if (match) return normalizeShopwareMcpScenario(match[1]);
  if (isShopwareMcpSetupQuestion(text)) return "setup-only";
  return "demo";
}
