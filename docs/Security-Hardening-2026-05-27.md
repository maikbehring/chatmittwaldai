# Security Hardening – Umsetzung vom 2026-05-27

Diese Datei dokumentiert die umgesetzten Maßnahmen auf Basis des Security-Audits (CSRF/Access Control, CORS, Rate Limiting).

## Ziel der Änderungen

- Missbrauch kostenintensiver Proxy-Endpunkte reduzieren.
- Zugriffsschutz als zusätzliche Schicht einführen.
- Browserbasierte Angriffsfläche in Produktion durch striktere CORS-/Origin-Policy verkleinern.
- Lastspitzen durch ein globales API-Rate-Limit früher dämpfen.

## Umgesetzte Änderungen

### 1) Zugriffsschutz für kostenintensive Endpunkte

Datei: `server/src/index.js`

Geschützte Routen:
- `POST /api/chat/completions`
- `POST /api/audio/transcriptions`
- `POST /api/web/search`

Umsetzung:
- Neue Middleware `requireApiKey`.
- Nutzt optionalen Env-Wert `PLAYGROUND_APP_API_KEY`.
- Wenn `PLAYGROUND_APP_API_KEY` gesetzt ist, muss der Request-Header `x-playground-api-key` mit exakt diesem Wert vorhanden sein.
- Bei fehlendem/falschem Wert antwortet der Server mit `401 unauthorized`.

Hinweis:
- Ohne gesetztes `PLAYGROUND_APP_API_KEY` bleibt das Verhalten kompatibel (keine zusätzliche Header-Pflicht).

### 2) Origin-Check für sensitive POST-Routen

Datei: `server/src/index.js`

Umsetzung:
- Neue Middleware `requireAllowedOrigin`.
- Standardmäßig aktiv über `REQUIRE_ORIGIN_CHECK` (aktiv, solange nicht explizit `0` gesetzt wird).
- Prüft `Origin` gegen die in `CORS_ORIGIN` konfigurierten Origins.
- Bei fehlendem `Origin` wird `403 origin_required` zurückgegeben.
- Bei nicht erlaubtem `Origin` wird `403 origin_forbidden` zurückgegeben.

Hinweis:
- Dieser Check ist als Defense-in-Depth gedacht und ergänzt, aber ersetzt keine Authentifizierung.

### 3) Globales Rate-Limit für alle API-Routen

Dateien:
- `server/src/rateLimit.js`
- `server/src/index.js`

Umsetzung:
- Neues Konfig-Feld `global` in `getRateLimitConfig()`.
- Neue Env-Variable: `RATE_LIMIT_MAX_GLOBAL` (Default: `300` pro `RATE_LIMIT_WINDOW_MS`).
- Neuer Scope-Label: `global` / „API-Anfragen“.
- Globaler Limiter wird über `app.use("/api", globalLimiter)` vor Route-spezifischen Limits registriert.

Wirkung:
- Alle `/api/*`-Requests werden zuerst global begrenzt.
- Bestehende endpoint-spezifische Limits (chat/models/transcribe/webSearch) bleiben unverändert aktiv.

### 4) CORS-Härtung in Produktion

Datei: `server/src/index.js`

Umsetzung:
- Neue Prüfung `hasWildcardOrigin`.
- In `NODE_ENV=production` wird der Start abgebrochen, wenn `CORS_ORIGIN` wildcard-artig ist (`*` oder Einträge mit `*`).

Wirkung:
- Verhindert unsichere Produktionsstarts mit zu breiter CORS-Konfiguration.

## Änderungen an Konfiguration und Doku

### `.env.example`

Ergänzt:
- `PLAYGROUND_APP_API_KEY` (optional, für Header-basierten Zugriffsschutz)
- `RATE_LIMIT_MAX_GLOBAL=300`
- `REQUIRE_ORIGIN_CHECK=1` (als kommentierter Hinweis)

### `README.md`

Ergänzt:
- Neue Konfig-Variablen in der Übersichtstabelle:
  - `PLAYGROUND_APP_API_KEY`
  - `REQUIRE_ORIGIN_CHECK`
  - `RATE_LIMIT_MAX_GLOBAL`
- Abschnitt „Zugriffsschutz für kostenintensive API-Routen“ mit Betriebs-Hinweisen.
- Hinweis auf Produktions-Fehlerfall bei Wildcard-CORS.

## Verifikation

Durchgeführt:
- `npm install`
- `npm run build` (erfolgreich)
- Lint-/Diagnostik-Check auf geänderten Dateien (keine Fehler)

## Bekannte Grenzen / Rest-Risiken

- Header-basierter API-Key ist eine pragmatische Schutzschicht, aber kein vollständiges User-Identity-Modell.
- Bei direkter, nicht-browserbasierter Abuse-Traffic bleibt ohne vollwertige Nutzerauthentifizierung ein Restrisiko.
- Für höhere Sicherheit in öffentlichen Deployments empfohlen:
  - vorgeschaltete Auth (z. B. Reverse-Proxy/JWT/SSO),
  - Monitoring/Alerting auf 401/403/429,
  - regelmäßige Rotation von `PLAYGROUND_APP_API_KEY`.
