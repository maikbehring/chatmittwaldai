# Mittwald KI-Playground (Beta)

Ein **öffentlicher Test-Chat** für [mittwald AI-Hosting](https://www.mittwald.de/mstudio/ai-hosting): mehrere Sprachmodelle ausprobieren, Bilder senden, Spracheingabe nutzen — **ohne Login**, wie bei einer Demo-Instanz von ChatGPT.

- **OpenAI-kompatible API** von mittwald (`https://llm.aihosting.mittwald.de/v1`)
- **Chatverlauf nur im Browser** (localStorage), nicht auf dem Server
- **API-Key nur serverseitig** — Besucher brauchen keinen eigenen Key
- **Rate-Limits** schützen vor Missbrauch (konfigurierbar in `.env`)

> **Beta:** Funktionen und Modellangebot können sich ändern. Für öffentliche Test-Instanzen: Modell-Allowlist und Rate-Limits bewusst setzen — siehe [Öffentlich betreiben](#öffentlich-betreiben-öffentlicher-test-ohne-login).

Repository: [github.com/maikbehring/chatmittwaldai](https://github.com/maikbehring/chatmittwaldai)

---

## Für wen ist der Playground?

| Zielgruppe | Nutzung |
|------------|---------|
| **Interessierte / Tester** | URL öffnen und kurz ausprobieren — kein Account, kein eigener API-Key. |
| **Entwickler & Admins** | Repo klonen, mit eigenem mittwald API-Key betreiben (lokal oder auf mittwald Container Hosting). |
| **mittwald-Kunden** | Eigene Playground-Instanz als Demo für AI-Hosting; Modellliste und Limits per Konfiguration steuern. |

---

## Funktionen (Überblick)

- **Mehrere Chats** in der Sidebar (Verlauf pro Thread im Browser, „Neuer Chat“)
- **Use Cases** — vorgefertigte Workflows (Alt-Tags, SEO, LinkedIn, Recherche, OCR, Modellvergleich, …) mit Briefing-Feldern und Spracheingabe
- Chat mit Streaming-Antworten (Markdown, Code, Kopieren-Buttons)
- Modellauswahl inkl. Modellübersicht, **Modellvergleich** und Einstellungen (Temperatur, System-Prompt, …)
- **Websuche** (optional, pro Chat): Globus am Eingabefeld, einmalige Einwilligung — Standard **DuckDuckGo**; optional **Google** via [SerpAPI](https://serpapi.com/) oder Serper
- **Footer-Links** (Impressum, Datenschutz, …) per `.env` konfigurierbar
- **Bilder** im Chat (Vision-Modelle) und **PDF-Rechnungs-OCR** (GLM-OCR + Qwen)
- **Spracheingabe** (Whisper über mittwald, z. B. `whisper-large-v3-turbo`)
- Geschätzte **Token-Statistik** und **CO₂-Hinweis** pro Antwort (Orientierungswerte)
- Dark Mode, mobile UX, Tastatur: **Enter** senden, **Shift+Enter** Zeilenumbruch

---

## AI Hosting bei mittwald (Voraussetzung)

Den Playground selbst betreiben oder lokal testen kannst du nur mit einem **gültigen API-Key** von mittwald AI Hosting. Den Key bekommst du nicht über dieses Repository — du brauchst ein gebuchtes AI-Hosting-Paket:

1. **[AI Hosting buchen](https://www.mittwald.de/mstudio/ai-hosting)** — Tarife ab dem Starter-Paket (DSGVO-konform in Deutschland gehostet, OpenAI-kompatible API, u. a. Qwen, gpt-oss, Devstral, Ministral, Whisper).
2. Im **[mStudio](https://www.mittwald.de/mstudio)** Organisation anlegen und AI Hosting aktivieren.
3. Unter **AI Hosting → API-Keys** einen Key erzeugen und in `.env` als `MITTWALD_AI_API_KEY` eintragen.

Ohne eigenes Hosting kannst du trotzdem eine **öffentliche Playground-Instanz** nutzen, wenn jemand sie für dich hostet — dann brauchst du keinen Key, nur die URL.

Technische Details: [Developer-Dokumentation AI-Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/).

---

## Schnellstart (lokal)

### Voraussetzungen

- **Node.js 18+** ([nodejs.org](https://nodejs.org/))
- **mittwald API-Key** (siehe Abschnitt [AI Hosting bei mittwald](#ai-hosting-bei-mittwald-voraussetzung))

### Installation

```bash
git clone https://github.com/maikbehring/chatmittwaldai.git
cd chatmittwaldai

cp .env.example .env
# In .env: MITTWALD_AI_API_KEY eintragen

npm install
npm run dev
```

| Dienst | URL |
|--------|-----|
| **Oberfläche** | http://localhost:5173 |
| **API-Proxy** | http://localhost:8787 |

Der Vite-Dev-Server leitet `/api` an den Proxy weiter. `PORT` in `.env` gilt für beide.

### Produktion (ein Prozess)

```bash
npm install
npm run build    # erzeugt client/dist
npm run start    # Server + statisches Frontend
```

Standard-Port: **8787** (`PORT` in `.env`). Für öffentliche URLs: Reverse-Proxy mit TLS davor; `TRUST_PROXY=1` setzen, wenn Client-IPs für Rate-Limits wichtig sind.

### Deploy auf mittwald Container Hosting

Für eine öffentliche URL (z. B. `https://playground.mittwald.de/ai`) liegt im Repo ein **`Dockerfile`** — Build und Start in einem Prozess (Express + `client/dist`). Der Playground ist für den Unterpfad **`/ai`** konfiguriert (`VITE_APP_BASE_PATH=/ai/` im Build, `PLAYGROUND_BASE_PATH=/ai` im Server).

**Kurzablauf:**

1. **AI Hosting** + **Container Hosting** (Server-Projekt) im mStudio
2. **Registry** anlegen, **API-Token** für die CLI holen
3. `.env.production` anlegen (Secrets, **kein** `PORT`) — siehe [.env.example](./.env.example)
4. Deploy:

```bash
export MITTWALD_API_TOKEN="…"
export DOCKER_DEFAULT_PLATFORM=linux/amd64   # Pflicht auf Apple Silicon

mw experimental deploy \
  --project-id <PROJECT_ID> \
  --env-file .env.production \
  --uri-prefix ki-playground \
  --wait
```

5. Im mStudio **Ports: 80 → 3000** (intern lauscht die App auf 3000)
6. `CORS_ORIGIN` = exakte HTTPS-URL(s) der Instanz
7. Healthcheck: `https://<prefix>.mittwald.app/api/health`

Ausführliche Anleitung, Fehlerbehebung (502, Origin, Registry): **[docs/mittwald-deploy.md](./docs/mittwald-deploy.md)**

Weitere Doku: [Rechnungs-OCR-Ablauf](./docs/rechnung-ocr-ablauf.md) · [Security Hardening](./docs/Security-Hardening-2026-05-27.md)

---

## Konfiguration

Alle Variablen sind in [.env.example](./.env.example) dokumentiert. Wichtigste:

| Variable | Beschreibung |
|----------|----------------|
| `MITTWALD_AI_API_KEY` | **Pflicht** — Key aus dem mStudio (Server → mittwald KI; **nicht** der Zugangsschutz für Besucher) |
| `PLAYGROUND_ALLOWED_MODELS` | Kommagetrennte Modell-IDs; nur diese erscheinen im UI. Für öffentliche Instanzen **unbedingt** setzen und bewusst kürzen. |
| `PLAYGROUND_BRAND_TITLE` | Anzeigename (optional) |
| `PLAYGROUND_LINK_*_URL` / `*_LABEL` | Footer- & Sidebar-Links (Impressum, Datenschutz, …) — siehe [Footer- & Rechts-Links](#footer--rechts-links-per-env) |
| `CORS_ORIGIN` | Erlaubte Browser-Origins (z. B. `https://ki-playground.mittwald.app`). In Produktion **nicht** `*`; `http` und `https` getrennt eintragen wenn nötig. |
| `TRUST_PROXY` | `1` hinter nginx/Reverse-Proxy (Rate-Limits, Origin-Check) |
| `PLAYGROUND_APP_API_KEY` | Optional — nur für **interne** Instanzen; für öffentliche Demos **ohne Login** in der Regel **nicht** setzen |
| `REQUIRE_ORIGIN_CHECK` | Standard `1`: erzwingt Origin-Check auf kostenintensiven POST-Routen (mit `0` deaktivierbar) |
| `RATE_LIMIT_*` | Schutz vor Missbrauch (global, Chat, Modellliste, Transkription, Websuche) |
| `PLAYGROUND_MAX_MESSAGES` | Max. Nachrichten pro Request (Standard: 60) |
| `PLAYGROUND_WHISPER_*` | Spracheingabe (Modell, Sprache, max. Audio-Größe) |
| `WEB_SEARCH_PROVIDER` | `duckduckgo` (Standard), `serpapi` (Google) oder `serper` (Google) |
| `WEB_SEARCH_SERPAPI_API_KEY` | Bei `serpapi` — Key aus dem [SerpAPI Dashboard](https://serpapi.com/dashboard) |
| `WEB_SEARCH_SERPER_API_KEY` | Bei `serper` — Key von [serper.dev](https://serper.dev/) |
| `WEB_SEARCH_GOOGLE_GL` / `HL` / `LOCATION` | Optional Region/Sprache für Google (z. B. `de`, `Germany`) |
| `WEB_SEARCH_MAX_RESULTS` | Treffer pro Anfrage (Standard: 5) |
| `WEB_SEARCH_QUERY_MODEL` | Optional: mittwald-Modell-ID für Kurz-Google-Query aus Chat-Auszug (sonst erstes `PLAYGROUND_ALLOWED_MODELS`; kostet 1 zusätzliche LLM-Anfrage pro Websuche) |
| `RATE_LIMIT_MAX_WEB_SEARCH` | Rate-Limit für `POST /api/web/search` (Standard: 30 pro Fenster) |
| `RATE_LIMIT_MAX_GLOBAL` | Globales Rate-Limit für alle `/api/*`-Routen (Standard: 300 pro Fenster) |

### Zugriffsschutz für kostenintensive API-Routen

Für einen **öffentlichen Test ohne Login** (ChatGPT-ähnlich) reichen **Rate-Limits** und **Modell-Allowlist** — `PLAYGROUND_APP_API_KEY` ist dafür **nicht** nötig.

Optional (z. B. interne Instanzen): `PLAYGROUND_APP_API_KEY` setzen; dann muss der Client den Header `x-playground-api-key` mitschicken (`401` bei Fehlen).

Zusätzlich erzwingt der Server standardmäßig einen `Origin`-Check für Chat-, Transkriptions- und Websuche-Routen (`REQUIRE_ORIGIN_CHECK=1`). Hinter einem Reverse-Proxy mit `TRUST_PROXY=1` gilt auch der Host-Match der Request-URL.

Wichtig für Produktion:

- Verwende eine explizite CORS-Allowlist via `CORS_ORIGIN`.
- Starte nicht mit Wildcard-CORS (`*`) in `NODE_ENV=production` — der Server beendet sich in diesem Fall absichtlich mit Fehler.

### Websuche (Betrieb & UI)

**Anbieter (Server, `.env`):**

| Modus | Konfiguration | Hinweis |
|-------|----------------|---------|
| DuckDuckGo | Standard, kein Key | Kostenlos; kann bei hoher Last blockieren |
| Google (SerpAPI) | `WEB_SEARCH_PROVIDER=serpapi` + `WEB_SEARCH_SERPAPI_API_KEY` | Empfohlen für stabile Google-Ergebnisse ([Dashboard](https://serpapi.com/dashboard)) |
| Google (Serper) | `WEB_SEARCH_PROVIDER=serper` + `WEB_SEARCH_SERPER_API_KEY` | Alternative zu SerpAPI |

Optional: `WEB_SEARCH_GOOGLE_GL`, `WEB_SEARCH_GOOGLE_HL`, `WEB_SEARCH_GOOGLE_LOCATION` für deutschsprachige Treffer.

**Bedienung im UI (analog früherer ChatGPT-Websuche):**

1. **Globus** neben dem Eingabefeld antippen → Websuche für diesen Chat **an** (blau) / erneut antippen → **aus**.
2. Beim **ersten Aktivieren** erscheint ein **Einwilligungs-Dialog** (einmal pro Browser gespeichert): Hinweis, dass Suchanfragen an den konfigurierten Anbieter gehen und dort verarbeitet werden können.
3. Ist der Modus aktiv, erscheint ein **Chip** über dem Feld (*„Im Web suchen · …“*) mit **×** zum Deaktivieren.
4. Beim Senden einer **Textnachricht** mit aktiver Websuche: der Server bildet aus **aktueller Nachricht plus Chat-Verlauf** eine **kurze Google-Suchzeile** (über dieselbe mittwald-KI), ruft dann `POST /api/web/search` auf und streamt anschließend den Chat mit den Treffern (**heute** Europe/Berlin im Kontext).
5. In den **Modell-Einstellungen** (Zahnrad): optional „Neue Chats starten mit aktivierter Websuche“.

Suchtreffer werden **nicht** serverseitig dauerhaft gespeichert; der Chatverlauf bleibt im Browser.

### Footer- & Rechts-Links (per `.env`)

Für **öffentliche Instanzen** solltest du eigene Seiten für Impressum und Datenschutz verlinken. Pro Link gibt es eine **URL**- und optional eine **LABEL**-Variable in `.env`; der Server liefert die Liste über `GET /api/config` → Feld `links`.

**Verhalten:**

- Nur Links mit gesetzter `*_URL` erscheinen im UI (Sidebar unten, Fußzeile, Glossar in den Modell-Einstellungen).
- Fehlt `*_LABEL`, wird die Standard-Beschriftung aus der Tabelle unten genutzt.
- **Bug melden:** Ohne `PLAYGROUND_LINK_BUG_URL` wird automatisch der GitHub-Issue-Link dieses Repos eingetragen (einziger Link, wenn sonst nichts konfiguriert ist).

**Beispiel `.env`:**

```env
PLAYGROUND_LINK_IMPRESSUM_URL=https://example.com/impressum
PLAYGROUND_LINK_IMPRESSUM_LABEL=Impressum

PLAYGROUND_LINK_PRIVACY_URL=https://example.com/datenschutz
PLAYGROUND_LINK_PRIVACY_LABEL=Datenschutz

PLAYGROUND_LINK_TERMS_URL=https://example.com/nutzungsbedingungen
PLAYGROUND_LINK_TERMS_LABEL=Nutzungsbedingungen

PLAYGROUND_LINK_AI_HOSTING_URL=https://www.mittwald.de/mstudio/ai-hosting
PLAYGROUND_LINK_AI_HOSTING_LABEL=AI Hosting

PLAYGROUND_LINK_DOCS_URL=https://developer.mittwald.de/de/docs/v2/platform/aihosting/
PLAYGROUND_LINK_DOCS_LABEL=Developer-Dokumentation

# Optional — sonst Standard-Link zum GitHub-Repo
# PLAYGROUND_LINK_BUG_URL=https://github.com/org/repo/issues/new
# PLAYGROUND_LINK_BUG_LABEL=Bug melden
```

| Link | URL-Variable | Label-Variable (optional) | Standard-Label |
|------|----------------|---------------------------|----------------|
| Impressum | `PLAYGROUND_LINK_IMPRESSUM_URL` | `PLAYGROUND_LINK_IMPRESSUM_LABEL` | Impressum |
| Datenschutz | `PLAYGROUND_LINK_PRIVACY_URL` | `PLAYGROUND_LINK_PRIVACY_LABEL` | Datenschutz |
| Nutzungsbedingungen | `PLAYGROUND_LINK_TERMS_URL` | `PLAYGROUND_LINK_TERMS_LABEL` | Nutzungsbedingungen |
| AI Hosting (Produkt) | `PLAYGROUND_LINK_AI_HOSTING_URL` | `PLAYGROUND_LINK_AI_HOSTING_LABEL` | AI Hosting |
| Entwickler-Doku | `PLAYGROUND_LINK_DOCS_URL` | `PLAYGROUND_LINK_DOCS_LABEL` | Dokumentation |
| Bug / Feedback | `PLAYGROUND_LINK_BUG_URL` | `PLAYGROUND_LINK_BUG_LABEL` | Bug melden |

Alle Variablen sind auch auskommentiert in [.env.example](./.env.example) aufgeführt. Die Links öffnen in einem neuen Tab (`target="_blank"`). Sie ersetzen **keine** rechtliche Prüfung — Inhalte der verlinkten Seiten liegen bei dir.

**Modell-IDs** müssen exakt zu `GET /v1/models` passen. Im Code sind u. a. Presets für `gpt-oss-120b`, Qwen3.5/3.6, Ministral und Devstral verdrahtet — fehlen sie in `PLAYGROUND_ALLOWED_MODELS`, erscheinen sie nicht im Dropdown.

---

## Öffentlich betreiben (öffentlicher Test ohne Login)

Wenn der Playground **für alle** erreichbar sein soll — wie eine Demo zum Ausprobieren:

1. **Rate-Limits** — niedrig halten (z. B. `RATE_LIMIT_MAX_CHAT=5` pro 15 Minuten); das ist der Hauptschutz, kein Login nötig.
2. **Allowlist** — `PLAYGROUND_ALLOWED_MODELS` auf Demo-taugliche Modelle begrenzen.
3. **CORS** — `CORS_ORIGIN` auf die echte HTTPS-URL setzen (`TRUST_PROXY=1` am Proxy).
4. **Deploy** — mittwald Container Hosting mit `Dockerfile` und `.env.production` (Secrets **nicht** ins Image); siehe [Deploy auf mittwald](#deploy-auf-mittwald-container-hosting).
5. **Port-Mapping** — im mStudio **80 → 3000**; kein `PORT` in `.env.production`.
6. **Rechtliches** — Impressum/Datenschutz verlinken (`PLAYGROUND_LINK_*`); UI-Hinweis „Test-Playground“ bleibt sichtbar.
7. **Kosten** — Verbrauch im mStudio AI Hosting beobachten; bei Bedarf Limits weiter senken.
8. **Logging** — keine Chat-Inhalte in App-Logs; API-Keys nie committen oder in Issues posten.

`PLAYGROUND_APP_API_KEY` ist für **interne** Zugänge gedacht, nicht für öffentliche Schnupper-Demos.

---

## Datenschutz & Sicherheit (Kurz)

- Chats liegen **nur im localStorage** des jeweiligen Browsers (inkl. mehrerer Threads, Websuche pro Chat, Websuche-Einwilligung).
- Der **API-Key** (mittwald, ggf. SerpAPI/Serper) liegt nur in der Server-Umgebung (`.env`), nicht im Frontend.
- Anfragen gehen über euren **Proxy** an mittwald; Inhalte unterliegen auch der [mittwald-Dokumentation](https://developer.mittwald.de/de/docs/v2/platform/aihosting/).
- Bei aktivierter **Websuche**: Kurz-Anfragen an Google (SerpAPI/Serper) bzw. Abfragen an DuckDuckGo; der **rohe Chat-Verlauf** wird serverseitig nur verdichtet, nicht 1:1 an den Suchdienst geschickt. Es gelten die Nutzungsbedingungen des jeweiligen Anbieters.
- Die **Einwilligung zur Websuche** wird nur lokal im Browser gespeichert; **zurückziehen** unter Modell-Einstellungen (Zahnrad) → Websuche → „Einwilligung zurückziehen“. Ersetzt keine Datenschutzerklärung — für öffentliche Instanzen eigene Seiten verlinken (`PLAYGROUND_LINK_*`).
- CO₂- und Token-Werte sind **Schätzungen** zur Orientierung.
- Was beim Betrieb **noch fehlen** kann (rechtlich-organisatorisch, Infrastruktur, optionale App-Ergänzungen): [docs/Datenschutz-und-Betrieb-offene-Massnahmen.md](./docs/Datenschutz-und-Betrieb-offene-Massnahmen.md).

---

## API des Proxys (für Integratoren)

| Endpoint | Beschreibung |
|----------|----------------|
| `GET /api/health` | Liveness |
| `GET /api/config` | UI-Konfiguration (Titel, Limits, Whisper, Websuche, Footer-Links, …) |
| `GET /api/models` | Modellliste (gefiltert) |
| `POST /api/chat/completions` | Chat (Streaming); nur erlaubte JSON-Felder |
| `POST /api/audio/transcriptions` | Sprache → Text (Whisper) |
| `POST /api/web/search` | Websuche — Body z. B. `{ "userMessage": "…", "chatExcerpt": "…", "maxResults": 10 }`; optional Legacy `{ "q": "…" }` ohne Verdichtung |

Vision: Bilder nur als `data:image/…` Base64 im Request.

---

## Häufige Probleme

| Symptom | Lösung |
|---------|--------|
| `MITTWALD_AI_API_KEY` fehlt / 401 | Key in `.env` / `.env.production` setzen, neu deployen |
| **502 Bad Gateway** (mittwald) | Port-Mapping im mStudio: **80 → 3000**; kein `PORT=8787` in Produktion |
| **Origin ist nicht erlaubt** | `CORS_ORIGIN` = exakte Browser-URL (`https://…`); `TRUST_PROXY=1`; Redeploy |
| Keine Modelle im Dropdown | API erreichbar? `PLAYGROUND_ALLOWED_MODELS` prüfen (exakte IDs) |
| `EADDRINUSE` Port 8787 | Alten Prozess beenden: `lsof -nP -iTCP:8787 -sTCP:LISTEN` → `kill <PID>` |
| `Vite: command not found` | Im Projektroot `npm install` ausführen |
| Docker-Build schlägt fehl | `Dockerfile` im Root; auf Mac: `DOCKER_DEFAULT_PLATFORM=linux/amd64` |
| Mikrofon funktioniert nicht | Browser-Berechtigung; HTTPS in Produktion |
| CORS-Fehler in Produktion | `CORS_ORIGIN` auf öffentliche URL; http **und** https wenn beides genutzt wird |
| Websuche liefert keine Treffer | Rate-Limit; SerpAPI-Key und `WEB_SEARCH_PROVIDER` prüfen |
| Websuche lässt sich nicht aktivieren | Einwilligungs-Dialog; localStorage `mittwald-ai-playground-web-search-consent-v1` löschen |

---

## Mitwirken & Fehler melden

Verbesserungen und Pull Requests sind willkommen.

**Bug oder Idee:** [GitHub Issue erstellen](https://github.com/maikbehring/chatmittwaldai/issues/new?template=bug_report.md) — im Playground unter **Bug melden** verlinkt.

---

## Weiterführende Links

- **[AI Hosting buchen & Tarife](https://www.mittwald.de/mstudio/ai-hosting)** — Produktseite (Starter, Pro, Business, …)
- [Entwickler-Dokumentation](https://developer.mittwald.de/de/docs/v2/platform/aihosting/)
- [Container Deploy (CLI)](https://developer.mittwald.de/de/docs/v2/cli/reference/experimental/) — `mw experimental deploy`
- [Deploy-Anleitung im Repo](./docs/mittwald-deploy.md)

---

## Lizenz

Der Quellcode steht unter der [MIT License](./LICENSE) — Copyright (c) 2026 Maik Behring.

**Community-Projekt:** Dieser Playground ist ein unabhängiges Demo- und Community-Repository, kein offizielles mittwald-Produkt. „Mittwald“, mStudio und zugehörige Marken sind Eigentum der [Mittwald CM Service GmbH & Co. KG](https://www.mittwald.de/).

Die Nutzung von [mittwald AI Hosting](https://www.mittwald.de/mstudio/ai-hosting) (API-Key, Modelle, Tarife) unterliegt den Vertrags- und Nutzungsbedingungen von mittwald. Maintainer: Maik Behring (Produktmanager bei mittwald, in privatem/community-Kontext).
