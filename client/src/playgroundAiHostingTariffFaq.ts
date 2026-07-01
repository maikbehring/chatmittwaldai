/** Kuratiertes FAQ für AI-Hosting-Tarifberatung (Vertrieb & Use Case). */

export type TariffFaqEntry = {
  id: number;
  section: string;
  question: string;
  answer: string;
};

export const PLAYGROUND_AI_HOSTING_TARIFF_FAQ: TariffFaqEntry[] = [
  {
    id: 1,
    section: "Tarifwahl",
    question: "Welcher AI-Hosting-Tarif reicht für einen ersten Kunden-PoC mit wenig Traffic?",
    answer: "Für einen ersten Proof of Concept reicht in den meisten Fällen der **Starter-Tarif** aus. Er enthält **5 Millionen Token pro Monat** und eignet sich ideal, um erste Anwendungen oder Kundenprojekte produktiv zu testen.\n\nDie Tarife unterscheiden sich nicht nur beim monatlichen Token-Kontingent, sondern auch bei den technischen Limits wie **Requests pro Minute (RPM)** und **parallelen Requests**.\n\nSollte sich während des PoCs herausstellen, dass mehr Leistung benötigt wird, kannst du jederzeit auf einen größeren Tarif wechseln. Alternativ kann mittwald nach Rücksprache auch vorübergehend ein höheres Limit bereitstellen.",
  },
  {
    id: 2,
    section: "Tarifwahl",
    question: "Ab wann lohnt sich Pro statt Starter für eine Agentur mit 3–5 Kundenprojekten?",
    answer: "Der **Starter-Tarif** eignet sich vor allem für:\n\n- erste Projekte\n- interne Tests\n- einzelne kleinere Kundenprojekte\n\nSobald mehrere Kundenprojekte parallel betrieben werden (z. B. **3–5 Projekte**), empfiehlt sich der **Pro-Tarif**.\n\nEr bietet:\n\n- deutlich mehr monatliche Tokens\n- höhere Rate Limits\n- mehr parallele Requests\n- mehr Reserven für produktive Anwendungen",
  },
  {
    id: 3,
    section: "Tarifwahl",
    question: "Wann ist Business sinnvoller als Pro – und wann reicht Pro trotzdem?",
    answer: "Der **Pro-Tarif** reicht für viele Agenturen aus, solange mehrere normale Kundenprojekte betrieben werden und keine außergewöhnlich hohe Last entsteht.\n\nDer **Business-Tarif** empfiehlt sich insbesondere, wenn:\n\n- viele Projekte gleichzeitig betrieben werden,\n- ein einzelnes Projekt sehr viele Nutzer oder API-Anfragen erzeugt,\n- dauerhaft hohe Last erwartet wird,\n- höhere Rate Limits benötigt werden.",
  },
  {
    id: 4,
    section: "Tarifwahl",
    question: "Für wen ist Enterprise / Dedicated wirklich gedacht?",
    answer: "**Enterprise auf der Website:** Auf der Tarifseite (mstudio/ai-hosting) heißt die oberste Stufe **„Enterprise Dedicated“** (999 €/Monat) — das gehört zur **Dedicated-Produktlinie** (eigene RTX 6000 PRO, unlimited Tokens), **nicht** zu Shared (Starter/Pro/Business). Es ist **kein** geteilter Shared-Tarif mit anderen Kunden. Die detaillierten Vertriebs-Stufen **Dedicated AI M / L / XL** sind die ausführliche Aufteilung derselben Produktlinie.\n\n**Dedicated AI Hosting** richtet sich an Agenturen, SaaS-Anbieter und Unternehmen mit **produktiven KI-Workloads**, die mehr brauchen als Shared-Tarife (Starter/Pro/Business).\n\nTypische Gründe für **Dedicated** (nicht schon für hohes SaaS-Traffic allein):\n\n- **Keine Token-Limits** nötig (unlimited)\n- **Eigene GPU** ohne geteilte Infrastruktur\n- Rate Limits von Business reichen nicht\n- **Größere Modelle** oder Load Balancing / Model-Sharding\n\n**Stufen:** Einstieg Dedicated = **M (1 GPU)** — aktuell alle Katalog-Modelle außer **Mistral-Medium-3.5-128B** und **Qwen3.5-122B-A10B-FP8** (→ **L**, 2 GPUs). L auch bei Parallelität/Sharding — nicht pauschal bei SaaS empfehlen.\n\nFür die meisten Projekte (auch SaaS): zuerst **Business** prüfen, dann ggf. Dedicated M.",
  },
  {
    id: 5,
    section: "Tarifwahl",
    question: "Was passiert, wenn wir das monatliche Token-Kontingent überschreiten?",
    answer: "Wenn du dein monatliches Token-Kontingent überschreitest, **läuft deine Anwendung weiter** — die API bricht nicht mit Fehlercodes (z. B. HTTP 429 oder 400) ab und liefert nicht einfach keine Tokens mehr.\n\nStattdessen passiert Folgendes:\n\n- Du siehst einen **Hinweis im mStudio** und erhältst eine **E-Mail**.\n- Bei uns intern geht eine **Meldung** raus — wir melden uns persönlich bei dir.\n\nGemeinsam klären wir, ob es eine **einmalige Spitze** war oder ob du **dauerhaft** mehr Volumen brauchst, als dein aktueller Tarif vorsieht. War es nur ein Ausreißer, kannst du in der Regel einfach weitermachen. Steigt der Bedarf dauerhaft an, finden wir gemeinsam den passenden Tarif — **ohne dass dein Betrieb unterbrochen wird**.\n\n**Hinweis:** Das ist etwas anderes als **Rate Limits** (Requests pro Minute / parallele Requests) — die betreffen kurzfristige Spitzenlast, nicht das monatliche Token-Kontingent.",
  },
  {
    id: 6,
    section: "Tarifwahl",
    question: "Kann ich den Tarif monatlich upgraden oder downgraden?",
    answer: "Ja — bei **Shared AI Hosting** (Starter, Pro, Business).\n\n- Upgrade jederzeit möglich\n- Downgrade ebenfalls möglich\n- keine versteckten Wechselkosten\n\n**Dedicated AI Hosting** hat eigene Vertragslaufzeiten mit Mindestlaufzeit — siehe FAQ zu Vertragslaufzeiten.\n\nDetails zur Kündigung und Verlängerung bei Shared: monatliche Laufzeit, Kündigung mit 30 Tagen Frist zum Monatsende.",
  },
  {
    id: 54,
    section: "Tarifwahl",
    question: "Wie sind die Vertragslaufzeiten — Shared AI Hosting vs. Dedicated?",
    answer: "**Shared AI Hosting** (Starter, Pro, Business):\n\n- Verträge laufen **monatlich** und verlängern sich automatisch zum jeweiligen **Monatsende**.\n- Du kannst jederzeit mit einer Frist von **30 Tagen zum Ende des laufenden Monats** kündigen.\n- Tarif-Upgrade oder -Downgrade ist monatlich möglich (unabhängig von der Kündigungsfrist für den gesamten Vertrag).\n\n**Dedicated AI Hosting** (M / L / XL) — **andere Bedingungen**:\n\n- **Dedicated AI M** (1 GPU): **Mindestlaufzeit 3 Monate**\n- **Dedicated AI L** und **XL** (2–4 GPUs): **Mindestlaufzeit 6 Monate**\n- Begründung: größere Setups brauchen Planung, Provisionierung (ca. 2–4 Wochen) und stabile Reservierung der Hardware.\n\nKonkrete Kündigungsmodalitäten bei Dedicated im Einzelfall mit dem **Vertrieb** klären: +49 5772 293 150.",
  },
  {
    id: 55,
    section: "Tarifwahl",
    question: "SaaS oder viele Anfragen — reicht Business oder brauche ich Dedicated (und wie viele GPUs)?",
    answer: "**Nicht automatisch Dedicated — und nicht automatisch 2 GPUs.**\n\n**Typischer Weg:**\n\n1. **Business** (Shared) prüfen — hohe Token-Menge, 150 RPM, 20 parallele Requests. Für viele SaaS-Workloads oft der erste produktive Schritt.\n2. Erst wenn Token-Kontingent, Rate Limits oder Garantien nicht reichen: **Dedicated AI M (1 GPU)** — unlimited Tokens, eigene GPU, kürzere Mindestlaufzeit (3 Monate).\n3. **Dedicated AI L (2 GPUs)** — wenn **Mistral-Medium-3.5-128B** oder **Qwen3.5-122B-A10B-FP8** auf Dedicated, Load Balancing, Model-Sharding, oder 1 GPU reicht nachweislich nicht\n4. **XL (4 GPUs)** für extreme Modellgrößen oder Last.\n\n„Großes SaaS mit vielen Anfragen“ allein → meist **Business** empfehlen; Dedicated M nur bei Bedarf ohne Token-Limits oder eigener GPU.",
  },
  {
    id: 60,
    section: "Tarifwahl",
    question: "SaaS für Anwaltskanzleien mit vielen parallelen API-Calls — Business oder Dedicated (wie viele GPUs)?",
    answer: "**Zuerst Business** — auch bei Kanzlei-SaaS und „vielen parallelen API-Calls“, **solange** ihr innerhalb der Limits bleibt:\n\n- **150 Requests/Minute (RPM)**\n- **20 parallele Requests** (Shared-Maximum — **nicht** mit RPM verwechseln)\n- hohes Token-Kontingent (Live-Tarifdaten)\n- monatlich kündbar, § 203 mit AVV + Schweigepflichtvereinbarung möglich\n\n**Wichtig bei konkreten Zahlen:** Nennt der Kunde z. B. **50, 100 oder 200 parallele Requests**, ist das **deutlich über 20** → **Shared-Business reicht nicht** → grundsätzlich **Dedicated AI Hosting**. **Welche** Dedicated-Konfiguration (1/2/4 GPUs) sinnvoll ist, lässt sich **nicht seriös nur aus der Parallel-Zahl** ableiten — auch Modell, Antwortlänge und Latenz zählen → **Beratungsgespräch** mit Vertrieb (+49 5772 293 150).\n\n**Typische Antwortstruktur:** Limits nennen → Shared ausgeschlossen? → Dedicated grundsätzlich + Dimensionierung gemeinsam klären.",
  },
  {
    id: 61,
    section: "Tarifwahl",
    question: "Mehrere Anforderungen gleichzeitig (§203, parallele Requests, Whisper/Token) — wie entscheide ich den Tarif?",
    answer: "Bei **kombinierten** Fragen **jeden Punkt einzeln** — dann **eine** klare Gesamt-Empfehlung **ohne Widerspruch**:\n\n1. **Parallele Requests:** Shared max. **20 gleichzeitig**. **>20** → Shared scheidet aus → **Dedicated AI Hosting** grundsätzlich (GPU-Anzahl mit Vertrieb dimensionieren).\n2. **Token / Whisper:** Stunden × ~180.000 Tokens/Stunde rechnen.\n3. **§ 203 / Kanzlei:** grundsätzlich **möglich** (AVV + Schweigepflichtvereinbarung) — **unabhängig vom Tarif**, ersetzt kein zu hohes Parallel-Limit.\n4. **Testtarif:** kein gratis Testtarif — Starter (echter Tarif) oder Vertrieb-Testumgebung.\n\n**Beispiel:** „§203 + 200 parallel + Whisper 100h“ → §203 ok, Whisper ok vom Volumen, **200 parallel** → Dedicated (nicht Business). Konfiguration abstimmen.\n\n**Antwortstruktur:** Anforderungen einzeln auflisten → klare Empfehlung.",
  },
  {
    id: 62,
    section: "Tarifwahl",
    question: "Wie viele GPUs brauche ich bei 50, 100 oder 500 parallelen Requests?",
    answer: "Alles **über 20 parallele Requests** liegt außerhalb der Shared-Tarife — dann kommt **Dedicated AI Hosting** grundsätzlich infrage (egal ob 50, 100 oder 500 — **jede** Spannbreite oberhalb 20 gilt gleich für Shared).\n\n**Aber:** Ob **1, 2 oder 4 GPUs** nötig sind, lässt sich **nicht seriös allein aus der Parallel-Zahl** ableiten. Entscheidend sind auch:\n\n- verwendetes **Modell** und Größe\n- durchschnittliche **Antwortlänge**\n- gewünschte **Antwortzeiten** / Lastprofil\n- ggf. Load Balancing oder Sharding\n\n**Empfehlung:** Kurzes **Beratungsgespräch** — gemeinsam die passende Dedicated-Umgebung dimensionieren: **+49 5772 293 150**.",
  },
  {
    id: 63,
    section: "Tarifwahl",
    question: "150 Nutzer tippen gleichzeitig im Chat — reicht Business mit 150 RPM?",
    answer: "**Nein, das sind zwei verschiedene Dinge.** Business: **150 RPM** (Anfragen pro Minute), aber max. **20 parallele Requests** (gleichzeitig offen).\n\nOb **150 Chat-Nutzer** schon **>20 parallele Requests** erzeugen, hängt ab von:\n\n- wie schnell das Modell antwortet\n- wie gleichzeitig Anfragen eintreffen\n- ob Nutzer warten oder parallel senden\n\n**Nur wenn dauerhaft deutlich >20 gleichzeitige offene Requests** zu erwarten sind, reicht Shared nicht → **Dedicated AI Hosting** prüfen. Sonst Business oft passend.",
  },
  {
    id: 64,
    section: "Agentur",
    question: "Kann ich AI Hosting steuerlich absetzen — z. B. als Forschung?",
    answer: "**Pauschal nicht beantwortbar.** Ob AI Hosting als Betriebsausgabe, Forschungsaufwand oder anders steuerlich behandelt wird, hängt von **Unternehmen, Rechtsform und konkretem Einsatzzweck** ab.\n\nmittwald gibt **keine Steuerberatung** — das sollte immer der **Steuerberater** des Unternehmens klären.",
  },
  {
    id: 65,
    section: "DSGVO",
    question: "Reicht Starter für Patientendaten — oder hängt Compliance vom Tarif ab?",
    answer: "**Grundsätzlich ja, möglich** — die Verarbeitung sensibler Daten (z. B. Patientendaten) hängt **nicht vom Tarifnamen**, sondern von **rechtlicher und technischer Umsetzung** ab:\n\n- Hosting in **Deutschland**\n- **AVV** mit mittwald\n- ggf. **Vereinbarung zur Schweigepflicht § 203 StGB** (Berufsgeheimnisträger)\n- TOMs, Zweckbindung, Verantwortlichkeit beim Kunden\n\n**Starter vs. Pro vs. Business** betrifft **Nutzungsumfang** (Token, RPM, Parallelität) — nicht ob sensible Daten grundsätzlich verarbeitet werden dürfen. Tarifwahl nach erwartetem Volumen.",
  },
  {
    id: 66,
    section: "DSGVO",
    question: "Dürfen wir unseren API-Key in einer Pressemitteilung veröffentlichen?",
    answer: "**Davon raten wir ausdrücklich ab.**\n\nAPI-Keys sind **Zugangsdaten** — wer den Key hat, kann auf eure AI-Hosting-Umgebung zugreifen und euer **Token-Kontingent** verbrauchen.\n\n**Partner-Tests:** eigenen **Test-API-Key** anlegen (nicht den Produktiv-Key), Verbrauch zuordnen, Key bei Bedarf **sofort deaktivieren** — **nicht** öffentlich in Pressemitteilungen oder im Frontend.",
  },
  {
    id: 67,
    section: "Integration",
    question: "Paperless-ngx (oder DMS) mit OpenAI GPT-4o für OCR — wie wechsle ich auf DSGVO-konformes AI Hosting?",
    answer: "**Kurz:** Ihr ersetzt die **OpenAI-Anbindung** durch **mittwald AI Hosting** — die Dokumente verarbeiten bleibt in eurer Verantwortung (AVV, Zweckbindung).\n\n**Was ihr braucht (nur KI-API):**\n\n1. **AI-Hosting-Tarif** buchen — **Tarifseite** (https://www.mittwald.de/mstudio/ai-hosting) **oder** im **mStudio** (Bestandskunden) → AI Hosting; Starter/Pro/Business je nach OCR-Volumen\n2. **API-Key** im mStudio anlegen\n3. In Paperless (oder eurem DMS) statt OpenAI: **OpenAI-kompatible API** mit Base-URL `https://llm.aihosting.mittwald.de/v1` und eurem API-Key\n\n**Modelle:**\n\n- **OCR / Texterkennung:** **GLM-OCR** (speziell für Text aus PDF, Bildern, Scans) — **nicht** GPT-4o und nicht primär Qwen-Chat-Modelle\n- **Optional danach:** Qwen3.6 o. ä. für Klassifikation, Tags oder Auswertung auf **bereits extrahiertem** Text\n\n**DSGVO / White-Label für Kunden:**\n\n- Verarbeitung in **Deutschland**, **kein** Datentransfer zu OpenAI\n- Bei personenbezogenen Dokumenten: **AVV** mit mittwald\n- Paperless-Hosting und Kundendaten im DMS liegen bei euch — AI Hosting speichert **keine** Prompt-/Dokumentinhalte dauerhaft\n\n**Paperless selbst hosten?** AI Hosting ersetzt **nicht** Paperless. Läuft Paperless schon woanders, reicht AI Hosting. Soll Paperless **auch** bei mittwald laufen → zusätzlich **vServer**, **Container Hosting** o. ä. ( separates Produkt, separate Kosten).\n\n**Kosten (Orientierung):**\n\n- **AI Hosting:** Preise aus Live-Tarifdaten (z. B. Starter ab 9 €/Monat, Pro 39 €/Monat, Business 149 €/Monat) — Tarif nach **monatlichem OCR-/Token-Volumen** wählen; monatlich wechselbar\n- **Paperless-Infrastruktur:** nur wenn neu/gehostet — vServer/Container extra\n\nBei größerem OCR-Volumen oder Architekturfragen: **Vertrieb** +49 5772 293 150.",
  },
  {
    id: 68,
    section: "Integration",
    question: "Wie buche ich AI Hosting — Website oder mStudio?",
    answer: "**Zwei Wege** — je nachdem, ob du schon ein mStudio-Konto hast:\n\n**1. Tarifseite (Website)** — https://www.mittwald.de/mstudio/ai-hosting\n\n- Tarif wählen (Starter / Pro / Business) und Bestellung abschließen\n- Geht auch, wenn du **noch kein** mStudio-Konto hast\n\n**2. mStudio** — https://mstudio.mittwald.de/\n\n- **Kostenlos anmelden**, falls noch kein Konto (Gewerbetreibende)\n- Anmelden → **AI Hosting** → Tarif buchen oder wechseln\n\n**Danach (für die API, immer im mStudio):**\n\n- **AI Hosting → API-Keys** — neuen Key anlegen\n- Base-URL in der Anwendung: https://llm.aihosting.mittwald.de/v1\n\n**Wichtig:** Die Tarifseite ist **nicht** dasselbe wie das mStudio-Portal — beides führt zum Buchen, der Einstieg ist unterschiedlich. mStudio-Login: **mstudio.mittwald.de** (nicht die Tarifseiten-URL).\n\n**Dedicated AI Hosting** (M/L/XL) über den **Vertrieb** (+49 5772 293 150) — nicht vollständig im Online-Tarifkonfigurator.",
  },
  {
    id: 69,
    section: "Modelle",
    question: "Wann Claude Opus (Anthropic) — und wann reicht mittwald AI Hosting?",
    answer: "Du vergleichst **zwei Angebote**: **Claude Opus bei Anthropic** (extern) **vs. AI Hosting bei mittwald**. Das ist **kein** Modell-Tausch innerhalb von mittwald.\n\n**Claude Opus** ist **nicht** in unserem Modellkatalog. Du nutzt es über einen **eigenen Anthropic-Vertrag** — Verarbeitung und Datenschutz gelten dann **beim externen Anbieter**, nicht bei mittwald.\n\n**Anthropic (Claude Opus) direkt** kann sinnvoll sein, wenn:\n\n- du **genau dieses Frontier-Modell** brauchst und unsere Alternativen für deinen Use Case nicht reichen\n- du Vertrag, Preismodell und Verarbeitungsort bei Anthropic bewusst so wählen\n\n**mittwald AI Hosting** ist oft passender, wenn:\n\n- **DSGVO** und Hosting in **Deutschland** wichtig sind\n- deine Anfragedaten **nicht** an OpenAI-, Anthropic- oder Google-**APIs** im Ausland gehen sollen\n- typische Projekte: Chatbots, RAG, Dokumentenanalyse, OCR, Agenten, Transkription (Whisper)\n- **planbare Monatspreise** (Starter/Pro/Business) statt externer Verbrauchsabrechnung\n\n**Was bei uns läuft:** Modelle auf **mittwald-Infrastruktur in DE** — aus der **Live-Modellliste**, z. B. **Qwen3.6-35B-A3B-FP8**, **Qwen3.5-122B-A10B-FP8**, **Ministral-3-14B-Instruct-2512**, **gpt-oss-120b**, **GLM-OCR**. Die Schnittstelle ist **OpenAI-kompatibel** — das heißt **nicht**, dass **GPT-4o**, **ChatGPT** oder **Claude** bei uns gehostet werden.\n\n**Typische Zuordnung:** Chat/RAG oft **Qwen3.6** · anspruchsvolles Reasoning **gpt-oss-120b** · Texterkennung **GLM-OCR**. Am besten im Playground oder mit Starter-Tarif für deinen Use Case testen und mit Claude Opus vergleichen.",
  },
  {
    id: 70,
    section: "Modelle",
    question: "Wann kommen große Frontier-Modelle wie Kimi oder DeepSeek?",
    answer: "Für **konkrete Modellnamen oder Versionen** (z. B. Kimi, DeepSeek, zukünftige Frontier-Modelle) können wir **keinen Termin** nennen — auch dann nicht, wenn du einen bestimmten Namen aus Presse oder Gerüchten zitierst.\n\n**Heute verfügbar:** nur Modelle aus der **Live-Modellliste** — Developer Portal oder API `/v1/models` mit deinem Key. Steht ein Modell **nicht** in der Liste, ist es bei uns **aktuell nicht buchbar**.\n\n**Grundsatz bei mittwald AI Hosting:**\n\n- Wir **betreiben Modelle selbst** auf unserer Infrastruktur in **Deutschland**.\n- Wir **binden keine externen Modell-APIs** ein — kein Proxy zu **Moonshot/Kimi**, Anthropic, OpenAI, Google o. Ä.\n- Größere **Open-Weight-/Open-Source-Modelle** prüfen wir fortlaufend — **ohne** öffentliche Roadmap für einzelne Namen.\n\n**Größere Modelle heute (Orientierung, exakt in Live-Liste prüfen):** z. B. **gpt-oss-120b**, **Qwen3.5-122B-A10B-FP8**, **Mistral-Medium-3.5-128B** (Testphase). Für sehr große oder dedizierte Setups: **Vertrieb** (+49 5772 293 150).\n\n**Praxis:** Use Case mit **aktuellen** Modellen testen (Playground oder Starter-Tarif). Konkreten Modellwunsch gern an Vertrieb melden — **ohne** Festzusage zu Terminen.",
  },
  {
    id: 71,
    section: "Integration",
    question: "Kann ich Agenten bei mittwald laufen lassen?",
    answer: "**Ja** — Agenten gehören zu den typischen Use Cases von AI Hosting.\n\n**Wichtig: Zwei Ebenen trennen**\n\n1. **AI Hosting** = **Modell-API** (OpenAI-kompatibel: `https://llm.aihosting.mittwald.de/v1` + API-Key aus mStudio). Hier laufen **keine** Agenten-Anwendungen selbst — nur die KI-Anfragen.\n2. **Agenten-Logik, Frontend oder Workflows** laufen **getrennt** auf deiner Infrastruktur — typischerweise **Container Hosting** (empfohlen) oder vServer.\n\n**Typische Setups:**\n\n- **LangChain**, **LlamaIndex**, eigene Apps → API-Anbindung an AI Hosting\n- **n8n**, **Open WebUI**, MCP-Server → oft **Container-Vorlagen** im mStudio (AI-Hosting-Zugangsdaten **vorkonfiguriert**)\n- **RAG** (Vector-DB + Dokumente), **OCR** (**GLM-OCR**), **Tool Calling** (externe Systeme/APIs anbinden)\n\n**Modelle mit Tool Calling** (Agenten-Workflows): u. a. **Qwen3.6-35B-A3B-FP8**, **gpt-oss-120b**, **Ministral-3-14B-Instruct-2512** — exakte Liste in der Live-Modellliste.\n\n**Tarif-Hinweis:** Agentensysteme mit vielen **gleichzeitigen** Anfragen sind von **parallelen Requests** und RPM limitiert (Business max. **20 parallel**). Bei dauerhaft höherer Parallelität → **Dedicated AI Hosting** prüfen.\n\n**Reine API-Nutzung** (Agent-Code läuft woanders) reicht **AI Hosting allein** — für UI, Plattform oder n8n zusätzlich **Container** oder vServer.",
  },
  {
    id: 72,
    section: "Integration",
    question: "DSGVO-konformer Website-Chat mit indexierten Seiteninhalten (RAG) für Kunden",
    answer: "**Ja, gut umsetzbar** — typisches Agentur- oder Unternehmens-Projekt.\n\n**Architektur (zwei Ebenen):**\n\n1. **AI Hosting** = Modell-API in **Deutschland** (Embeddings + Chat/RAG)\n2. **Container Hosting** oder vServer = Website-Chat, Vector-Datenbank, Crawler/Indexierung\n\n**Modelle (Orientierung, Live-Liste prüfen):**\n\n- **Indexierung:** **Qwen3-Embedding-8B** (Website-Texte vektorisieren)\n- **Optional:** **Qwen3-VL-Reranker-2B** für bessere Treffer\n- **Antworten:** **Qwen3.6-35B-A3B-FP8** (meist ausreichend) oder **gpt-oss-120b** bei anspruchsvollerem Reasoning\n\n**DSGVO:** Verarbeitung in DE, **kein** Datentransfer an US-APIs · bei personenbezogenen Inhalten **AVV** mit mittwald · Chat-Historie/Dokumente liegen bei **euch** (Plattform), nicht dauerhaft im AI Hosting.\n\n**Tarif AI Hosting — nach Einsatz wählen (nicht pauschal Starter):**\n\n- **Starter** — PoC, interner Test, sehr wenig Traffic\n- **Pro** — **produktive** Website-/Kunden-Chats mit RAG, mehr Reserve und höhere Rate Limits\n- **Business** — öffentlicher Chat mit **vielen gleichzeitigen** Nutzern (Shared max. 20 parallel)\n\n**Praxis:** Kleinen PoC mit Starter testen ist ok — für den **Live-Betrieb** einer Kunden-Wissensdatenbank meist **Pro**. Token & Parallelität beobachten, bei Bedarf upgraden.",
  },
  {
    id: 73,
    section: "Tarifwahl",
    question: "Welcher Tarif für eine Wissensdatenbank mit Chat — z. B. Autohandel, Kundenportal?",
    answer: "Hängt vom **Einsatz** ab — nicht jede Wissensdatenbank ist automatisch **Starter**.\n\n**Starter** passt, wenn:\n\n- du einen **PoC** oder internen Assistenten testest\n- wenige Nutzer und geringes monatliches Volumen\n- du bewusst **klein** starten und später upgraden willst\n\n**Pro** ist oft die bessere Wahl, wenn:\n\n- die Wissensdatenbank **produktiv** fürs Geschäft läuft (z. B. **Autohandel**, Beratung zu Fahrzeugen, Service, Finanzierung)\n- **Kunden oder Mitarbeiter** regelmäßig den Chat nutzen\n- du **Reserve** bei Tokens und **höhere Rate Limits** (RPM, parallele Requests) willst\n- umfangreiche RAG-Inhalte (viele Fahrzeugdaten, PDFs, FAQs) indexiert werden\n\n**Business**, wenn:\n\n- der Chat **öffentlich** auf der Website viele **gleichzeitige** Nutzer hat\n- du dauerhaft an die Shared-Grenze von **20 parallelen Requests** kommst\n\n**Technik:** Embeddings + Chat über **AI Hosting**; Vector-DB, Frontend und Index-Jobs auf **Container** oder vServer.\n\n**Typisch Autohandel mit „richtig guter“ Kunden-Wissensdatenbank:** Einstieg **Pro** — Starter nur zum Testen/PoC. Preise und Kontingente aus Live-Tarifdaten.",
  },
  {
    id: 74,
    section: "Modelle",
    question: "Was sind Embeddings?",
    answer: "**Embeddings** sind numerische Repräsentationen von Text — die KI wandelt Sätze oder Dokumente in **Vektoren** (Zahlenreihen) um, die die **Bedeutung** abbilden.\n\n**Einfach gesagt:** Ähnliche Inhalte liegen in der Vektordarstellung **nah beieinander**. So findet eine Wissensdatenbank z. B. bei „Welche Winterreifen passen zum Modell X?“ passende Stellen aus Fahrzeugdaten oder AGBs — auch wenn die Formulierung nicht wörtlich gleich ist.\n\n**Zwei Bausteine (nicht verwechseln):**\n\n1. **Embeddings erzeugen** → **AI Hosting** (z. B. **Qwen3-Embedding-8B**, API `/v1/embeddings`). Hier werden Texte in Vektoren **berechnet** — AI Hosting **speichert** diese Inhalte **nicht** dauerhaft.\n2. **Vektoren speichern & durchsuchen** → **Vector-Datenbank** auf **eurer** Infrastruktur (z. B. **Qdrant**).\n\n**Vector-Datenbank bei mittwald:**\n\n- AI Hosting **hostet keine** Vector-DB.\n- Eine Vector-Datenbank könnt ihr oft **einfach per Container-Vorlage** im **Container Hosting** (mStudio) anlegen — z. B. **Qdrant** für RAG-Projekte.\n- **Voraussetzung:** Ein **vServer** oder **Dedicated Server** als Basis — darauf läuft Container Hosting; **zusätzlich** braucht ihr einen **AI-Hosting-Tarif** für Embeddings und Chat.\n\n**Typischer RAG-Ablauf:** Dokumente embedden → in der Vector-DB speichern → bei Nutzerfrage ähnliche Vektoren suchen → beste Treffer ans Chat-Modell (z. B. **Qwen3.6-35B-A3B-FP8**) geben. Optional danach **Reranking** mit **Qwen3-VL-Reranker-2B**.",
  },
  {
    id: 75,
    section: "Integration",
    question: "Wie deploye ich meine Anwendung (Chat, RAG, Wissensdatenbank) bei mittwald?",
    answer: "**Wichtig:** **AI Hosting** deployt ihr **nicht** wie eine App — ihr **bucht** einen Tarif und nutzt die **API**. **Deployen** müsst ihr eure **Anwendung** (Chat-Frontend, RAG-Backend, Vector-DB) — getrennt davon.\n\n**Typischer Ablauf:**\n\n**1. Infrastruktur für die App**\n\n- **vServer** oder **Dedicated Server** buchen (Basis für Container Hosting)\n- Im **mStudio** **Container Hosting** für das Projekt nutzen\n\n**2. Anwendung bereitstellen**\n\n- **Schnellstart:** **Container-Vorlage** im mStudio wählen — z. B. **Open WebUI** (Chat), **Qdrant** (Vector-DB), **n8n** (Workflows). Bei vielen Vorlagen sind **AI-Hosting-Zugangsdaten** schon vorkonfiguriert.\n- **Eigene App:** Docker-Image im Container Hosting deployen (mStudio oder mittwald CLI) — z. B. eigenes RAG-Backend oder Kundenportal.\n\n**3. KI-Anbindung (AI Hosting)**\n\n1. **Tarifseite** (https://www.mittwald.de/mstudio/ai-hosting) **oder** mStudio → **AI Hosting** → Tarif buchen\n2. **API-Key** anlegen\n3. In der App: Base-URL `https://llm.aihosting.mittwald.de/v1` + API-Key (OpenAI-kompatibel)\n\n**4. Go-Live**\n\n- Domain/SSL im mStudio an die App binden\n- Dokumente indexieren (Embeddings über AI Hosting), Vector-DB füllen, Chat testen\n\n**Merksatz:** Container/vServer = **eure App** · AI Hosting = **Modell-API** (Chat, Embeddings, OCR …). Beides wird **separat** eingerichtet.\n\nBei komplexer Architektur (mehrere Mandanten, hohe Last): **Vertrieb** (+49 5772 293 150).",
  },
  {
    id: 76,
    section: "Tarifwahl",
    question: "Welche Modelle laufen auf Dedicated M — und wann brauche ich L?",
    answer: "**Dedicated AI M** = **1× RTX 6000 PRO**, **96 GB VRAM gesamt** (ca. 62 GB fürs Modell) — **nicht** 48 GB.\n\n**Aktueller Stand (Dedicated, eigene GPU):**\n\n- **Dedicated M (1 GPU):** Laufen **alle** Modelle aus dem Katalog — **Ausnahme:** **Mistral-Medium-3.5-128B** und **Qwen3.5-122B-A10B-FP8** → dafür **mindestens Dedicated L** (2 GPUs).\n- **gpt-oss-120b** und die übrigen Katalog-Modelle laufen auf **Dedicated M**.\n\n**Shared vs. Dedicated:** Viele Modelle (inkl. gpt-oss-120b) sind auch auf **Shared** (Starter/Pro/Business) per **API** nutzbar — Dedicated brauchst du für unlimited Tokens, eigene GPU oder wenn Shared-Limits nicht reichen.\n\n**Dedicated L (2 GPUs):** Für **Mistral-Medium-3.5-128B** und **Qwen3.5-122B-A10B-FP8** auf Dedicated; auch Load Balancing / Model-Sharding.\n\n**Beratung:** Bei Dedicated-Modellfragen gerne hier orientieren — **konkrete Konfiguration und Buchung** mit dem **Vertrieb** klären: **+49 5772 293 150**.",
  },
  {
    id: 56,
    section: "Tarifwahl",
    question: "Welche Dedicated AI Hosting Tarife gibt es — M, L, XL im Überblick?",
    answer: "**Dedicated AI Hosting** = eigene **RTX 6000 PRO** GPUs nur für dein Projekt, **unlimited Tokens**, OpenAI-kompatible API, Hosting in Deutschland (DSGVO). Buchung über den **Vertrieb** (+49 5772 293 150) — nicht vollständig im mStudio-Tarifkonfigurator.\n\n**Dedicated AI M** — **999 €/Monat**\n- 1× RTX 6000 PRO, 96 GB VRAM (ca. 62 GB fürs Modell)\n- Unlimited Tokens\n- Mindestlaufzeit **3 Monate**\n- Bereitstellung ca. 2–4 Wochen\n- Modellgröße / Katalog: **aktuell alle Modelle** auf M — **Ausnahme** Mistral-Medium-3.5-128B und Qwen3.5-122B-A10B-FP8 (→ mindestens L)\n\n**Dedicated AI L** — **1.899 €/Monat**\n- 2× RTX 6000 PRO, 192 GB VRAM (ca. 125 GB fürs Modell)\n- Unlimited Tokens\n- Mindestlaufzeit **6 Monate**\n- Bereitstellung ca. 2–4 Wochen\n- Modellgröße: **mindestens** für Mistral-Medium-3.5-128B und Qwen3.5-122B-A10B-FP8 (2 GPUs); auch Load Balancing / Model-Sharding\n\n**Dedicated AI XL** — **3.599 €/Monat**\n- 4× RTX 6000 PRO, 384 GB VRAM (ca. 250 GB fürs Modell)\n- Unlimited Tokens\n- Mindestlaufzeit **6 Monate**\n- Bereitstellung ca. 2–4 Wochen\n- Modellgröße grob: deutlich über 120B bis ca. 200B+\n\n**Optionale Erweiterungen:** weiteres Modell 199 € einmalig; Load Balancing oder Model-Sharding je 199 €/Monat.\n\n**Einstieg:** In der Regel mit **M (1 GPU)** starten — L/XL nur bei konkretem Mehr-GPU-Bedarf.",
  },
  {
    id: 57,
    section: "Tarifwahl",
    question: "Kann ich AI Hosting unverbindlich oder kostenlos testen — gibt es einen Testtarif?",
    answer: "Aktuell gibt es **keinen direkt buchbaren Testtarif** und kein kostenloses Probe-Abo zum Selbstaktivieren.\n\n**Zwei sinnvolle Wege:**\n\n1. **Starter buchen** — auf der **Tarifseite** (https://www.mittwald.de/mstudio/ai-hosting) **oder** im **mStudio** → AI Hosting; kleinster regulärer Tarif (Preis laut Live-Tarifdaten, derzeit **9 €/Monat**). Damit kannst du AI Hosting produktiv ausprobieren. Shared-Tarife sind monatlich kündbar (30 Tage Frist zum Monatsende) — du kannst nach dem Test also wieder beenden oder upgraden.\n\n2. **Vertrieb** (+49 5772 293 150) — wenn du z. B. **größere Modelle**, **Dedicated GPUs** oder ein **zeitlich begrenztes Test-Setup** brauchst, richten wir dir gemeinsam eine **Testumgebung** ein.\n\n**Nicht** als „gratis Testphase“ oder „unverbindlich ohne Buchung“ verkaufen — Starter ist ein echter Tarif, kein separates Demo-Paket.",
  },
  {
    id: 59,
    section: "Tarifwahl",
    question: "Kann ich mehrere AI-Hosting-Tarife gleichzeitig buchen — z. B. pro Plattform oder Kunde?",
    answer: "**Aktuell nein** — pro **Organisation bzw. Vertragspartner** ist nur **ein** AI-Hosting-Tarif buchbar. Ihr könnt euch **nicht** auf mehrere parallele AI-Tarife (z. B. Business für Plattform A + Starter für Plattform B) **innerhalb derselben Organisation** aufteilen.\n\n**Was geht heute:**\n\n- **Ein** Tarif für die Organisation — alle Plattformen/Projekte teilen Token-Kontingent und Rate Limits.\n- **Mehrere API-Keys** pro Tarif — technische Trennung und Zuordnung des Verbrauchs, aber **kein** separates Kontingent pro Key.\n\n**Roadmap:** Mehrere AI-Tarife pro Organisation — Feature in Entwicklung, **geplanter Launch Q3 2026** (zuversichtlich, ohne verbindliche Zusage).\n\nBei Architekturfragen (Agentur + Anwalts-SaaS, mehrere Mandanten): **Vertrieb** (+49 5772 293 150) — technische und vertragliche Beratung zu AI Hosting und Compliance.",
  },
  {
    id: 7,
    section: "Tarifwahl",
    question: "Gibt es versteckte Kosten außerhalb der monatlichen Grundgebühr?",
    answer: "Nein.\n\nEs gibt keine versteckten Zusatzkosten.\n\nDie monatliche Grundgebühr enthält das jeweilige Token-Kontingent sowie die Nutzung der verfügbaren AI-Modelle entsprechend des gewählten Tarifs.\n\nBenötigst du dauerhaft mehr Leistung, wechselst du einfach in einen größeren Tarif.",
  },
  {
    id: 8,
    section: "Tarifwahl",
    question: "Wie schätze ich den Token-Bedarf für einen TYPO3-Chatbot mit 500 Anfragen pro Monat?",
    answer: "Ein TYPO3-Chatbot mit etwa **500 Anfragen pro Monat** liegt in der Regel deutlich innerhalb des **Starter-Tarifs**.\n\nAls Faustregel verbraucht eine typische Chat-Anfrage meist nur einige hundert bis wenige tausend Token. Der tatsächliche Verbrauch hängt jedoch von der Länge der Nutzerfragen, den Antworten, eventuellen Dokumenten im Kontext und dem verwendeten Modell ab.\n\nFür klassische Website-Chatbots reicht Starter normalerweise problemlos aus.\n\nSollten später umfangreiche RAG-Systeme, viele Nutzer oder agentische Workflows hinzukommen, kannst du jederzeit auf Pro oder Business wechseln.",
  },
  {
    id: 9,
    section: "Tarifwahl",
    question: "Wie viele Chat-Anfragen sind realistisch im Starter (5 Mio. Tokens) drin?",
    answer: "Eine pauschale Anzahl lässt sich nicht seriös angeben, da jede Unterhaltung unterschiedlich viele Tokens verbraucht.\n\nKurze FAQ-Chats benötigen deutlich weniger Tokens als umfangreiche Dokumentenanalysen oder agentische Workflows.\n\nFür typische Website-Chatbots oder interne Assistenten reichen **5 Millionen Token** jedoch meist für **viele tausend Chat-Anfragen pro Monat** aus.\n\nDie Token-Beispiele auf der Tarifseite helfen zusätzlich bei der Einschätzung.",
  },
  {
    id: 10,
    section: "Tarifwahl",
    question: "Lohnt sich Starter nur zum Testen, oder kann man damit auch ein kleines Produktivprojekt betreiben?",
    answer: "Es gibt **keinen separaten Testtarif** — der **Starter** ist der kleinste reguläre Shared-Tarif (nicht gratis, nicht „nur Demo“).\n\nTrotzdem eignet er sich gut zum **Ausprobieren**, weil du monatlich kündigen kannst — und gleichzeitig für:\n\n- kleine Produktivprojekte\n- Website-Chatbots\n- interne Assistenten\n- erste Kundenanwendungen\n- Prototypen\n\nViele Kunden starten mit Starter und wechseln erst auf Pro oder Business, wenn das Projekt wächst. Für Dedicated, große Modelle oder ein zeitlich begrenztes Test-Setup: **Vertrieb** (+49 5772 293 150).",
  },
  {
    id: 11,
    section: "Tarifwahl",
    question: "Wie unterscheiden sich die Tarife bei den Rate Limits?",
    answer: "Neben dem monatlichen Token-Kontingent unterscheiden sich die Tarife auch bei den technischen Limits.\n\nDazu gehören insbesondere **zwei verschiedene Größen** — **nicht verwechseln**:\n\n- **Requests pro Minute (RPM)** — wie viele API-Anfragen pro **Minute** (Business: **150 RPM**)\n- **Parallele Requests** — wie viele Anfragen **gleichzeitig** offen sein dürfen (Business: **20** parallele Requests)\n\n**Starter / Pro / Business (Shared, Orientierung):** z. B. Starter 30 RPM / 5 parallel · Pro 60 RPM / 10 parallel · Business 150 RPM / **20 parallel**.\n\nDie Rate Limits begrenzen nicht die monatliche Nutzung, sondern kurzfristige Spitzenlast. Sie werden insbesondere bei öffentlichen Chatbots, Agentensystemen oder Anwendungen mit vielen gleichzeitigen Nutzern relevant.\n\n**Typischer Fehler:** „150 parallele Requests“ mit **150 RPM** gleichsetzen — das sind unterschiedliche Limits. Braucht ihr dauerhaft **mehr als 20 gleichzeitige Requests**, reicht Shared-Business nicht → **Dedicated** (ggf. mit Load Balancing) prüfen.\n\nFür kleinere interne Anwendungen spielen Rate Limits häufig zunächst keine Rolle.",
  },
  {
    id: 12,
    section: "Tarifwahl",
    question: "Brauchen wir pro Kundenprojekt einen eigenen Tarif — oder mehrere Tarife parallel in einer Organisation?",
    answer: "Aktuell kannst du pro **Organisation bzw. Vertragspartner nur einen AI-Hosting-Tarif** buchen — eine Aufteilung auf **mehrere parallele AI-Tarife** innerhalb derselben Organisation ist **noch nicht** möglich.\n\n**Heute üblich:** Ein gemeinsamer Tarif (z. B. Business) für alle Projekte/Plattformen der Organisation. Mehrere **API-Keys** trennen Anwendungen **logisch** (Zuordnung, interne Abrechnung) — **Token-Kontingent und Rate Limits** teilen sich aber über **einen** Tarif.\n\n**Geplant:** Mehrere AI-Tarife pro Organisation — mittwald arbeitet daran; **Ziel-Launch Q3 2026** (Roadmap, ohne Festzusage).\n\nBis dahin: Tarifgröße (Starter/Pro/Business) so wählen, dass **Summe aller Projekte** im Kontingent und bei den Rate Limits mitläuft — bei SaaS mit hoher Last oft **Business**.",
  },
  {
    id: 13,
    section: "Tarifwahl",
    question: "Wie kalkuliere ich AI-Hosting-Kosten in ein Agentur-Angebot für Endkunden?",
    answer: "Viele Agenturen kalkulieren AI Hosting als festen Bestandteil ihres monatlichen Wartungs- oder Hostingpakets.\n\nDadurch profitieren Endkunden von:\n\n- planbaren monatlichen Kosten,\n- keinen schwankenden Token-Abrechnungen,\n- einer einfachen Kalkulation.\n\nDa mehrere Kundenprojekte häufig über einen gemeinsamen Tarif betrieben werden können, lässt sich der tatsächliche Verbrauch effizient bündeln.\n\nSteigt die Nutzung später an, kann jederzeit auf einen größeren Tarif gewechselt werden.",
  },
  {
    id: 14,
    section: "Tarifwahl",
    question: "Gibt es Mengenrabatte oder Sonderkonditionen für größere Agenturen?",
    answer: "Bei größeren Agenturen, hohen Token-Verbräuchen oder besonderen Infrastruktur-Anforderungen empfiehlt sich eine direkte Anfrage beim Vertrieb.\n\nGemeinsam kann geprüft werden, ob individuelle Konditionen oder eine Dedicated-Lösung sinnvoll sind.",
  },
  {
    id: 15,
    section: "Tarifwahl",
    question: "Was kostet typischerweise die Transkription von einer Stunde Audio pro Monat im Pro-Tarif?",
    answer: "Für das Whisper-Modell gilt die Faustformel:\n\n**20 Millisekunden Audio entsprechen einem Token.**\n\nDie Abrechnung erfolgt auf volle Sekunden aufgerundet.\n\n**Beispielrechnung (10 Stunden Audio/Monat):**\n\n- 1 Sekunde ≈ 50 Tokens (1.000 ms ÷ 20 ms)\n- 1 Stunde (3.600 s) ≈ **180.000 Tokens**\n- **10 Stunden ≈ 1,8 Mio. Tokens** — liegt locker im **Starter** (5 Mio. Tokens/Monat)\n\n**50 Stunden ≈ 9 Mio. Tokens** — **Starter (5 Mio.) reicht nicht**; **Pro** oder **Business** je nach Reserve.\n\nDadurch verbraucht selbst mehrere Stunden Audio nur einen vergleichsweise kleinen Teil des monatlichen Token-Kontingents.\n\nFür gelegentliche Meeting-, Podcast- oder Interview-Transkriptionen reicht bereits der Starter-Tarif häufig aus.",
  },
  {
    id: 16,
    section: "Tarifwahl",
    question: "Welcher Tarif ist der richtige, wenn ich meinen zukünftigen Token-Verbrauch noch gar nicht kenne?",
    answer: "Wenn du deinen zukünftigen Verbrauch noch nicht einschätzen kannst, empfiehlt sich der Einstieg mit dem kleinsten passenden Tarif.\n\nDa alle Tarife monatlich gewechselt werden können, besteht kein Risiko, dauerhaft einen zu großen Tarif zu buchen.\n\nSteigt die Nutzung später an, kannst du jederzeit auf Pro oder Business wechseln.",
  },
  {
    id: 17,
    section: "Tarifwahl",
    question: "Woran merke ich, dass ich einen größeren Tarif brauche?",
    answer: "Typische Anzeichen sind:\n\n- das monatliche Token-Kontingent wird regelmäßig ausgeschöpft,\n- die Rate Limits werden häufig erreicht,\n- deutlich mehr Nutzer greifen gleichzeitig auf die Anwendung zu,\n- weitere Kundenprojekte kommen hinzu.\n\nIn diesen Fällen empfiehlt sich ein Wechsel auf den nächsthöheren Tarif. Das mittwald-Team unterstützt dich gerne dabei, den tatsächlichen Bedarf einzuschätzen.",
  },
  {
    id: 18,
    section: "Modelle",
    question: "Welches Modell empfehlt ihr für allgemeine Chatbots auf Kundenwebsites?",
    answer: "Für die meisten Chatbots auf Kundenwebsites empfehlen wir **Qwen3.6-35B-A3B-FP8**.\n\nEs bietet ein sehr gutes Verhältnis aus Qualität, Geschwindigkeit und Kosten und unterstützt zusätzlich:\n\n- Chat\n- Reasoning\n- Vision\n- Tool Calling\n- lange Kontextfenster\n\nFür einfachere und besonders kostensensitive Chatbots kann auch **Ministral-3-14B-Instruct-2512** eine sehr gute Wahl sein.",
  },
  {
    id: 19,
    section: "Modelle",
    question: "Wann sollte ich gpt-oss-120b statt Qwen3.6 oder Ministral nutzen?",
    answer: "Das **gpt-oss-120b** empfiehlt sich insbesondere für:\n\n- komplexe textbasierte Anwendungen\n- anspruchsvolle Reasoning-Aufgaben\n- agentische Workflows\n- hochwertige Automatisierungen\n\nWenn maximale Wissensleistung und Präzision wichtiger sind als Kosten oder Geschwindigkeit, ist gpt-oss-120b häufig die richtige Wahl.\n\nFür allgemeine Chatbots oder kostenbewusste Anwendungen reicht Qwen3.6 oder Ministral dagegen oft vollkommen aus.",
  },
  {
    id: 20,
    section: "Modelle",
    question: "Welches Modell ist am günstigsten für einfache Klassifizierung und Routing?",
    answer: "Für einfache Aufgaben wie\n\n- Klassifizierung\n- Routing\n- einfache Frage-Antwort-Systeme\n- Batch-Verarbeitung\n\nempfiehlt sich **Qwen3.5-0.8B**.\n\nDas Modell wurde speziell für hohe Effizienz und geringe Kosten entwickelt und eignet sich hervorragend für Aufgaben, bei denen kein großes Frontier-Modell benötigt wird.",
  },
  {
    id: 21,
    section: "Modelle",
    question: "Brauche ich Qwen3.5-122B oder reicht Qwen3.6 für die meisten Agentur-Use-Cases?",
    answer: "Für die meisten Agentur-Projekte reicht **Qwen3.6-35B-A3B-FP8** vollkommen aus.\n\nEs eignet sich besonders für:\n\n- Chatbots\n- RAG-Anwendungen\n- Dokumentenanalyse\n- Vision-Aufgaben\n- Agenten-Workflows\n\n**Qwen3.5-122B** empfiehlt sich vor allem dann, wenn besonders anspruchsvolle Reasoning- oder Vision-Aufgaben mit einer möglichst hohen Modellkapazität gelöst werden sollen.\n\nAls Faustregel gilt:\n\n> Beginne mit dem kleinsten Modell, das deine Qualitätsanforderungen erfüllt, und wechsle erst bei Bedarf auf größere Modelle.",
  },
  {
    id: 22,
    section: "Modelle",
    question: "Wann lohnt sich Mistral-Medium-3.5-128B trotz Testphase?",
    answer: "Mistral-Medium-3.5 eignet sich besonders für:\n\n- komplexe mehrsprachige Anwendungen\n- anspruchsvolle Vision-Aufgaben\n- Frontier-Modelle mit hoher Qualität\n- komplexe Reasoning-Aufgaben\n\nDa sich das Modell aktuell noch in der **Testphase** befindet, können Verhalten, Funktionsumfang oder Verfügbarkeit noch angepasst werden.\n\nFür produktionskritische Anwendungen sollte dieser Status berücksichtigt werden.",
  },
  {
    id: 23,
    section: "Modelle",
    question: "Welches Modell eignet sich für Bildanalyse und automatische ALT-Texte?",
    answer: "Für Bildanalyse stehen mehrere Modelle zur Verfügung.\n\nFür allgemeine Bildanalyse und automatische ALT-Texte eignen sich insbesondere:\n\n- Qwen3.6-35B-A3B-FP8\n- Ministral-3-14B-Instruct-2512\n- Qwen3.5-122B-A10B-FP8\n- Mistral-Medium-3.5-128B\n\nAlle unterstützen Vision-Funktionalität.\n\nWelches Modell sinnvoll ist, hängt vom gewünschten Qualitätsniveau und den Kosten ab.",
  },
  {
    id: 24,
    section: "Modelle",
    question: "Welches Modell nutze ich für OCR oder Rechnungen – und ist das im Tarif enthalten?",
    answer: "Für OCR-Anwendungen empfiehlt sich **GLM-OCR**.\n\nEs eignet sich zum Extrahieren von Text aus:\n\n- PDF\n- DOCX\n- PPTX\n- XLSX\n- HTML\n- SVG\n- Bildern\n- gescannten Rechnungen\n- Verträgen\n- Formularen\n\nGLM-OCR gehört zu den verfügbaren AI-Modellen und kann innerhalb des gebuchten AI-Hosting-Tarifs genutzt werden.\n\nDa sich GLM-OCR aktuell noch in der Testphase befindet, können sich Funktionen noch ändern.",
  },
  {
    id: 25,
    section: "Modelle",
    question: "Wie setze ich Embeddings und Reranking für RAG sinnvoll ein?",
    answer: "Für klassische RAG-Systeme empfiehlt sich folgende Kombination:\n\n1. Dokumente mit **Qwen3-Embedding-8B** in Vektoren umwandeln.\n2. Über eine Vektordatenbank passende Dokumente suchen.\n3. Die Treffer anschließend mit **Qwen3-VL-Reranker-2B** neu bewerten.\n4. Die bestbewerteten Dokumente an das Sprachmodell übergeben.\n\nDadurch verbessert sich häufig die Qualität der Suchergebnisse und der späteren Antworten.",
  },
  {
    id: 26,
    section: "Modelle",
    question: "Kann ich Whisper für Meeting-Protokolle nutzen – und wie wirkt sich das auf Tokens aus?",
    answer: "Ja.\n\n**Whisper-Large-V3-Turbo** eignet sich ideal für:\n\n- Meeting-Protokolle\n- Podcasts\n- Support-Gespräche\n- Interviews\n- Sprachbefehle\n\nFür die Tokenberechnung gilt:\n\n> **20 Millisekunden Audio entsprechen einem Token.**\n\nDie Abrechnung erfolgt auf volle Sekunden aufgerundet.",
  },
  {
    id: 27,
    section: "Modelle",
    question: "Welche Modelle unterstützen Tool Calling für Agenten-Workflows?",
    answer: "Folgende Chatmodelle unterstützen Tool Calling:\n\n- gpt-oss-120b\n- Qwen3.5-0.8B\n- Ministral-3-14B-Instruct-2512\n- Qwen3.6-35B-A3B-FP8\n- Qwen3.5-122B-A10B-FP8\n- Mistral-Medium-3.5-128B\n\nDamit eignen sie sich für Agenten-Workflows, Automatisierungen und MCP-Anwendungen.",
  },
  {
    id: 28,
    section: "Modelle",
    question: "Was bedeutet „Testphase“ bei einigen Modellen für den Produktivbetrieb?",
    answer: "Modelle in der Testphase befinden sich noch in einer frühen Entwicklungsphase.\n\nDas bedeutet:\n\n- Verhalten kann sich ändern.\n- Funktionen können erweitert werden.\n- Funktionen können auch wieder entfernt werden.\n- Modelle können durch neuere Versionen ersetzt werden.\n\nFür Tests und Evaluation sind sie gut geeignet. Bei produktionskritischen Anwendungen sollte dieser Status berücksichtigt werden.",
  },
  {
    id: 29,
    section: "Modelle",
    question: "Wie wechsle ich das Modell, ohne die API-Integration komplett umzubauen?",
    answer: "Die Modelle werden über dieselbe AI-Hosting-API bereitgestellt.\n\nIn der Regel muss lediglich der Modellname angepasst werden.\n\nDie bestehende API-Integration kann dabei unverändert bleiben.\n\nDadurch lässt sich ein Modell einfach testen oder später gegen ein anderes austauschen.",
  },
  {
    id: 30,
    section: "Modelle",
    question: "Welches Modell würdet ihr für Code-Review und Debugging empfehlen?",
    answer: "Für anspruchsvolle Code-Reviews und Debugging empfiehlt sich **gpt-oss-120b**.\n\nEs wurde speziell für komplexe textzentrierte Workloads, Reasoning und agentische Aufgaben empfohlen.\n\nFür einfachere Programmieraufgaben oder wenn Kosten eine größere Rolle spielen, kann auch **Qwen3.6-35B-A3B-FP8** eine sehr gute Wahl sein.\n\nGrundsätzlich gilt auch hier die Empfehlung:\n\n> Starte mit dem kleinsten Modell, das deine Qualitätsanforderungen erfüllt, und wechsle nur bei Bedarf auf ein größeres Modell.",
  },
  {
    id: 31,
    section: "DSGVO",
    question: "Ist mittwald AI Hosting DSGVO-konform — und wo werden Daten verarbeitet?",
    answer: "Ja, mittwald AI Hosting ist für eine DSGVO-konforme Nutzung ausgelegt.\n\nDie Modelle werden in der Infrastruktur von mittwald in Deutschland betrieben. Es findet durch AI Hosting kein Datentransfer in Drittstaaten wie die USA statt.\n\nDie Kommunikation mit den Modellen erfolgt verschlüsselt per HTTPS. Die konkrete rechtliche Bewertung des jeweiligen Anwendungsfalls, zum Beispiel Einwilligung, Zweckbindung oder EU-AI-Act-Einstufung, liegt jedoch beim Nutzer bzw. Plattformbetreiber.",
  },
  {
    id: 32,
    section: "DSGVO",
    question: "Werden unsere Prompts oder Kundendaten zum Training von Modellen verwendet?",
    answer: "Nein.\n\nDie Modelle sind nicht selbstlernend. Prompts, Antworten und übergebene Daten fließen nicht in ein Modelltraining ein.\n\nmittwald AI Hosting speichert keine Prompt- oder Antwortinhalte dauerhaft und nutzt diese auch nicht zur Modellverbesserung.\n\nFür Betrieb, Abrechnung und Stabilitätsanalyse werden nur technische Meta-Daten verarbeitet, zum Beispiel:\n\n- IP-Adresse\n- API-Key\n- Zeitpunkt der Anfrage\n- Tokenanzahl\n\nInhaltliche Texte werden dabei nicht gespeichert.",
  },
  {
    id: 33,
    section: "DSGVO",
    question: "Dürfen wir Kundendaten aus Gesundheits-, Finanz- oder Behördenprojekten verarbeiten?",
    answer: "Grundsätzlich stellt mittwald AI Hosting eine **DSGVO-fähige Infrastruktur in Deutschland** bereit — ohne Datentransfer in Drittstaaten.\n\nOb ein konkreter Anwendungsfall mit Gesundheits-, Finanz-, Behörden- oder anderen sensiblen Daten zulässig ist, hängt von **rechtlicher und technischer Umsetzung** ab — **nicht** davon, ob Starter, Pro oder Business gewählt wird. Entscheidend: AVV, TOMs, Zweckbindung; ggf. §-203-Vereinbarung.\n\n**Berufsgeheimnisträger** (z. B. Kanzleien, Steuerberater): AI Hosting ist mit **AVV** und der **Vereinbarung zur Schweigepflicht nach § 203 StGB** grundsätzlich nutzbar.\n\nTarifwahl (Starter/Pro/Business) nach **Nutzungsumfang** (Token, RPM, Parallelität). Vor Produktivbetrieb in regulierten Bereichen: rechtliche Prüfung.",
  },
  {
    id: 34,
    section: "DSGVO",
    question: "Brauchen wir mit AI Hosting einen Auftragsverarbeitungsvertrag (AVV) mit mittwald?",
    answer: "Ja, wenn **personenbezogene Daten** über AI Hosting verarbeitet werden, sollte ein **AVV** mit mittwald abgeschlossen werden.\n\nmittwald verarbeitet im Auftrag des Kunden; der Kunde bleibt für Rechtsgrundlage und datenschutzkonforme Ausgestaltung verantwortlich.\n\n**Zusätzlich** (nicht Ersatz für den AVV): Für **Berufsgeheimnisträger** kann eine **Vereinbarung zur Schweigepflicht nach § 203 StGB** bereitgestellt werden — siehe dazu die eigene FAQ-Antwort.",
  },
  {
    id: 35,
    section: "DSGVO",
    question: "Wie unterscheidet sich AI Hosting rechtlich von OpenAI, Azure oder Google?",
    answer: "Der zentrale Unterschied ist der Betrieb der Modelle auf mittwald-Infrastruktur in Deutschland.\n\nBei mittwald AI Hosting werden die angebotenen Modelle nicht über die API der Modellhersteller betrieben. Die Modelle stammen zwar teilweise von Unternehmen wie OpenAI, Mistral oder Alibaba, werden aber von mittwald selbst auf eigener Infrastruktur gehostet.\n\nDas ist vergleichbar mit Open-Source-Software wie WordPress oder TYPO3: Die Software stammt vom Hersteller, wird aber auf eigener Infrastruktur betrieben.\n\nDadurch werden Kundendaten nicht an OpenAI, Mistral, Alibaba oder andere Modellhersteller weitergeleitet.",
  },
  {
    id: 36,
    section: "DSGVO",
    question: "Können wir garantieren, dass keine Daten in die USA fließen?",
    answer: "Für AI Hosting gilt: Die Verarbeitung erfolgt in der Infrastruktur von mittwald in Deutschland.\n\nDurch AI Hosting findet kein Datentransfer in Drittstaaten wie die USA statt. Kundendaten werden nicht an OpenAI, Mistral, Alibaba oder andere Modellhersteller weitergegeben.\n\nWichtig ist: Diese Aussage bezieht sich auf AI Hosting selbst. Wenn der Plattformbetreiber zusätzliche externe Dienste einbindet, muss er diese Datenflüsse separat bewerten.",
  },
  {
    id: 37,
    section: "DSGVO",
    question: "Wie sicher sind API-Keys — können wir pro Projekt/Kunde trennen?",
    answer: "Der Zugriff auf AI Hosting erfolgt über API-Keys, die im mStudio verwaltet werden.\n\nEs können **mehrere API-Keys** angelegt werden — damit lassen sich Projekte, Kunden oder Plattformen **logisch trennen** (Verbrauch zuordnen, Keys rotieren).\n\n**Wichtig:** Alle Keys einer Organisation hängen am **selben** AI-Hosting-Tarif — geteiltes Token-Kontingent und gemeinsame Rate Limits. **Mehrere parallele Tarife pro Organisation** sind aktuell nicht buchbar (geplant Q3 2026).\n\nAPI-Keys **vertraulich** behandeln — **nicht** öffentlich (Pressemitteilung, Frontend, GitHub). Partner-Tests über **eigenen Test-Key**, jederzeit deaktivierbar.",
  },
  {
    id: 38,
    section: "DSGVO",
    question: "Was passiert mit Logs und gespeicherten Daten nach Vertragsende?",
    answer: "mittwald AI Hosting speichert keine Prompt-, Antwort- oder Inhaltsdaten dauerhaft im AI Hosting selbst.\n\nDie Modelle arbeiten stateless. Inhalte wie Chat-Historien, Dokumente, Embeddings oder Wissensdatenbanken werden typischerweise in der Plattform des Kunden bzw. Plattformbetreibers gespeichert, nicht im AI Hosting.\n\nmittwald führt nur technisch notwendige Meta-Logs, zum Beispiel IP-Adresse, API-Key, Zeitpunkt und Tokenanzahl. Diese dienen Betrieb, Abrechnung und Stabilitätsanalyse.\n\nDaten, die der Plattformbetreiber selbst speichert, etwa Chat-Historien oder Dokumente, müssen durch den Plattformbetreiber nach dessen eigenem Löschkonzept behandelt werden.",
  },
  {
    id: 53,
    section: "DSGVO",
    question: "Dürfen Kanzleien, Steuerberater und Berufsgeheimnisträger AI Hosting nutzen — Vereinbarung zur Schweigepflicht (§ 203 StGB)?",
    answer: "Ja — **AI Hosting** kann von **Berufsgeheimnisträgern** (z. B. Kanzleien, Steuerberater, weitere Berufsgruppen mit § 203 StGB) genutzt werden, wenn:\n\n- ein **AVV** mit mittwald besteht und\n- die **DSGVO-konforme Infrastruktur in Deutschland** genutzt wird (kein Datentransfer in Drittstaaten über AI Hosting).\n\nZusätzlich stellt mittwald auf Anfrage eine **Vereinbarung zur Schweigepflicht von mitwirkenden Personen nach § 203 StGB** bereit. Darin verpflichtet sich mittwald, im Rahmen der Mitwirkung an der Tätigkeit des Berufsgeheimnisträgers erlangte Geheimnisse geheim zu halten — inkl. Verpflichtung der Beschäftigten und Regeln zur Unterbeauftragung (keine Unterauftragnehmer im Ausland).\n\n**Wichtig — ausdrückliche Ausnahme:** Die Vereinbarung gilt **nicht** für **E-Mail-Umzug** und **E-Mail-Archivierung**. Für diese Leistungen kann der strafbefreiende Berufsgeheimnisschutz wegen eingesetzter Unterauftragnehmer **nicht** gewährleistet werden — dort besteht ggf. strafrechtliches Risiko nach § 203 StGB.\n\n**Nicht verwechseln:** Die E-Mail-Ausnahme betrifft **nicht** AI Hosting / KI-Anwendungen. Für KI mit Berufsgeheimnis: grundsätzlich **Ja** — nicht „bei uns nicht vorgesehen“.\n\nDie konkrete rechtliche Einordnung des Anwendungsfalls bleibt beim Kunden. Bei Detailfragen: **Vertrieb +49 5772 293 150** oder https://www.mittwald.de/darum-mittwald/vertrieb",
  },
  {
    id: 58,
    section: "DSGVO",
    question: "Kann ich KI-Anwendungen mit Berufsgeheimnis (§ 203 StGB) bei mittwald betreiben?",
    answer: "**Ja** — du kannst **KI-Anwendungen**, die Daten im Kontext von **§ 203 StGB** (Berufsgeheimnis) verarbeiten, über **AI Hosting** bei mittwald betreiben.\n\n**Voraussetzungen / Rahmen:**\n\n- **AVV** mit mittwald (bei personenbezogenen Daten)\n- Modelle in **Deutschland**, kein Datentransfer in Drittstaaten über AI Hosting\n- Auf Anfrage: **Vereinbarung zur Schweigepflicht nach § 203 StGB** für mitwirkende Personen bei mittwald\n\n**Was nicht gilt:** Diese Schweigepflichtvereinbarung ist **nicht** für **E-Mail-Umzug** und **E-Mail-Archivierung** — das ist ein anderes Produkt, nicht AI Hosting.\n\n**Falsch wäre:** „§203-Anwendungen sind bei mittwald nicht vorgesehen“ — das trifft auf AI Hosting **nicht** zu.\n\nDie **rechtliche Bewertung** deines konkreten Use Cases (welche Daten, welcher Zweck, Dokumentation) liegt bei dir bzw. deiner Kanzlei/Praxis. Bei Unsicherheit: Vertrieb **+49 5772 293 150**.",
  },
  {
    id: 39,
    section: "Integration",
    question: "Wie starte ich technisch — API-Key, Base-URL, erstes curl-Beispiel?",
    answer: "Du benötigst einen mStudio-Zugang, eine Organisation und einen aktiven AI-Hosting-Tarif. Danach kannst du im mStudio einen API-Key erstellen.\n\nDie Base-URL lautet:\n\nhttps://llm.aihosting.mittwald.de/v1\n\nEin erstes curl-Beispiel:\n\nexport APIKEY=sk-…\n\ncurl -i -X POST https://llm.aihosting.mittwald.de/v1/chat/completions \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Authorization: Bearer $APIKEY\" \\\n  -d '{\n    \"model\": \"Ministral-3-14B-Instruct-2512\",\n    \"messages\": [\n      {\n        \"role\": \"user\",\n        \"content\": \"Moin und hallo!\"\n      }\n    ]\n  }'",
  },
  {
    id: 40,
    section: "Integration",
    question: "Funktioniert AI Hosting mit dem OpenAI-SDK?",
    answer: "Ja.\n\nAI Hosting stellt eine **OpenAI-kompatible API** bereit. OpenAI-kompatible SDKs und Libraries können in der Regel weiterverwendet werden, indem du die Base-URL und den API-Key anpasst.\n\nBase-URL:\n\nhttps://llm.aihosting.mittwald.de/v1",
  },
  {
    id: 41,
    section: "Integration",
    question: "Lässt sich AI Hosting in TYPO3, WordPress oder Shopware einbinden?",
    answer: "Ja.\n\nAI Hosting kann grundsätzlich in jedes System eingebunden werden, das HTTP-Requests an eine API senden kann. Dazu gehören TYPO3, WordPress, Shopware und eigene Anwendungen.\n\nTypische Einsatzfälle sind:\n\n- Chatbots\n- automatische Texte\n- Bildbeschreibungen und ALT-Texte\n- RAG-Systeme\n- interne Assistenten\n- Produktdaten- oder Content-Automatisierung",
  },
  {
    id: 42,
    section: "Integration",
    question: "Kann ich AI Hosting mit n8n, Open WebUI oder eigenen Containern kombinieren?",
    answer: "Ja.\n\nDu kombinierst **Container Hosting** (für deine Anwendung) mit **AI Hosting** (für die Modell-API). Es gibt keine generelle „One-Click-Verknüpfung“ für beliebige eigene Apps — aber bei **Container-Vorlagen** im mStudio werden **AI-Hosting-Zugangsdaten automatisch eingetragen** und die Anbindung ist **vorkonfiguriert**.\n\nDas funktioniert u. a. für:\n\n- **n8n** (Workflows & Automatisierung)\n- **Open WebUI** (Chat-Oberfläche)\n- **Qdrant** und andere **Vector-Datenbanken** (RAG)\n- weitere vorkonfigurierte Vorlagen im Container Hosting\n\n**Basis:** Container Hosting läuft auf einem **vServer** oder **Dedicated Server** — beides separat zum AI-Hosting-Tarif buchen.\n\nFür **eigene Container** oder Individual-Apps trägst du Base-URL (`https://llm.aihosting.mittwald.de/v1`) und API-Key selbst ein — OpenAI-kompatible Integration.\n\nWeitere typische Kombinationen:\n\n- eigene Backends oder Middleware\n- MCP-Server für Agenten-Workflows",
  },
  {
    id: 43,
    section: "Integration",
    question: "Brauchen wir zusätzlich vServer oder Container Hosting, oder reicht AI Hosting allein?",
    answer: "Für reine API-Nutzung reicht AI Hosting allein.\n\nZusätzliche Infrastruktur brauchst du, wenn du selbst eine Anwendung betreiben möchtest, zum Beispiel:\n\n- Chat-Frontend\n- SaaS-Plattform\n- RAG-Wissensdatenbank\n- Vector-Datenbank\n- eigene API oder Middleware\n- n8n, Open WebUI oder MCP-Server\n\nFür solche Fälle bietet sich **Container Hosting** an. **Tipp:** Über **Container-Vorlagen** (z. B. n8n, Open WebUI) sind AI-Hosting-Credentials und API-Anbindung oft schon vorkonfiguriert — schneller Start als bei einem komplett eigenen Setup.",
  },
  {
    id: 44,
    section: "Integration",
    question: "Wie messe ich Token-Verbrauch pro Projekt oder pro Kunde?",
    answer: "AI Hosting erfasst für Requests technische Meta-Daten wie API-Key, Zeitpunkt und Tokenanzahl.\n\nFür eine projekt- oder kundenspezifische Auswertung empfiehlt es sich, getrennte API-Keys pro Projekt, Kunde oder Anwendung zu verwenden.\n\nSo lassen sich Verbräuche besser zuordnen und intern abrechnen.",
  },
  {
    id: 45,
    section: "Integration",
    question: "Was passiert bei API-Ausfall — gibt es SLA oder Statusseite?",
    answer: "Bei Störungen sollte zunächst die mittwald Statusseite geprüft werden.\n\nFür produktive Anwendungen empfiehlt sich zusätzlich ein technischer Fallback, zum Beispiel:\n\n- Retry-Logik\n- Queueing\n- Timeout-Handling\n- Wechsel auf ein anderes Modell\n- alternative Verarbeitung bei temporären Fehlern\n\nKonkrete SLA-Aussagen sollten im jeweiligen Vertrag oder Tarif geprüft werden.",
  },
  {
    id: 46,
    section: "Integration",
    question: "Wie skaliere ich von einem internen Demo auf 10 produktive Kundenprojekte?",
    answer: "Ein sinnvoller Weg ist:\n\n1. Mit Starter oder Pro für den ersten PoC starten.\n2. Pro Kunde oder Projekt eigene API-Keys verwenden.\n3. Token-Verbrauch und Rate Limits beobachten.\n4. Bei mehreren produktiven Projekten auf Pro oder Business wechseln.\n5. Für RAG-Systeme Container Hosting und Vector-Datenbank ergänzen.\n6. Bei sehr hoher Last oder speziellen Anforderungen Dedicated AI Hosting prüfen.\n\nSo kannst du klein starten und die Infrastruktur schrittweise mit deinen Kundenprojekten ausbauen.",
  },
  {
    id: 47,
    section: "Agentur",
    question: "Warum sollte unsere Agentur AI Hosting bei mittwald statt OpenAI verkaufen?",
    answer: "AI Hosting von mittwald bietet Agenturen mehrere Vorteile:\n\n- Hosting und Datenverarbeitung vollständig in Deutschland\n- kein Datentransfer zu OpenAI oder anderen Modellherstellern\n- OpenAI-kompatible API für einfache Integration\n- planbare monatliche Tarife statt verbrauchsabhängiger Einzelabrechnung\n- persönlicher deutschsprachiger Support\n- verschiedene Open-Source-Modelle für unterschiedliche Anwendungsfälle\n- Kombination mit Container Hosting, Open WebUI, n8n und weiteren Tools möglich\n\nGerade für datenschutzsensible Kunden oder Unternehmen mit Compliance-Anforderungen kann das ein wichtiges Unterscheidungsmerkmal sein.",
  },
  {
    id: 48,
    section: "Agentur",
    question: "Welche Use Cases lohnen sich wirtschaftlich als Agentur-Dienstleistung?",
    answer: "Besonders wirtschaftlich sind wiederkehrende Lösungen, die sich mehrfach verkaufen lassen.\n\nTypische Beispiele:\n\n- Website-Chatbots\n- interne Wissensdatenbanken (RAG)\n- automatische ALT-Texte und Bildbeschreibungen\n- Content-Generierung\n- Dokumentenanalyse\n- OCR für Rechnungen oder Formulare\n- KI-Agenten für interne Prozesse\n- Workflow-Automatisierung mit n8n\n- individuelle Chat- oder SaaS-Lösungen\n\nViele Agenturen kombinieren dabei Einrichtungsprojekt, monatliches Hosting und laufende Betreuung.",
  },
  {
    id: 49,
    section: "Agentur",
    question: "Wie erkläre ich dem Kunden den Mehrwert „Hosted in Germany“ in einem Satz?",
    answer: "> Deine KI-Anfragen werden ausschließlich auf der Infrastruktur von mittwald in Deutschland verarbeitet – ohne Datentransfer an OpenAI oder andere internationale KI-Anbieter.",
  },
  {
    id: 50,
    section: "Agentur",
    question: "Können wir AI Hosting White-Label oder als Teil unseres Hostings anbieten?",
    answer: "Ja.\n\nViele Agenturen integrieren AI Hosting in ihre eigenen Lösungen und bieten es als Bestandteil ihres Hosting- oder Wartungsvertrags an.\n\nTypische Beispiele:\n\n- eigener Website-Chatbot\n- Kundenportal\n- interne Wissensplattform\n- SaaS-Anwendung\n- individuelle KI-Assistenten\n\nDer Endkunde muss dabei nicht direkt mit der API arbeiten. Die Agentur übernimmt Integration, Betrieb und Support.",
  },
  {
    id: 51,
    section: "Agentur",
    question: "Wer bei uns im Team braucht welches Know-how — Entwickler, PM oder Geschäftsführung?",
    answer: "Die Einführung gelingt am besten, wenn verschiedene Rollen zusammenarbeiten:\n\n**Entwickler**\n\n- API-Integration\n- Prompt Engineering\n- Tool Calling\n- RAG\n- Automatisierung\n- Betrieb\n\n**Projektmanagement**\n\n- Use Cases identifizieren\n- Kunden beraten\n- Anforderungen aufnehmen\n- Projekte koordinieren\n\n**Geschäftsführung**\n\n- Geschäftsmodell entwickeln\n- Preisstrategie festlegen\n- Datenschutz und Compliance bewerten\n- neue Dienstleistungen etablieren\n\nNicht jede Person muss KI-Experte sein – entscheidend ist ein gemeinsames Verständnis der Möglichkeiten und Grenzen.",
  },
  {
    id: 52,
    section: "Agentur",
    question: "Wann lohnt sich ein Beratungsgespräch mit mittwald statt der Selbstauswahl im Tarifkonfigurator?",
    answer: "Der Tarifkonfigurator eignet sich gut für Standardanwendungen oder erste Projekte.\n\nEin persönliches Beratungsgespräch empfiehlt sich insbesondere, wenn:\n\n- der zukünftige Token-Verbrauch schwer abschätzbar ist,\n- mehrere Kundenprojekte geplant sind,\n- spezielle Compliance- oder Datenschutzanforderungen bestehen,\n- Dedicated AI Hosting interessant wird,\n- individuelle Modelle oder besondere Infrastruktur benötigt werden,\n- Fragen zur Architektur oder Skalierung bestehen.\n\nGemeinsam lässt sich dann prüfen, welcher Tarif und welche technische Architektur langfristig am besten zum geplanten Einsatz passen.",
  },
];

export function formatPlaygroundAiHostingTariffFaqContext(options?: { compact?: boolean }): string {
  const compact = options?.compact === true;
  const header = "[Playground — AI Hosting Tarifberatung FAQ (kuratiert)]\n";

  if (!compact) {
    const body = PLAYGROUND_AI_HOSTING_TARIFF_FAQ.map(
      (entry) => `### ${entry.id}. ${entry.question}\n${entry.answer}\n\n`,
    ).join("");
    return header + body;
  }

  const body = PLAYGROUND_AI_HOSTING_TARIFF_FAQ.map((entry) => {
    const answer = entry.answer
      .replace(/\*\*/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const trimmed = answer.length > 420 ? `${answer.slice(0, 419)}…` : answer;
    return `[F${entry.id}] ${entry.question}\n→ ${trimmed}\n`;
  }).join("\n");

  return `${header}(Kompakt — vollständige FAQ im Playground-Code)\n${body}`;
}
