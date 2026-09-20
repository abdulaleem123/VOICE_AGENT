#!/usr/bin/env bash
# =============================================================================
# Voice Agent  one-shot production deploy helper
# Setup → build → start Next in background; optionally start desktop worker.
# Usage:  bash scripts/prod-deploy.sh
#         WITH_DESKTOP=1 TENANT_SLUG=restaurant bash scripts/prod-deploy.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/prod-setup.sh

export NODE_ENV=production
# shellcheck disable=SC1091
set -a
source .env
set +a

PORT="${PORT:-4000}"
HOST="${HOST:-0.0.0.0}"
mkdir -p logs

echo "==> Building Next.js"
npm run build

echo "==> Starting Next.js in background (pid → logs/next.pid)"
nohup npx next start -p "$PORT" -H "$HOST" >>logs/next-prod.log 2>&1 &
echo $! > logs/next.pid
echo "    PID $(cat logs/next.pid)  →  http://${HOST}:${PORT}"

if [[ "${WITH_DESKTOP:-0}" == "1" ]]; then
  echo "==> Starting desktop worker in background"
  nohup bash scripts/prod-desktop.sh >>logs/desktop-worker.log 2>&1 &
  echo $! > logs/desktop.pid
  echo "    Desktop PID $(cat logs/desktop.pid)"
fi

echo "==> Deploy live"
echo "    Login: ${APP_URL:-http://localhost:${PORT}}/login"
echo "    Tenants: /tenants"
echo "    Stop: kill \$(cat logs/next.pid)"
