#!/usr/bin/env bash
# =============================================================================
# Voice Agent  production setup
# Run once on a fresh server (or after pulling updates) before going live.
# Usage:  bash scripts/prod-setup.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Voice Agent production setup"
echo "    root: $ROOT"

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    echo "==> Creating .env from .env.example (fill secrets before start)"
    cp .env.example .env
  else
    echo "ERROR: missing .env and .env.example"
    exit 1
  fi
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

missing=()
[[ -z "${OPENAI_API_KEY:-}" || "${OPENAI_API_KEY}" == sk-your-openai* ]] && missing+=("OPENAI_API_KEY")
[[ -z "${JWT_SECRET:-}" || "${JWT_SECRET}" == change-this* ]] && missing+=("JWT_SECRET")
[[ -z "${DATABASE_URL:-}" ]] && missing+=("DATABASE_URL")

if ((${#missing[@]})); then
  echo "ERROR: set these in .env before production: ${missing[*]}"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required (18+ recommended)"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if (( NODE_MAJOR < 18 )); then
  echo "ERROR: Node.js 18+ required (found $(node -v))"
  exit 1
fi

echo "==> Installing npm dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Applying database schema"
npx prisma db push

SEED="${SEED_ON_SETUP:-1}"
if [[ "$SEED" == "1" ]]; then
  echo "==> Seeding users + 5 industry tenants (hospital, restaurant, supermart, estate-agency, software-house)"
  npx tsx prisma/seed.ts
else
  echo "==> Skipping seed (SEED_ON_SETUP=0)"
fi

mkdir -p logs data
echo "==> Setup complete"
echo "    Next: bash scripts/prod-start.sh"
echo "    Optional LiveKit worker: bash scripts/prod-desktop.sh"
echo "    App URL: ${APP_URL:-http://localhost:4000}"
echo "    Switch tenant in UI → /tenants"
