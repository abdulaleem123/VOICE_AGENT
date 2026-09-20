#!/usr/bin/env bash
# =============================================================================
# Voice Agent  production start (Next.js)
# Builds (unless SKIP_BUILD=1) and starts the server on PORT (default 4000).
# Usage:  bash scripts/prod-start.sh
#         SKIP_BUILD=1 bash scripts/prod-start.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing  run bash scripts/prod-setup.sh first"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

export NODE_ENV=production
PORT="${PORT:-4000}"
HOST="${HOST:-0.0.0.0}"
APP_URL="${APP_URL:-http://localhost:${PORT}}"

mkdir -p logs

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Building Next.js (production)"
  npm run build
fi

echo "==> Starting Voice Agent on ${HOST}:${PORT}"
echo "    APP_URL=${APP_URL}"
echo "    Multi-tenant: pick industry at /tenants after login"
echo "    Logs: logs/next-prod.log"

# Prefer next start with explicit host/port for VPS / Docker
exec npx next start -p "$PORT" -H "$HOST" 2>&1 | tee -a logs/next-prod.log
