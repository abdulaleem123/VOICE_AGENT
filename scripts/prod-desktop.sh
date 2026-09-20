#!/usr/bin/env bash
# =============================================================================
# Voice Agent  production LiveKit desktop worker (inbound + outbound SIP)
# Requires LIVEKIT_* and DESKTOP_WORKER_KEY in .env
# Usage:  bash scripts/prod-desktop.sh
#         TENANT_SLUG=hospital bash scripts/prod-desktop.sh
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

missing=()
[[ -z "${LIVEKIT_URL:-}" ]] && missing+=("LIVEKIT_URL")
[[ -z "${LIVEKIT_API_KEY:-}" ]] && missing+=("LIVEKIT_API_KEY")
[[ -z "${LIVEKIT_API_SECRET:-}" ]] && missing+=("LIVEKIT_API_SECRET")
[[ -z "${OPENAI_API_KEY:-}" ]] && missing+=("OPENAI_API_KEY")
[[ -z "${DESKTOP_WORKER_KEY:-}" ]] && missing+=("DESKTOP_WORKER_KEY")

if ((${#missing[@]})); then
  echo "ERROR: set these in .env for the desktop worker: ${missing[*]}"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "ERROR: Python 3 is required for the desktop worker"
  exit 1
fi
PY="$(command -v python3 || command -v python)"

cd "$ROOT/desktop"
if [[ ! -d .venv ]]; then
  echo "==> Creating Python venv in desktop/.venv"
  "$PY" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt

export TENANT_SLUG="${TENANT_SLUG:-hospital}"
export APP_URL="${APP_URL:-http://127.0.0.1:4000}"
export DISPATCH_API_URL="${DISPATCH_API_URL:-http://127.0.0.1:8000}"

mkdir -p "$ROOT/logs"
echo "==> Starting LiveKit worker (tenant slug: ${TENANT_SLUG})"
echo "    Profile sync: ${APP_URL}/api/desktop/profile?tenant=${TENANT_SLUG}"

# Prefer agent entrypoint if present
if [[ -f agent.py ]]; then
  exec python agent.py 2>&1 | tee -a "$ROOT/logs/desktop-worker.log"
elif [[ -f api.py ]]; then
  exec python api.py 2>&1 | tee -a "$ROOT/logs/desktop-worker.log"
else
  echo "ERROR: no agent.py or api.py in desktop/"
  exit 1
fi
