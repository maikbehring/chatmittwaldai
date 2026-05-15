# Mittwald KI-Playground (Beta)

Ein **öffentlicher Test-Chat** für [mittwald AI-Hosting](https://www.mittwald.de/mstudio/ai-hosting): mehrere Sprachmodelle ausprobieren, Bilder senden, Spracheingabe nutzen — ohne eigenen API-Key im Browser.

- **OpenAI-kompatible API** von mittwald (`https://llm.aihosting.mittwald.de/v1`)
- **Chatverlauf nur im Browser** (localStorage), nicht auf dem Server
- **API-Key nur serverseitig** — Besucher brauchen keinen eigenen Key

> **Beta:** Funktionen und Modellangebot können sich ändern. Für produktive Kundenumgebungen die Checkliste unten beachten.

Repository: [github.com/maikbehring/chatmittwaldai](https://github.com/maikbehring/chatmittwaldai)

---

## Für wen ist der Playground?

| Zielgruppe | Nutzung |
|------------|---------|
| **Interessierte / Tester** | Lokal oder auf einer gehosteten Instanz chatten — kein Setup außer der URL (wenn jemand die Instanz betreibt). |
| **Entwickler & Admins** | Repo klonen, mit eigenem mittwald API-Key betreiben (lokal oder öffentlich). |
| **mittwald-Kunden** | Eigene Playground-Instanz als Demo für AI-Hosting; Modellliste und Limits per Konfiguration steuern. |

---

## Funktionen (Überblick)

- Chat mit Streaming-Antworten (Markdown, Code)
- Modellauswahl inkl. Modellübersicht und Einstellungen (Temperatur, System-Prompt, …)
- **Bilder** im Chat (Vision-Modelle) mit Lightbox
- **Spracheingabe** (Whisper über mittwald, z. B. `whisper-large-v3-turbo`)
- Geschätzte **Token-Statistik** und **CO₂-Hinweis** pro Antwort (Orientierungswerte, keine Bilanzierung)
- Dark Mode, Tastatur: **Enter** senden, **Shift+Enter** Zeilenumbruch

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

---

## Konfiguration

Alle Variablen sind in [.env.example](./.env.example) dokumentiert. Wichtigste:

| Variable | Beschreibung |
|----------|----------------|
| `MITTWALD_AI_API_KEY` | **Pflicht** — Key aus dem mStudio |
| `PLAYGROUND_ALLOWED_MODELS` | Kommagetrennte Modell-IDs; nur diese erscheinen im UI. Für öffentliche Instanzen **unbedingt** setzen und bewusst kürzen. |
| `PLAYGROUND_BRAND_TITLE` | Anzeigename (optional) |
| `CORS_ORIGIN` | Erlaubte Browser-Origins (z. B. `https://playground.example.com`). In Produktion **nicht** `*`. |
| `RATE_LIMIT_*` | Schutz vor Missbrauch (Chat, Modellliste, Transkription) |
| `PLAYGROUND_MAX_MESSAGES` | Max. Nachrichten pro Request (Standard: 60) |
| `PLAYGROUND_WHISPER_*` | Spracheingabe (Modell, Sprache, max. Audio-Größe) |

**Modell-IDs** müssen exakt zu `GET /v1/models` passen. Im Code sind u. a. Presets für `gpt-oss-120b`, Qwen3.5/3.6, Ministral und Devstral verdrahtet — fehlen sie in `PLAYGROUND_ALLOWED_MODELS`, erscheinen sie nicht im Dropdown.

---

## Öffentlich betreiben (Checkliste)

Wenn der Playground **für alle** erreichbar sein soll (nicht nur lokal):

1. **Allowlist** — `PLAYGROUND_ALLOWED_MODELS` auf die Modelle begrenzen, die ihr anbieten wollt.
2. **CORS** — nur die echte Playground-URL erlauben.
3. **Rate-Limits** — an erwartete Last und Kosten anpassen (`RATE_LIMIT_MAX_CHAT`, Fenster in ms).
4. **TLS** — HTTPS über Reverse-Proxy (nginx, Caddy, …).
5. **Rechtliches** — Datenschutz, Impressum, Nutzungshinweise; UI-Hinweise ersetzen keine AGB. Siehe [Datenschutz AI-Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/access-and-usage/data-protection/).
6. **Logging** — keine Chat-Inhalte in App-Logs schreiben (der Playground speichert keine Chats serverseitig; Infrastruktur-Logs separat prüfen).

---

## Datenschutz & Sicherheit (Kurz)

- Chats liegen **nur im localStorage** des jeweiligen Browsers.
- Der **API-Key** liegt nur in der Server-Umgebung (`.env`), nicht im Frontend.
- Anfragen gehen über euren **Proxy** an mittwald; Inhalte unterliegen auch der [mittwald-Dokumentation](https://developer.mittwald.de/de/docs/v2/platform/aihosting/).
- CO₂- und Token-Werte sind **Schätzungen** zur Orientierung.

---

## API des Proxys (für Integratoren)

| Endpoint | Beschreibung |
|----------|----------------|
| `GET /api/health` | Liveness |
| `GET /api/config` | UI-Konfiguration (Titel, Limits, Whisper, …) |
| `GET /api/models` | Modellliste (gefiltert) |
| `POST /api/chat/completions` | Chat (Streaming); nur erlaubte JSON-Felder |
| `POST /api/audio/transcriptions` | Sprache → Text (Whisper) |

Vision: Bilder nur als `data:image/…` Base64 im Request.

---

## Häufige Probleme

| Symptom | Lösung |
|---------|--------|
| `MITTWALD_AI_API_KEY` fehlt / 401 | Key in `.env` setzen, Server neu starten |
| Keine Modelle im Dropdown | API erreichbar? `PLAYGROUND_ALLOWED_MODELS` prüfen (exakte IDs) |
| `EADDRINUSE` Port 8787 | Alten Prozess beenden: `lsof -nP -iTCP:8787 -sTCP:LISTEN` → `kill <PID>` oder anderen `PORT` in `.env` |
| `Vite: command not found` | Im Projektroot `npm install` ausführen, nicht nur im `client/`-Ordner |
| Mikrofon funktioniert nicht | Browser-Berechtigung; HTTPS in Produktion (localhost ist Ausnahme) |
| CORS-Fehler in Produktion | `CORS_ORIGIN` auf die öffentliche Frontend-URL setzen |

---

## Mitwirken & Fehler melden

Verbesserungen und Pull Requests sind willkommen.

**Bug oder Idee:** [GitHub Issue erstellen](https://github.com/maikbehring/chatmittwaldai/issues/new?template=bug_report.md) — im Playground unter **Bug melden** verlinkt.

---

## Weiterführende Links

- **[AI Hosting buchen & Tarife](https://www.mittwald.de/mstudio/ai-hosting)** — Produktseite (Starter, Pro, Business, …)
- [Entwickler-Dokumentation](https://developer.mittwald.de/de/docs/v2/platform/aihosting/)
- [OpenAI-kompatible API](https://developer.mittwald.de/de/docs/v2/platform/aihosting/api-compatibility/)
- [Datenschutz AI-Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/access-and-usage/data-protection/)

---

## Lizenz

Der Quellcode steht unter der [MIT License](./LICENSE) — Copyright (c) 2026 Maik Behring.

**Community-Projekt:** Dieser Playground ist ein unabhängiges Demo- und Community-Repository, kein offizielles mittwald-Produkt. „Mittwald“, mStudio und zugehörige Marken sind Eigentum der [Mittwald CM Service GmbH & Co. KG](https://www.mittwald.de/).

Die Nutzung von [mittwald AI Hosting](https://www.mittwald.de/mstudio/ai-hosting) (API-Key, Modelle, Tarife) unterliegt den Vertrags- und Nutzungsbedingungen von mittwald. Maintainer: Maik Behring (Produktmanager bei mittwald, in privatem/community-Kontext).
