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
      modelSizeHint:
        "Aktuell alle Katalog-Modelle — Ausnahme: Mistral-Medium-3.5-128B und Qwen3.5-122B-A10B-FP8 (→ mindestens L)",
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
      modelSizeHint:
        "Mindestens für Mistral-Medium-3.5-128B und Qwen3.5-122B-A10B-FP8 (2 GPUs); auch Load Balancing / Sharding",
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
  dedicatedModelCatalog:
    "**Aktueller Stand (Dedicated, eigene GPU):**\n" +
    "- **Dedicated AI M (1 GPU):** Laufen **alle** Modelle aus dem Katalog — **Ausnahme:** **Mistral-Medium-3.5-128B** und **Qwen3.5-122B-A10B-FP8** (diese benötigen **mindestens 2 GPUs**).\n" +
    "- **Dedicated AI L (2 GPUs):** Erforderlich für **Mistral-Medium-3.5-128B** und **Qwen3.5-122B-A10B-FP8**; auch für Load Balancing / Model-Sharding bei hoher Last.\n" +
    "- **gpt-oss-120b** und die übrigen Katalog-Modelle laufen auf **Dedicated M**.\n" +
    "**Mehrere große Modelle gleichzeitig:** Nicht „1 GPU pro Modell“ — aber **VRAM-Budget** begrenzt, was **parallel geladen** sein kann. **gpt-oss-120b** (~60 GB) + **Qwen3.5-122B-A10B-FP8** (mindestens **2 GPUs**, nutzt großteils das L-Budget ~125 GB) **gleichzeitig auf Dedicated L (2 GPUs) reicht in der Regel nicht** — Summe deutlich über 125 GB modellnutzbar. Für **beide parallel**: eher **XL** oder Architektur mit Vertrieb klären; **nur eines von beiden auf Dedicated + anderes auf Shared** kann sinnvoll sein.\n" +
    "Bei Dedicated-Modellfragen: **sachlich antworten**, konkrete Konfiguration und Vertrag mit dem **Vertrieb** klären (+49 5772 293 150).",
  customModels:
    "**Eigene & spezielle Modelle (nur Dedicated):**\n" +
    "Auf **Shared AI Hosting** (Starter/Pro/Business) gelten die Modelle aus der **Live-Modellliste**.\n" +
    "Bei **Dedicated AI Hosting** sind darüber hinaus **eigene oder kundenspezifische Modelle** möglich — auch solche, die wir im klassischen AI Hosting **nicht** im Standard-Katalog anbieten.\n" +
    "**Einrichtung durch mittwald:** Modelle werden **von uns für den Kunden eingerichtet** — **kein** Self-Service, der Kunde deployt die Modelle **nicht** selbst. Ablauf: Dedicated-Tarif (M/L/XL) buchen → Modellwünsche mit **Vertrieb** besprechen → wir **prüfen** Machbarkeit (VRAM, GPU-Stufe, parallel vs. Wechsel) → wir **richten ein** und stellen die API bereit.\n" +
    "**Erweiterungen:** Jedes **zusätzliche Modell** (über das Basis-Setup) = **199 € einmalig** Einrichtungspauschale (kundenspezielle Modelle ebenfalls). Load Balancing / Model-Sharding: **199 €/Monat**.\n" +
    "**VRAM:** GPU-Ressourcen sind begrenzt — welche Modelle **parallel** auf welcher Stufe (M/L/XL) sinnvoll laufen, klären wir **im Vorfeld gemeinsam** mit dem Kunden im Vertriebsgespräch.",
  dedicatedModelSetup:
    "**Mehrere Modelle auf Dedicated (Antwort-Muster):**\n" +
    "Ja, grundsätzlich möglich. Du buchst **Dedicated AI Hosting** (M, L oder XL). **Wir richten die gewünschten Modelle für dich ein** — als **Erweiterungen** zum Dedicated-Tarif. Pro **zusätzliches Modell**: **199 € einmalig** Einrichtung.\n" +
    "Da VRAM begrenzt ist, prüfen wir **vorab gemeinsam**, welche Modelle parallel auf welcher GPU-Stufe sinnvoll laufen. Konkrete Konfiguration und Buchung: **Vertrieb** +49 5772 293 150 · https://www.mittwald.de/darum-mittwald/vertrieb\n" +
    "**Verboten:** suggerieren, der Kunde richte Modelle selbst ein („du richtest … ein“).",
  monitoring:
    "**Auslastung, API-Keys & mStudio (Dedicated — aktueller Stand):**\n" +
    "- **Managed Betrieb:** Bei Dedicated AI Hosting **kümmern wir uns**, dass alles sauber läuft. Bei **erhöhter Auslastung** melden wir uns **proaktiv**.\n" +
    "- **mStudio heute:** Für Dedicated **kein** Self-Service wie bei Shared. **Aktuell nicht** im mStudio: Token-Statistiken, Live-Auslastungs-Dashboard, **API-Key-Verwaltung** — Keys und Setup **übernehmen wir** für den Kunden (mit Vertrieb).\n" +
    "- **Grafana (optional):** Auf Wunsch **dediziertes Grafana-Dashboard** — Anfrage über **Vertrieb** (+49 5772 293 150).\n" +
    "- **Produktentwicklung:** Dedicated wird **stetig weiterentwickelt**. Themen wie **Auslastungsanzeige**, **Key-Verwaltung** u. ä. **können künftig** ins mStudio kommen — **ohne** Terminzusage oder Roadmap-Versprechen.\n" +
    "**Verboten:** mStudio-Live-Dashboard, Token-Statistiken oder API-Key-Self-Service für Dedicated behaupten.",
  sizingGuidance:
    "Dedicated-Stufenleiter (kleinster passender Schritt zuerst):\n" +
    "1. **Shared (Starter/Pro/Business)** — Standard für die meisten Projekte, auch SaaS mit moderatem Traffic. Business bei hoher Last (Rate Limits, Token-Kontingent).\n" +
    "2. **Dedicated AI M (1 GPU)** — Einstieg Dedicated: unlimited Tokens, eigene GPU; **aktuell alle Katalog-Modelle** außer Mistral-Medium-3.5-128B und Qwen3.5-122B-A10B-FP8.\n" +
    "3. **Dedicated AI L (2 GPUs)** — wenn **Mistral-Medium-3.5-128B** oder **Qwen3.5-122B-A10B-FP8** auf Dedicated, oder Load Balancing / Sharding / nachweislich 1 GPU nicht reicht.\n" +
    "4. **Dedicated AI XL (4 GPUs)** — sehr große Sonderkonfigurationen oder extreme Last.\n" +
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
    `### Modell-Zuordnung Dedicated (aktuell)\n${d.dedicatedModelCatalog}\n\n` +
    `### Eigene Modelle (Dedicated)\n${d.customModels}\n\n` +
    `### Modell-Einrichtung (Dedicated)\n${d.dedicatedModelSetup}\n\n` +
    `### Auslastung & mStudio (Dedicated)\n${d.monitoring}\n\n` +
    `### Skalierungsoptionen & Erweiterungen\n${extensions}\n\n` +
    `### Vertragslaufzeit\n${d.contractDuration}\n\n` +
    `### Wie groß darf das Modell sein?\n${d.modelSizing}\n\n` +
    `### Bereitstellung & Onboarding\n${onboarding}\n\n${d.provisioningNote}\n\n` +
    `### Nächster Schritt\n${d.cta}\n\n${d.priceNote}`
  );
}
