#!/usr/bin/env bash
# Deploy Mittwald KI-Playground via mw experimental deploy.
#
# Build-Kontext: siehe .dockerignore — docs/, *.md, Blog-/Anleitungs-HTML und
# scripts/ werden nicht mitgebaut. Das Dockerfile kopiert nur client/ + server/.
#
# Token-Datei anlegen (nicht ins Git — siehe .gitignore):
#   echo 'DEIN_TOKEN_AUS_MSTUDIO' > .mittwald-api-token
#   chmod 600 .mittwald-api-token
#
# Nutzung:
#   ./scripts/deploy-mittwald.sh              # Produktion (bestehenden Service aktualisieren)
#   ./scripts/deploy-mittwald.sh prod
#   ./scripts/deploy-mittwald.sh staging      # parallele Testinstanz, überschreibt Prod nicht
#
# Optional überschreiben:
#   PROJECT_ID=… URI_PREFIX=… SERVICE_NAME=… IMAGE_NAME=… IMAGE_TAG=…
#   ENV_FILE=… MITTWALD_TOKEN_FILE=… APP_BASE_PATH=…
#
# Staging braucht mw CLI >= 1.18 (Flags --service-name / --image-name / --image-tag).
# Bei PATH-Konflikt (alte npm-CLI): brew-mw nutzen oder `npm uninstall -g @mittwald/cli`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TARGET="${1:-prod}"
case "$TARGET" in
  prod|production|staging|stage|help|-h|--help) ;;
  *)
    echo "FEHLER: Unbekanntes Ziel '$TARGET'." >&2
    echo "  Nutzung: $0 [prod|staging]" >&2
    exit 1
    ;;
esac

if [[ "$TARGET" == "help" || "$TARGET" == "-h" || "$TARGET" == "--help" ]]; then
  cat <<'EOF'
Deploy Mittwald KI-Playground via mw experimental deploy.

Nutzung:
  ./scripts/deploy-mittwald.sh              # Produktion
  ./scripts/deploy-mittwald.sh prod
  ./scripts/deploy-mittwald.sh staging      # parallele Testinstanz (überschreibt Prod nicht)

Optional: PROJECT_ID URI_PREFIX SERVICE_NAME IMAGE_NAME IMAGE_TAG ENV_FILE
  MITTWALD_TOKEN_FILE APP_BASE_PATH MW_BIN

Staging setzt u. a.:
  --service-name playground-staging
  --image-name playground-staging --image-tag staging
  --uri-prefix playground-staging
EOF
  exit 0
fi

if [[ "$TARGET" == "stage" ]]; then
  TARGET="staging"
fi
if [[ "$TARGET" == "production" ]]; then
  TARGET="prod"
fi

PROJECT_ID="${PROJECT_ID:-p-nw5ez0}"
TOKEN_FILE="${MITTWALD_TOKEN_FILE:-$ROOT/.mittwald-api-token}"
APP_BASE_PATH="${APP_BASE_PATH:-/ai}"

# mw aus PATH; falls alt (ohne --service-name), Homebrew-Binary nutzen
MW_BIN="${MW_BIN:-mw}"
if ! "$MW_BIN" experimental deploy --help 2>/dev/null | grep -q -- '--service-name'; then
  if [[ -x /opt/homebrew/bin/mw ]] \
    && /opt/homebrew/bin/mw experimental deploy --help 2>/dev/null | grep -q -- '--service-name'; then
    MW_BIN="/opt/homebrew/bin/mw"
  fi
fi

if [[ "$TARGET" == "staging" ]]; then
  URI_PREFIX="${URI_PREFIX:-playground-staging}"
  SERVICE_NAME="${SERVICE_NAME:-playground-staging}"
  IMAGE_NAME="${IMAGE_NAME:-playground-staging}"
  IMAGE_TAG="${IMAGE_TAG:-staging}"
  if [[ -n "${ENV_FILE:-}" ]]; then
    :
  elif [[ -f "$ROOT/.env.staging" ]]; then
    ENV_FILE="$ROOT/.env.staging"
  else
    ENV_FILE="${ENV_FILE:-.env.production}"
  fi
else
  # Prod: Default wie bisher — kein erzwungenes --service-name,
  # damit der bestehende Default-Service weiter aktualisiert wird.
  URI_PREFIX="${URI_PREFIX:-playground}"
  SERVICE_NAME="${SERVICE_NAME:-}"
  IMAGE_NAME="${IMAGE_NAME:-}"
  IMAGE_TAG="${IMAGE_TAG:-}"
  ENV_FILE="${ENV_FILE:-.env.production}"
fi

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "FEHLER: Token-Datei fehlt: $TOKEN_FILE" >&2
  echo "  mStudio → Benutzer → API Tokens → Token kopieren" >&2
  echo "  echo '…' > .mittwald-api-token && chmod 600 .mittwald-api-token" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "FEHLER: Env-Datei fehlt: $ENV_FILE" >&2
  exit 1
fi

# Erste nicht-leere, nicht-kommentierte Zeile
MITTWALD_API_TOKEN="$(grep -v '^\s*#' "$TOKEN_FILE" | grep -v '^\s*$' | head -n 1 | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

if [[ -z "$MITTWALD_API_TOKEN" ]]; then
  echo "FEHLER: Kein Token in $TOKEN_FILE (erste Zeile leer oder nur Kommentar)." >&2
  exit 1
fi

export MITTWALD_API_TOKEN
export DOCKER_DEFAULT_PLATFORM="${DOCKER_DEFAULT_PLATFORM:-linux/amd64}"

MW_VERSION_LINE="$("$MW_BIN" --version 2>/dev/null | head -n1 || echo "unbekannt")"

if [[ "$TARGET" == "staging" ]]; then
  if ! "$MW_BIN" experimental deploy --help 2>/dev/null | grep -q -- '--service-name'; then
    echo "FEHLER: Staging braucht mw mit --service-name (CLI >= ~1.18)." >&2
    echo "  Aktuell ($MW_BIN): $MW_VERSION_LINE" >&2
    echo "  Fix: brew upgrade mw  bzw. npm uninstall -g @mittwald/cli" >&2
    exit 1
  fi
fi

echo "==> Ziel: $TARGET"
echo "==> mw: $MW_BIN ($MW_VERSION_LINE)"
echo "==> Projekt: $PROJECT_ID | Prefix: $URI_PREFIX"
if [[ -n "$SERVICE_NAME" ]]; then
  echo "==> Service: $SERVICE_NAME | Image: ${IMAGE_NAME:-app-image}:${IMAGE_TAG:-latest}"
fi
echo "==> Env: $ENV_FILE | Token: $TOKEN_FILE"

DEPLOY_ARGS=(
  experimental deploy
  --project-id "$PROJECT_ID"
  --env-file "$ENV_FILE"
  --uri-prefix "$URI_PREFIX"
  --wait
)

if [[ -n "$SERVICE_NAME" ]]; then
  DEPLOY_ARGS+=(--service-name "$SERVICE_NAME")
fi
if [[ -n "$IMAGE_NAME" ]]; then
  DEPLOY_ARGS+=(--image-name "$IMAGE_NAME")
fi
if [[ -n "$IMAGE_TAG" ]]; then
  DEPLOY_ARGS+=(--image-tag "$IMAGE_TAG")
fi

"$MW_BIN" "${DEPLOY_ARGS[@]}"

HEALTH_URL="https://${URI_PREFIX}.${PROJECT_ID}.project.space${APP_BASE_PATH}/api/health"
echo "==> Healthcheck: $HEALTH_URL"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$HEALTH_URL" || true

if [[ "$TARGET" == "prod" ]]; then
  echo "    (Custom Domain ggf.: https://playground.mittwald.de${APP_BASE_PATH}/api/health)"
else
  echo "    Staging parallel zu Prod — Prod-Container bleibt unberührt."
  echo "    mStudio → Container: Service „${SERVICE_NAME}\" prüfen / Domain zuweisen."
fi
