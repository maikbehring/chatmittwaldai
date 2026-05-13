# Mittwald KI-Playground (Beta)

Öffentlicher **Beta**-Test-Chat für [mittwald AI-Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/): OpenAI-kompatible API (`https://llm.aihosting.mittwald.de/v1`), **Chatverlauf nur im Browser** (localStorage), **API-Key nur auf dem Server**.

## Voraussetzungen

- Node.js **18+**
- API-Key aus dem mStudio (Organisation/Projekt → AI-Hosting)

## Lokale Entwicklung

```bash
cd /Users/mbehring/Documents/Cursor/chatjimmy
cp .env.example .env
# MITTWALD_AI_API_KEY in .env eintragen
npm install
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173) (Vite proxy → `/api`)
- API-Proxy: [http://localhost:8787](http://localhost:8787)

## Produktion (ein Prozess)

```bash
npm install
npm run build   # baut client/dist
npm run start   # startet server; liefert client/dist aus, wenn vorhanden
```

Der Server bindet an `PORT` (Standard **8787**). Öffentlich sollte davor ein Reverse-Proxy (TLS, `TRUST_PROXY=1` für korrekte Client-IPs) stehen.

### Häufige Fehler

- **`zsh: command not found: #`** / **`Vite: command not found`**: In der `package.json` darf beim Script `dev` **kein** Text nach `concurrently …` stehen (kein `# Vite …`). Alles nach dem zweiten Anführungszeichen würde von `concurrently` als weitere „Prozesse“ interpretiert. Kommentare zur Nutzung nur in die README, nicht in die npm-Script-Zeile kopieren.
- **`EADDRINUSE` / Port belegt:** Ein alter Playground-Server läuft noch. Beenden mit `lsof -nP -iTCP:8787 -sTCP:LISTEN` und `kill <PID>`, oder in der Root-`.env` einen anderen `PORT` setzen — der Vite-Dev-Proxy liest `PORT` automatisch aus derselben Datei.

### Wichtige Umgebungsvariablen

| Variable | Bedeutung |
|----------|-----------|
| `MITTWALD_AI_API_KEY` | Pflicht |
| `PLAYGROUND_ALLOWED_MODELS` | Kommagetrennt; **für öffentliche Kunden-Tests dringend setzen**. Nur hier gelistete Modelle erscheinen im UI — z. B. `gpt-oss-120b` und `Qwen3.5-…` / `Qwen3.6-…` explizit eintragen, sonst fehlen sie trotz Preset-Unterstützung im Code. |
| `CORS_ORIGIN` | Öffentliche Origin(s), z. B. `https://playground.example.com` |
| `RATE_LIMIT_MAX_CHAT` / `RATE_LIMIT_WINDOW_MS` | Missbrauchsschutz |
| `TRUST_PROXY` | `1`, wenn hinter Proxy und echte IPs in `X-Forwarded-For` |

Details: [.env.example](./.env.example).

## Kunden-Launch Checkliste

1. **Modell-Allowlist** setzen (`PLAYGROUND_ALLOWED_MODELS`).
2. **CORS** auf die echte Playground-URL setzen (nicht `*` in Produktion).
3. **Rate-Limits** an Tarif und erwartete Nutzung anpassen.
4. **Datenschutz / AGB**: Hinweis im UI ist nur Orientierung; rechtliche Texte und ggf. Einwilligung liegen bei euch ([Datenschutz AI-Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/access-and-usage/data-protection/)).
5. **Logging** auf dem Server: keine Request-/Response-Bodies in Application-Logs aktivieren (der Code speichert keine Chats; Infrastruktur-Logs separat prüfen).

## API des Proxys

- `GET /api/health` — Liveness
- `GET /api/config` — Titel u. a. für die UI
- `GET /api/models` — weitergeleitete Modellliste (gefiltert nach Allowlist)
- `POST /api/chat/completions` — Streaming zu mittwald; nur erlaubte JSON-Felder; Vision nur mit `data:image/…` Base64

## Bugs melden

[Fehler oder Verbesserungsvorschläge auf GitHub erstellen](https://github.com/maikbehring/chatmittwaldai/issues/new?template=bug_report.md) — Vorlage: `.github/ISSUE_TEMPLATE/bug_report.md`. Im Playground verlinkt unter **Bug melden** (Fußzeile, Sidebar, Leerzustand, Glossar).

## Lizenz

MIT (anpassen nach Bedarf).
