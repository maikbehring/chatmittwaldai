/**
 * Dedicated AI Hosting — Vertriebsinfos (RTX 6000 PRO).
 * Noch nicht vollständig auf der öffentlichen Landingpage; vom Vertrieb in Gesprächen genutzt.
 */

export type DedicatedAiPlan = {
  id: "M" | "L" | "XL";
  name: string;
  priceMonthly: string;
  gpus: string;
  vramTotal: string;
  vramForModel: string;
  tokens: string;
  provisioning: string;
  minTerm: string;
  modelSizeHint: string;
};

export type DedicatedAiExtension = {
  label: string;
  price: string;
};

export const PLAYGROUND_AI_HOSTING_DEDICATED_SALES = {
  title: "Dedicated AI Hosting",
  subtitle: "Eigene RTX 6000 PRO GPUs für Ihre KI-Workloads",
  pitch:
    "Sie bekommen eigene Grafikkarten (GPU), nur für Ihr Projekt. Keine geteilte Leistung, keine Token-Grenzen. " +
    "Das Hosting läuft in Deutschland und ist DSGVO-konform. Ihre Anwendung nutzt eine einfache Standardschnittstelle " +
    "(OpenAI-kompatible API) und kann dadurch schnell angebunden werden. " +
    "Ideal für Agenturen, SaaS-Anbieter und Unternehmen mit produktiven KI-Workloads.",
  benefits: [
    "Eigene GPU statt geteilter Leistung mit anderen Kunden",
    "Keine Token-Limits — die Hardwareleistung ist das Limit",
    "Standard-API wie bei OpenAI — einfache Anbindung",
    "Hosting in Deutschland nach DSGVO",
    "Technischer Ansprechpartner inklusive",
    "Optional Lastverteilung (Load Balancing) oder Modell-Aufteilung (Model-Sharding)",
  ],
  glossary: {
    GPU: "Die Recheneinheit für KI-Modelle.",
    VRAM: "Der schnelle Speicher auf der GPU. Mehr VRAM hilft bei größeren Modellen.",
    Tokens: "Textbausteine, die ein Modell verarbeitet. Bei Dedicated ohne festes Kontingent.",
    API: "Die Schnittstelle, mit der Ihre Software das KI-Modell aufruft.",
    "Load Balancing":
      "Anfragen werden auf mehrere GPUs verteilt (mehr gleichzeitige Anfragen).",
    "Model-Sharding": "Ein großes Modell wird auf mehrere GPUs aufgeteilt.",
  },
  plans: [
    {
      id: "M",
      name: "Dedicated AI M",
      priceMonthly: "999 €",
      gpus: "1× RTX 6000 PRO",
      vramTotal: "96 GB VRAM",
      vramForModel: "ca. 62 GB für Modell nutzbar",
      tokens: "Unlimited Tokens",
      provisioning: "Bereitstellung ca. 2–4 Wochen",
      minTerm: "Mindestlaufzeit: 3 Monate",
      modelSizeHint: "Modellgröße grob: bis ca. 30B–70B (je nach Quantisierung)",
    },
    {
      id: "L",
      name: "Dedicated AI L",
      priceMonthly: "1.899 €",
      gpus: "2× RTX 6000 PRO",
      vramTotal: "192 GB VRAM",
      vramForModel: "ca. 125 GB für Modell nutzbar",
      tokens: "Unlimited Tokens",
      provisioning: "Bereitstellung ca. 2–4 Wochen",
      minTerm: "Mindestlaufzeit: 6 Monate",
      modelSizeHint: "Modellgröße grob: bis ca. 70B–120B (je nach Quantisierung/Verteilung)",
    },
    {
      id: "XL",
      name: "Dedicated AI XL",
      priceMonthly: "3.599 €",
      gpus: "4× RTX 6000 PRO",
      vramTotal: "384 GB VRAM",
      vramForModel: "ca. 250 GB für Modell nutzbar",
      tokens: "Unlimited Tokens",
      provisioning: "Bereitstellung ca. 2–4 Wochen",
      minTerm: "Mindestlaufzeit: 6 Monate",
      modelSizeHint:
        "Modellgröße grob: deutlich über 120B bis ca. 200B+ (je nach Quantisierung/Verteilung)",
    },
  ] satisfies DedicatedAiPlan[],
  extensions: [
    { label: "Jedes weitere Modell (einmalige Einrichtung)", price: "199 € einmalig" },
    { label: "Spezielle / kundenspezifische Modelle (einmalige Einrichtung)", price: "199 € einmalig" },
    { label: "Load Balancing über mehrere GPUs", price: "199 € / Monat" },
    { label: "Model-Sharding über mehrere GPUs", price: "199 € / Monat" },
  ] satisfies DedicatedAiExtension[],
  contractDuration:
    "**Dedicated AI Hosting — abweichend von Shared:**\n" +
    "Shared AI Hosting (Starter/Pro/Business): monatliche Laufzeit, automatische Verlängerung zum Monatsende, Kündigung mit 30 Tagen Frist zum Monatsende.\n\n" +
    "Dedicated AI M (1 GPU): Mindestlaufzeit 3 Monate.\n" +
    "Dedicated AI L/XL (ab 2 GPUs): Mindestlaufzeit 6 Monate — mehr Planung, Einrichtung und laufende Abstimmung; Infrastruktur wird langfristig reserviert.",
  sizingGuidance:
    "Dedicated-Stufenleiter (kleinster passender Schritt zuerst):\n" +
    "1. **Shared (Starter/Pro/Business)** — Standard für die meisten Projekte, auch SaaS mit moderatem Traffic. Business bei hoher Last (Rate Limits, Token-Kontingent).\n" +
    "2. **Dedicated AI M (1 GPU)** — Einstieg Dedicated: unlimited Tokens, eigene GPU, typische Shared-Modelle (z. B. bis ~70B je nach Quantisierung). Nicht direkt L empfehlen.\n" +
    "3. **Dedicated AI L (2 GPUs)** — nur wenn konkret nötig: Load Balancing (mehr parallele Anfragen), Model-Sharding / größere Modelle (~70B–120B), oder 1 GPU reicht nachweislich nicht.\n" +
    "4. **Dedicated AI XL (4 GPUs)** — sehr große Modelle oder extreme Last.\n" +
    "„Viele Anfragen“ allein rechtfertigt nicht automatisch 2 GPUs — erst Business prüfen, dann ggf. Dedicated M.",
  modelSizing:
    "Hardware: **RTX 6000 PRO** = **96 GB VRAM pro GPU** (nicht 48 GB — nicht mit anderen GPU-Modellen verwechseln).\n" +
    "35 % VRAM reservieren wir für Context Caching (stabile, schnelle Antworten bei parallelen Anfragen). " +
    "Nur ca. 65 % des VRAM sind für das Modell selbst eingeplant: " +
    "M (1 GPU) → **96 GB gesamt**, ca. 62 GB fürs Modell · L (2 GPUs) → 192 GB gesamt, ca. 125 GB fürs Modell · XL (4 GPUs) → 384 GB gesamt, ca. 250 GB fürs Modell. " +
    "Die genaue Modellgröße hängt von Quantisierung, Architektur und Betriebsmodus (Single, Load Balancing, Model-Sharding) ab — " +
    "die Werte sind praxisnahe Orientierung.",
  onboarding: [
    "Anfrage stellen",
    "Technisches Briefing",
    "Hardware-Provisionierung",
    "Modell einrichten",
    "API-Zugang erhalten",
  ],
  provisioningNote: "Start in der Regel innerhalb von 2–4 Wochen, je nach Konfiguration.",
  cta:
    "Lassen Sie uns gemeinsam klären, welche GPU-Konfiguration optimal zu Ihrem Use Case passt. " +
    "Dedicated anfragen: Beratung +49 5772 293 150 · https://www.mittwald.de/mstudio/ai-hosting",
  priceNote: "Alle Preise zzgl. gesetzlicher USt.",
} as const;

export function formatPlaygroundAiHostingDedicatedSalesContext(): string {
  const d = PLAYGROUND_AI_HOSTING_DEDICATED_SALES;
  const glossary = Object.entries(d.glossary)
    .map(([term, def]) => `- **${term}:** ${def}`)
    .join("\n");
  const plans = d.plans
    .map(
      (p) =>
        `### ${p.name}\n` +
        `- Preis: **${p.priceMonthly}** pro Monat zzgl. USt.\n` +
        `- ${p.gpus} · ${p.vramTotal} (${p.vramForModel})\n` +
        `- ${p.tokens} · ${p.provisioning}\n` +
        `- ${p.minTerm}\n` +
        `- ${p.modelSizeHint}`,
    )
    .join("\n\n");
  const extensions = d.extensions.map((e) => `- ${e.label}: ${e.price}`).join("\n");
  const onboarding = d.onboarding.map((step, i) => `${i + 1}. ${step}`).join("\n");

  return (
    `[Playground — Dedicated AI Hosting (Vertriebsinfos, RTX 6000 PRO — noch nicht vollständig auf der öffentlichen Landingpage)]\n` +
    `WICHTIG: Dedicated-Preise (M/L/XL) und Erweiterungen NUR aus diesem Block — nicht aus Live-Tarifdaten erfinden oder Shared-Tarife (Starter/Pro/Business) verwechseln. ` +
    `Dedicated M = 1× RTX 6000 PRO = **96 GB VRAM gesamt** (nicht 48 GB).\n\n` +
    `## ${d.title}\n${d.subtitle}\n\n${d.pitch}\n\n` +
    `### Warum Dedicated AI Hosting?\n${d.benefits.map((b) => `- ${b}`).join("\n")}\n\n` +
    `### Einfach erklärt\n${glossary}\n\n` +
    `### Tarife (RTX 6000 PRO)\n${plans}\n\n` +
    `### Größe / Empfehlungslogik\n${d.sizingGuidance}\n\n` +
    `### Skalierungsoptionen & Erweiterungen\n${extensions}\n\n` +
    `### Vertragslaufzeit\n${d.contractDuration}\n\n` +
    `### Wie groß darf das Modell sein?\n${d.modelSizing}\n\n` +
    `### Bereitstellung & Onboarding\n${onboarding}\n\n${d.provisioningNote}\n\n` +
    `### Nächster Schritt\n${d.cta}\n\n${d.priceNote}`
  );
}
