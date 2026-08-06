# Konzept: Use Case „Open WebUI bei mittwald — Dein ChatGPT auf deutscher Infrastruktur"

> Arbeitsstand: Konzept zur Abstimmung, bevor der Use Case im Playground gebaut wird.

## 1. Ziel & Zielgruppe

**Ziel:** Ein verlinkbarer Use Case im Playground (`playground.mittwald.de/…`), den mittwald-Kunden
und Interessenten öffnen, wenn sie Open WebUI bei mittwald betreiben (wollen). Nach dem Durcharbeiten
haben sie ein Open WebUI, das sich anfühlt wie ChatGPT: richtige Modelle für den richtigen Zweck,
sinnvolle Einstellungen, Websuche und ein kleines RAG-System.

**Zielgruppen (bewusst zwei Ebenen):**

| Persona | Bedürfnis | Konsequenz für den Use Case |
|---|---|---|
| Geschäftsführer / Nicht-Techniker | „Ich will ChatGPT für meine Firma — DSGVO-konform. Was klicke ich?" | mStudio-Klickweg als Hauptpfad, kein CLI-Zwang, Screenshots-artige Schrittlisten, Glossar |
| Agentur-Entwickler / Admin | „Schnell aufsetzen, sauber konfigurieren, für Kunden replizierbar" | CLI/`docker-compose`-Snippets als Alternative je Schritt, ENV-Referenz |

**Erfolgskriterium:** Ein Nutzer ohne technische Vorbildung kann nur mit diesem Use Case
(a) Open WebUI starten, (b) Modelle sinnvoll auswählen, (c) Websuche aktivieren,
(d) eine Wissensdatenbank (RAG) mit eigenen PDFs anlegen — und versteht bei jedem Schritt, *warum*.

## 2. Recherchierte Quellen (verifiziert)

**Offizielle mittwald-Dokumentation (Kern):**

1. [Open WebUI betreiben (Deployment-Guide)](https://developer.mittwald.de/de/docs/v2/guides/apps/openwebui/) — Image `ghcr.io/open-webui/open-webui:main`, mStudio-UI-Weg, `mw container run`, `mw stack deploy`, Volume `/app/backend/data`, ENV-Variablen (`OPENAI_API_BASE_URL`, `OPENAI_API_KEY`, `WEBUI_NAME`, `ENABLE_SIGNUP`), Domain-Zuweisung, Backup. **Wichtig:** Beim Anlegen des AI-Hosting-API-Keys kann Open WebUI automatisch mitinstalliert werden (Managed Deployment) — das ist der einfachste Weg für Nicht-Techniker.
2. [Open WebUI mit mittwald AI Hosting (Beispiel)](https://developer.mittwald.de/de/docs/v2/platform/aihosting/examples/openwebui/) — Admin-Panel-Verbindung, Modell-Parameter („Advanced Params": `top_p`, `top_k`, `temperature` je Modell), **RAG-Konfiguration** (Knowledge, Embedding-Engine „OpenAI", Endpoint, `Qwen3-Embedding-8B`, Batch Size 32, Top K, RAG Template), **Whisper/STT** (`whisper-large-v3-turbo`, Sprache „de", Modell aus Chat-Liste ausblenden).
3. [Verfügbare Modelle](https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/) — Modelltabelle inkl. Typ, Modalitäten, Kontext, Lizenz + offizielle Modellauswahl-Empfehlungen (siehe Abschnitt 4).
4. [Container-Workloads](https://developer.mittwald.de/de/docs/v2/platform/workloads/containers/) — Container erstellen (UI/CLI/Terraform/API), Volumes, interne DNS-Namen zwischen Containern (wichtig für SearXNG!), Domain/Ingress, Update-Zeitplan per Cron.
5. [RAG-Produktseite](https://www.mittwald.de/mstudio/ai-hosting/rag) — Positionierung, Vektordatenbanken (Chroma/Qdrant), AnythingLLM-Template, Tarife (Starter 9 €/Pro 39 €), FAQ.

**Open-WebUI-Dokumentation (für Websuche, ergänzend):**

6. [Web Search Übersicht + Troubleshooting](https://docs.openwebui.com/troubleshooting/web-search) — `ENABLE_WEB_SEARCH`, `WEB_SEARCH_ENGINE`, `WEB_SEARCH_RESULT_COUNT`, `WEB_SEARCH_CONCURRENT_REQUESTS`; Admin-Panel-Einstellungen überschreiben ENV.
7. [SearXNG-Provider](https://docs.openwebui.com/features/chat-conversations/web-search/providers/searxng/) — selbst gehostet (zweiter Container im selben mittwald-Projekt, interne DNS-Namen!), `SEARXNG_QUERY_URL`, JSON-Format in `settings.yml` aktivieren (sonst 403).
8. [Brave-Provider](https://github.com/open-webui/docs/blob/main/docs/features/chat-conversations/web-search/providers/brave.md) — API-Key-basiert, Free Tier 2.000 Suchen/Monat, `WEB_SEARCH_CONCURRENT_REQUESTS=1` gegen 429.

**Noch zu prüfen während der Umsetzung:** mStudio-Container-Template-Katalog (gibt es „Open WebUI"-
und „SearXNG"-Vorlagen mit 1 Klick? Die Container-Hosting-Produktseite listet Open WebUI als Technologie),
AnythingLLM-Template-Details für den RAG-Ausblick.

## 3. Format: Wie wird der Use Case gebaut?

**Empfehlung: Guide-Use-Case im Playground** (Muster: bestehender „AI Hosting Guide"), Gruppe
„Coding/Development" oder eigene Gruppe, mit:

- **Statisches Panel** (wie `GridCarbonForecastPanel`): die komplette Anleitung als strukturierte,
  klickbare Schritt-für-Schritt-Seite — funktioniert ohne Chat-Anfrage, ist verlinkbar und SEO-tauglich.
  Tabs oder Akkordeons je Level: „Einfach (mStudio klicken)" vs. „Profi (CLI/Compose)".
- **Chat darunter** (optional): Modell `Qwen3.5-122B` oder `gpt-oss-120b`, System-Prompt mit dem
  kompletten kuratierten Wissen aus Abschnitt 2 (gleiches Muster wie `GRID_CARBON_SOURCE_KNOWLEDGE`) —
  Nutzer fragen z. B. „Wie binde ich meine PDF-Handbücher ein?" und bekommen quellenbasierte Antworten.
- **Deterministische Kernantworten** für die häufigsten Fragen (Muster: `gridCarbonForecastAdvice.ts`),
  damit „Welches Modell für was?" nie halluziniert wird.

Alternative (weniger Aufwand): reine Markdown-Seite in `docs/` + Link. Nachteil: kein interaktiver
Chat, keine Playground-Verlinkung als Use-Case-Karte. → Empfehlung bleibt Playground-Use-Case.

## 4. Inhaltliche Gliederung des Use Case

### A. „Was bekommst du?" (Nicht-Techniker-Intro, 3 Sätze)
ChatGPT-Gefühl, aber: Daten bleiben in Deutschland, keine Trainingsdaten-Speicherung, eigene
Modelle/Nutzerverwaltung. Ein Bild sagt mehr: Screenshot-Beschreibung des fertigen Open WebUI.

### B. Schnellster Weg (Managed Deployment)
1. AI Hosting buchen (Starter 9 € reicht zum Testen)
2. Im mStudio API-Key anlegen → Haken „Open WebUI mitinstallieren" (Container-fähiger Tarif nötig)
3. **Im selben Dialog Admin-Benutzer setzen** — damit Open WebUI nicht blank/öffentlich mit offener Erst-Registrierung online geht
4. Domain zuweisen und mit dem Admin-Zugang anmelden
→ Fertig in ~10 Minuten, ohne Terminal. Signup-Sperre ist über den Dialog bereits abgedeckt.

### C. Manueller Weg (mStudio-UI Schritt für Schritt + CLI-Alternative)
Container erstellen → Image → Volume `/app/backend/data` → ENV (`OPENAI_API_BASE_URL`,
`OPENAI_API_KEY`, `WEBUI_NAME`, `ENABLE_SIGNUP`) → Port 8080 → Domain verbinden.
CLI-Block (`mw container run` / `mw stack deploy`) einklappbar für Profis.

### D. Welches Modell wofür? (Herzstück für das „ChatGPT-Gefühl")
Tabelle basierend auf der offiziellen Modellauswahl-Doku, übersetzt in Nutzeraufgaben:

| Aufgabe im Alltag | Modell | Warum |
|---|---|---|
| Standard-Chat, Texte, E-Mails (Allrounder wie GPT) | `Qwen3.6-35B-A3B-FP8` | Reasoning + Vision, 256k Kontext, günstig — **Empfehlung als Default-Modell** |
| Komplexe Analysen, Fachtexte, höchste Qualität | `gpt-oss-120b` oder `Qwen3.5-122B` | große Modelle, starkes Reasoning; 122B zusätzlich Vision |
| Bilder verstehen (Screenshots, Fotos, Scans) | `Qwen3.5-122B` / `Ministral-3-14B` | Vision-Modalität |
| Massenaufgaben, Klassifizierung, Routing | `Qwen3.5-0.8B` | schnell + günstig |
| Diktieren statt tippen | `whisper-large-v3-turbo` | STT, 99+ Sprachen — aus Chat-Liste ausblenden! |
| Wissensdatenbank / RAG | `Qwen3-Embedding-8B` | Embedding-Modell (kein Chat) |
| PDF/Scan → Text | `GLM-OCR` | Dokument-OCR |

Plus mittwald-Tipp aus der Doku: mit dem kleinsten ausreichenden Modell starten.
Plus Open-WebUI-Hygiene: Whisper/Embedding/OCR-Modelle per „Hide model" aus der Chat-Auswahl nehmen,
Default-Modell setzen, Advanced Params (`temperature`, `top_p`, `top_k`) je Modell laut Modell-Doku.

### E. Websuche aktivieren (zwei Wege, ehrlich verglichen)
- **Einfach (empfohlen für GF):** Brave Search API — API-Key holen (Free Tier 2.000 Suchen/Monat),
  in Open WebUI Admin → Tools → Web Search: Engine `brave`, Key eintragen,
  `Concurrent Requests = 1`. Kein zweiter Container nötig.
- **Souverän (Profis):** SearXNG als zweiter Container im selben mittwald-Projekt
  (interner DNS-Name, z. B. `http://searxng:8080/search?q=<query>`), JSON-Format in
  `settings.yml` aktivieren. Vorteil: keine externen API-Kosten, alles im eigenen Projekt.
- Hinweis: Einstellungen im Admin-Panel überschreiben ENV-Variablen.
- Nutzung erklären: Globus-Symbol im Chat / Web-Search-Toggle je Modell.

### F. Kleines RAG-System (Wissensdatenbank)
1. **Embedding konfigurieren:** Admin Settings → Documents → Engine „OpenAI" →
   Endpoint `https://llm.aihosting.mittwald.de/v1` → Key → Modell `Qwen3-Embedding-8B` →
   Batch Size 32 (offizielle mittwald-Empfehlung).
2. **Wissen anlegen:** Workspace → Knowledge → „New Knowledge" → PDFs/Docs hochladen.
3. **Nutzen:** Im Chat „Attach knowledge" oder `#wissensname` — Antworten kommen aus den eigenen Dokumenten.
4. **Feintuning:** Top K und RAG-Template unter „Retrieval" — mit konkreten Empfehlungswerten.
5. **Ausblick für Wachstum:** AnythingLLM + Qdrant per mStudio-Container-Template, wenn die
   eingebaute Knowledge-Funktion nicht mehr reicht (Verweis auf RAG-Produktseite; kein Zusatztarif nötig).

### G. Checkliste „Bereit für Kunden/Team"
Admin im AI-Hosting-Dialog gesetzt (Managed) bzw. Signup deaktiviert · Domain + HTTPS · Default-Modell gesetzt · Spezialmodelle ausgeblendet ·
Websuche getestet · Knowledge mit 1 Testdokument geprüft · Backup läuft über Projekt-Backup ·
Update-Zeitplan für `:main`-Tag gesetzt (Cron im mStudio).

### H. FAQ / Troubleshooting (deterministische Antworten)
Modelle erscheinen nicht (Base-URL/Key prüfen) · Websuche liefert nichts (Concurrency 1, Engine-Auswahl) ·
403 bei SearXNG (JSON-Format) · Wo liegen meine Daten? (Volume + Projekt-Backup, RZ Deutschland) ·
Was kostet das? (AI-Hosting-Tarif + Container-Hosting, keine Extra-RAG-Kosten).

## 5. Umsetzungsschritte im Playground

0. ✅ `docs/openwebui-anleitung.html` — eigenständige HTML-Anleitung (GF + Profi, druckbar)
1. `docs/use-case-openwebui.md` — vollständiger Anleitungstext (Basis für Panel + System-Prompt)
2. `client/src/openWebUiGuide.ts` — kuratiertes Quellenwissen + System-Prompt + deterministische Antworten
3. `client/src/OpenWebUiGuidePanel.tsx` — statisches Panel (Stepper, Tabs „Einfach/Profi", Modelltabelle, Checkliste)
4. Use-Case-Eintrag in `playgroundUseCases.ts` (`prefersOpenWebUiGuide`, Gruppe, Karte, Steps)
5. `App.tsx`: Panel einbinden (Muster Strommix/Traceroute), Kontext-Injektion beim Chat
6. Build + lokaler Test, danach Review-Runde mit Fokus „versteht das ein Nicht-Techniker?"

## 6. Offene Punkte (bitte kurz entscheiden)

1. **Gruppe im Playground:** Neue Karte unter „Coding" — oder eigene Gruppe „Selbst hosten"?
2. **Websuche-Empfehlung:** Brave als Default-Empfehlung okay (externer US-Anbieter, aber einfachster Weg)
   — oder SearXNG als Hauptweg, obwohl technischer?
3. **Scope Chat:** Reicht das Panel + FAQ, oder soll der Chat (wie beim Tarifberater) aktiv beworben werden?
4. **Verifikation:** Soll ich beim Bauen ein echtes Open WebUI in einem eurer mStudio-Projekte hochziehen,
   um jeden Schritt und jede Einstellung zu verifizieren? Wenn ja: in welchem Projekt?
