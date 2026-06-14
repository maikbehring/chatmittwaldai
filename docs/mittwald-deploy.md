# mittwald Container Deploy

Diese Anleitung beschreibt, wie du eine **Node.js-Webanwendung** (z. B. Next.js oder Express) auf **mittwald Container Hosting** veröffentlichst — also nicht lokal auf `localhost`, sondern unter einer öffentlichen URL wie `https://meine-app.mittwald.app`.

## Was macht dieser Workflow?

Du hast lokal eine App, die mit `npm run build` und `npm run start` läuft. Für den öffentlichen Betrieb brauchst du drei Dinge:

1. **Ein lauffähiges Paket** — meist ein Docker-Image mit deinem Code, den gebauten Frontend-Dateien und allen Abhängigkeiten.
2. **Eine Laufzeitumgebung** — mittwald startet dieses Image in einem **Container** auf deren Infrastruktur (Server-Projekt im mStudio, nicht klassisches Projekt-Hosting).
3. **Konfiguration & Secrets** — API-Keys, CORS, Modell-Listen usw. kommen in `.env.production`, nicht ins Git.

Der Befehl **`mw experimental deploy`** übernimmt den Großteil davon automatisch:

| Schritt | Was passiert |
|---------|----------------|
| **Build** | Docker baut dein Image lokal (oder per Railpack, falls kein Dockerfile). |
| **Push** | Das Image landet in der **Container-Registry** deines mStudio-Projekts. |
| **Start** | mittwald startet den Container mit deinen Umgebungsvariablen. |
| **URL** | Die App ist erreichbar unter `https://<uri-prefix>.mittwald.app`. |

Du musst also **keinen eigenen Server** verwalten, kein nginx manuell konfigurieren und kein separates Hosting-Paket für PHP/Node-Apps buchen — Container Hosting + CLI reichen.

## Für wen ist das gedacht?

| Zielgruppe | Nutzen |
|------------|--------|
| **Entwickler** | App aus dem Repo in wenigen Minuten online stellen, Updates per erneutem Deploy. |
| **Demo / Beta** | Öffentliche Test-URL für Stakeholder (z. B. KI-Playground mit mittwald AI Hosting im Hintergrund). |
| **CI/CD** | Gleicher Ablauf automatisierbar mit `MITTWALD_API_TOKEN` in GitHub Actions. |

## Was ist *nicht* Teil dieses Deploys?

- **AI Hosting selbst** wird hier nicht „deployt“ — du nutzt nur den **API-Key** aus dem mStudio (`MITTWALD_AI_API_KEY`). Die Modelle laufen auf mittwalds KI-Infrastruktur; dein Container ist nur der Proxy + Frontend.
- **Datenbanken / Uploads** sind im Container standardmäßig **flüchtig** — nach jedem Redeploy weg, außer du mountest ein persistentes Volume (siehe Abschnitt „Persistente Daten“).
- **Rechtliches** (Impressum, Datenschutz) musst du selbst verlinken — z. B. per `PLAYGROUND_LINK_*` in `.env.production`.

## Typischer Ablauf in Kurzform

```
Lokales Projekt
    → Dockerfile + .env.production anlegen
    → mw login / API-Token setzen
    → mw experimental deploy --project-id … --env-file .env.production --uri-prefix …
    → Port-Mapping 80→3000 im mStudio prüfen
    → https://<prefix>.mittwald.app
```

## Bezug zu diesem Repository

Der **Mittwald KI-Playground** ist eine **Express-App mit Vite-Frontend** (kein Next.js). Prinzip bleibt gleich: `npm run build` erzeugt `client/dist`, `npm run start` startet den Server. Für den Deploy brauchst du ein angepasstes `Dockerfile` (siehe Abschnitt „Andere Frameworks“) und in `.env.production` mindestens `MITTWALD_AI_API_KEY`, `CORS_ORIGIN` und `TRUST_PROXY=1`.

---

> Quelle: Skill-Dokumentation aus `~/.cursor/skills/mittwald-deploy/`
>
> Offizielle CLI-Referenz: [mw experimental](https://developer.mittwald.de/de/docs/v2/cli/reference/experimental/)

Bewährter Workflow aus produktivem Next.js-Deploy auf mittwald Container-Infrastruktur — übertragbar auf Express, Vite und andere Node-Stacks.

---

## Voraussetzungen

| Tool | Mindestversion | Installation |
|------|----------------|--------------|
| `@mittwald/cli` | **1.17.2+** | `npm install -g @mittwald/cli` oder `brew install mittwald/tap/mw` |
| Docker (lokal) | – | Für Build via Dockerfile |
| API Token | – | mStudio → **Benutzer → API Tokens** |

**Railpack** ist optional. Mit eigenem `Dockerfile` (empfohlen) wird Railpack umgangen.

**Nicht verwechseln:** **Railpack** (mittwald Build-Tool) ≠ **Railway** (andere Plattform).

---

## Preflight (immer vor Deploy)

Führe diese Checks aus und behebe Fehler, bevor du deployst:

```bash
mw --version                    # >= 1.17.2
export MITTWALD_API_TOKEN="…"   # empfohlen statt interaktivem Login
mw login status                 # muss User anzeigen

mw project list                 # Projekt-ID notieren (z. B. p-abc123)
mw registry list --project-id <PROJECT_ID>
# Erwartet: registry.p-….project.space (valid)
```

| Fehlermeldung | Wahrscheinliche Ursache | Fix |
|---------------|-------------------------|-----|
| `Registry service not found` | Nicht eingeloggt | `MITTWALD_API_TOKEN` setzen, `mw login status` |
| `registry credentials are invalid` | Registry fehlt/kaputt | mStudio → **Container → Registry** anlegen |
| `command login:token:… not found` | CLI zu alt | Upgrade auf ≥ 1.17.2 |
| `does not support linux/amd64` | ARM-Mac-Build | Siehe Abschnitt „Apple Silicon“ |
| `railpack not found` | Kein Railpack, kein Dockerfile | `Dockerfile` anlegen (siehe unten) |

---

## Projekt-Konfiguration

### 1. `.env.production` (gitignored)

Secrets **nur** in dieser Datei, **nie** per `--env` in der Shell (Sonderzeichen brechen die Shell).

```bash
NODE_ENV=production
# App-spezifische Secrets, z. B.:
# ADMIN_PASSWORD=…
# DATABASE_URL=…
```

**Nicht setzen:** `PORT` — die CLI injiziert beim Deploy automatisch `PORT=80`. Siehe Abschnitt „Port“.

### 2. `.gitignore`

```
.env
.env.local
.env.production
```

### 3. Next.js: `output: "standalone"`

In `next.config.ts`:

```ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

### 4. `Dockerfile` (empfohlen)

Lege ein `Dockerfile` im Projektroot an. Wichtige Punkte:

- `FROM --platform=linux/amd64` auf **allen** Stages
- Native Module (`better-sqlite3` etc.): `python3 make g++` in deps/builder
- App lauscht auf **Port 3000** als User `node`
- **PORT-Workaround:** CLI setzt `PORT=80`, App darf nicht auf 80 binden

```dockerfile
FROM --platform=linux/amd64 node:22-bookworm-slim AS base

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/data && chown -R node:node /app
USER node
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "-c", "PORT=3000 exec node server.js"]
```

**Andere Frameworks:** Gleiche Prinzipien — `linux/amd64`, non-root User, intern Port 3000, CMD erzwingt `PORT=3000`.

### 5. `.dockerignore`

```
node_modules
.next
.git
data
.env
.env.*
!.env.production
```

---

## Deploy-Befehl

```bash
cd <projekt-root>

export MITTWALD_API_TOKEN="…"

# Pflicht auf Apple Silicon (M1/M2/M3):
export DOCKER_DEFAULT_PLATFORM=linux/amd64

mw experimental deploy \
  --project-id <PROJECT_ID> \
  --env-file .env.production \
  --uri-prefix <prefix> \
  --wait
```

| Flag | Bedeutung |
|------|-----------|
| `--project-id` | z. B. `p-y21qs4` aus `mw project list` |
| `--env-file` | `.env.production` mit Secrets |
| `--uri-prefix` | Subdomain-Prefix → `https://<prefix>.mittwald.app` |
| `--wait` | Wartet bis Status `ready` |

### Nach dem Deploy

```bash
mw project list              # Status: ready
mw project logs <PROJECT_ID> # bei Problemen
```

URL: `https://<uri-prefix>.mittwald.app` — Custom Domain optional im mStudio.

---

## Port (kritisch)

Die mittwald CLI setzt beim Deploy **`PORT=80`** in die Container-Umgebung.

- Next.js/Node als User **`node`** kann Port 80 **nicht** binden.
- **Lösung im Dockerfile:** `CMD ["sh", "-c", "PORT=3000 exec node server.js"]`
- **Im mStudio (Tab Ports):** Mapping **80 → 3000** (extern 80, intern 3000)
- `PORT=80` in den Umgebungsvariablen im mStudio kann nach Deploy gelöscht werden — die App braucht es nicht.

---

## Apple Silicon

Vor jedem Deploy auf Mac (ARM):

```bash
export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

Zusätzlich `FROM --platform=linux/amd64` im Dockerfile. Ohne beides:

```
image reference '…' does not support 'linux/amd64' platform
```

---

## Persistente Daten

Container-Dateisystem ist **ephemeral**. Bei Redeploy gehen lokale Dateien verloren.

Für SQLite, Uploads etc.:

1. Daten unter festem Pfad im Container (z. B. `/app/data`)
2. Im mStudio **persistentes Volume** anlegen
3. Mount auf `/app/data` (oder passenden Pfad)

Ohne Volume: nach jedem Deploy Daten weg.

---

## Agent-Workflow

Wenn deployt werden soll:

1. **Preflight** ausführen (CLI-Version, Login, Registry)
2. Prüfen ob `Dockerfile` + `output: "standalone"` (Next.js) vorhanden — sonst anlegen
3. Prüfen ob `.env.production` existiert (ohne `PORT`) — User nach fehlenden Secrets fragen
4. Auf `darwin`: `DOCKER_DEFAULT_PLATFORM=linux/amd64` setzen
5. `mw experimental deploy` mit `--env-file` und `--wait`
6. Bei Fehler: `mw project logs` + Fehler-Matrix oben
7. Erfolg: Deploy-URL mitteilen, auf Port-Mapping 80→3000 hinweisen falls App nicht erreichbar

**Niemals** Secrets committen oder in Chat-Logs wiederholen.

---

# Referenz & Fehlerbehebung

## CLI installieren / updaten

```bash
# npm (umgeht Homebrew/Xcode-Probleme)
npm install -g @mittwald/cli

# Homebrew (Tap ggf. vertrauen: brew trust mittwald/cli)
brew install mittwald/tap/mw
brew upgrade mw
```

Bei `brew upgrade mw` Fehler *Command Line Tools are too outdated*:

```bash
sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install
```

Oder npm-Installation nutzen.

---

## Authentifizierung

**Empfohlen (CI & Agent):**

```bash
export MITTWALD_API_TOKEN="client-id:secret:scope"
mw login status
```

**Interaktiv (CLI ≥ 1.17.2):**

```bash
mw login token
# Token eingeben wenn gefragt
```

**Nicht** Token direkt als Argument an alte CLI hängen — `mw login token <TOKEN>` scheitert unter 1.11.x.

---

## Registry

```bash
mw registry list --project-id <PROJECT_ID>
```

Erwartete Ausgabe: `registry.p-<id>.project.space` mit `(valid)`.

Anlegen: mStudio → Projekt → **Container → Registry**

---

## Railpack (Alternative zu Dockerfile)

Nur wenn **kein** `Dockerfile` im Projekt:

```bash
railpack --version   # muss im PATH sein
```

Install: https://railpack.io — **nicht** `brew install railway`.

Mit `Dockerfile` im Root wird Railpack übersprungen.

---

## Logs & Status

```bash
mw project list
mw project logs <PROJECT_ID>
```

---

## Häufige Fehler → Ursache

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| App deployed, URL 502/timeout | Port-Mismatch | mStudio Ports: 80→3000; Dockerfile CMD mit `PORT=3000` |
| Build OK, Push fail amd64 | ARM-Mac | `DOCKER_DEFAULT_PLATFORM=linux/amd64` + Dockerfile platform |
| Registry not found | Kein Login | `MITTWALD_API_TOKEN` + `mw login status` |
| credentials invalid | Registry fehlt | Registry im mStudio anlegen |
| Deploy bricht bei Env ab | Sonderzeichen in `--env` | `--env-file .env.production` |
| Daten nach Redeploy weg | Ephemeral FS | Volume auf `/app/data` mounten |

---

## Beispiel `.env.production`

```bash
NODE_ENV=production
ADMIN_PASSWORD=sicheres-passwort
ADMIN_PATH=geheimer-admin-pfad
AIHOSTING_API_KEY=…
```

Kein `PORT=`.

---

## Beispiel Deploy (Copy-Paste-Vorlage)

```bash
export MITTWALD_API_TOKEN="…"
export DOCKER_DEFAULT_PLATFORM=linux/amd64

mw experimental deploy \
  --project-id p-XXXXXXXX \
  --env-file .env.production \
  --uri-prefix meine-app \
  --wait
```

Ergebnis-URL: `https://meine-app.mittwald.app`
