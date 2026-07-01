/**
 * Container-Vorlagen im mStudio mit Mehrwert für AI Hosting (OpenAI-kompatible API).
 * Kuratiert — das Angebot wird laufend erweitert; nur diese Liste + FAQ, nichts erfinden.
 */

export type AiHostingContainerTemplate = {
  name: string;
  tier: "direct" | "building-block";
  benefit: string;
};

export const PLAYGROUND_AI_HOSTING_CONTAINER_TEMPLATES = {
  intro:
    "AI Hosting stellt eine **OpenAI-kompatible API** bereit (`https://llm.aihosting.mittwald.de/v1`). " +
    "Alle Anwendungen mit **eigenem OpenAI-Endpunkt** lassen sich anbinden. " +
    "Bei vielen **Container-Vorlagen** im mStudio sind **AI-Hosting-Zugangsdaten vorkonfiguriert** — schneller Start ohne eigene Entwicklung. " +
    "**Basis:** Container Hosting auf **vServer** oder **Dedicated Server** — getrennt vom AI-Hosting-Tarif buchen.",
  directIntegration: [
    {
      name: "Open WebUI",
      tier: "direct",
      benefit:
        "ChatGPT-ähnliche Oberfläche für eure Modelle — Chat, Dokumente (RAG), Embeddings, Speech-to-Text. Ideal als eigener KI-Assistent.",
    },
    {
      name: "AnythingLLM",
      tier: "direct",
      benefit:
        "RAG-Plattform für eigene Dokumente und Wissensdatenbanken — OpenAI-kompatible APIs; interne Chatbots und Agenten.",
    },
    {
      name: "n8n",
      tier: "direct",
      benefit:
        "KI-Workflows und Agenten — Anbindung an AI Hosting; Kombination mit Slack, E-Mail, CRM, Datenbanken u. v. m.",
    },
    {
      name: "Directus",
      tier: "direct",
      benefit:
        "Headless CMS mit integriertem AI Assistant — Inhalte erstellen, übersetzen, zusammenfassen oder verbessern via AI Hosting.",
    },
    {
      name: "Docmost",
      tier: "direct",
      benefit: "Wiki und Dokumentation mit AI-Suche und KI-gestützter Texterstellung über OpenAI-kompatible APIs.",
    },
  ] as AiHostingContainerTemplate[],
  ragBuildingBlocks: [
    { name: "Qdrant", tier: "building-block", benefit: "Vektordatenbank für RAG" },
    { name: "Chroma", tier: "building-block", benefit: "Vektordatenbank für kleinere Wissensdatenbanken" },
    { name: "OpenSearch", tier: "building-block", benefit: "Volltext- und semantische Suche" },
    { name: "Solr", tier: "building-block", benefit: "Enterprise-Suche" },
    { name: "PostgreSQL", tier: "building-block", benefit: "Strukturierte Daten für Agenten" },
    { name: "MariaDB", tier: "building-block", benefit: "Relationale Datenbank (Alternative)" },
    { name: "Paperless", tier: "building-block", benefit: "Dokumentenmanagement als Wissensquelle für RAG" },
  ] as AiHostingContainerTemplate[],
  useCases: [
    { label: "Eigener ChatGPT fürs Unternehmen", stack: "Open WebUI + AI Hosting" },
    { label: "Chat über interne Dokumente", stack: "AnythingLLM + Qdrant + AI Hosting" },
    { label: "KI-Agenten und Automatisierung", stack: "n8n + AI Hosting" },
    { label: "KI im CMS", stack: "Directus + AI Hosting" },
    { label: "KI-Wiki mit semantischer Suche", stack: "Docmost + AI Hosting" },
  ],
  roadmapNote:
    "Die Container-Vorlagen werden **ständig erweitert** — aktuelle Auswahl im **mStudio** (Container Hosting) prüfen; keine Vorlagen erfinden.",
  customContainers:
    "Eigene Docker-Images: Base-URL `https://llm.aihosting.mittwald.de/v1` und API-Key aus dem mStudio manuell eintragen — OpenAI-kompatible Integration.",
};

export function formatPlaygroundAiHostingContainerTemplatesContext(): string {
  const { intro, directIntegration, ragBuildingBlocks, useCases, roadmapNote, customContainers } =
    PLAYGROUND_AI_HOSTING_CONTAINER_TEMPLATES;

  const directLines = directIntegration
    .map((t) => `• **${t.name}** — ${t.benefit}`)
    .join("\n");
  const blockLines = ragBuildingBlocks
    .map((t) => `• **${t.name}** — ${t.benefit}`)
    .join("\n");
  const useCaseLines = useCases.map((u) => `• **${u.label}:** ${u.stack}`).join("\n");

  return (
    `[Playground — Container-Vorlagen & AI Hosting (kuratiert)]\n` +
    `${intro}\n\n` +
    `## Direkte LLM-Anbindung (größter Mehrwert)\n${directLines}\n\n` +
    `## Bausteine für RAG & Agenten (sprechen nicht direkt mit dem LLM)\n${blockLines}\n\n` +
    `## Typische Stacks\n${useCaseLines}\n\n` +
    `${customContainers}\n\n` +
    `${roadmapNote}`
  );
}
