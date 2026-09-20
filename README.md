# Voice Agent

**Multi-tenant** AI voice & chat agent on **Next.js 16.3.1**, plus a **desktop / low-latency LiveKit worker** for inbound and outbound calls.

Sell one product to many industries: pick a tenant, and that industry’s agent, knowledge, leads, and call logs run.

## Industry tenants (seeded)

| Slug | Brand | Agent |
|------|--------|--------|
| `hospital` | Meridian Health Partners | Maya |
| `restaurant` | Ember & Oak Bistro | Sofia |
| `supermart` | FreshLane Market | Leo |
| `estate-agency` | Cornerstone Property Group | Claire |
| `software-house` | Nimbus Forge Technologies | Aria |

~400+ lines of inbound/outbound call playbooks live in `samples/tenants/`.

## Features

- **Tenant switcher**  `/tenants` + sidebar selector
- **Agent configuration**  per tenant (tone, interruption, noise cancel, low latency)
- **Knowledge base**  PDF / DOC / TXT, scoped per tenant
- **Conversation**  chat + mic + TTS + barge-in
- **Calls**  inbound / outbound logging, pickup vs miss, LiveKit dial
- **Leads / Handoff / Meetings**
- **Integrations**  LiveKit + SIP / Telnyx
- **Desktop worker**  Realtime voice; set `TENANT_SLUG` to load the right pack

## Quick start (local)

```bash
cp .env.example .env
# add OPENAI_API_KEY + JWT_SECRET
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open **http://localhost:4000/login** → **Tenants** to choose an industry.

| Role | URL | Default |
|------|-----|---------|
| Operator | `/login` | `operator@voiceagent.local` / `Operator123!` |
| Super admin | `/admin/login` | `admin@voiceagent.local` / `Admin123!` |

## Production (bash)

On a Linux/VPS host (Git Bash works on Windows):

```bash
# One-time: install, schema, seed 5 tenants
bash scripts/prod-setup.sh

# Build + start Next.js (default port 4000)
bash scripts/prod-start.sh

# Or one-shot background deploy
bash scripts/prod-deploy.sh

# Optional LiveKit worker for a specific industry
TENANT_SLUG=hospital bash scripts/prod-desktop.sh
```

| Script | Purpose |
|--------|---------|
| `scripts/prod-setup.sh` | `.env` check, `npm ci`, Prisma push, seed |
| `scripts/prod-start.sh` | `next build` + `next start` |
| `scripts/prod-deploy.sh` | Setup + background start (`WITH_DESKTOP=1` optional) |
| `scripts/prod-desktop.sh` | Python LiveKit worker for `TENANT_SLUG` |

Set `SEED_ON_SETUP=0` to skip reseeding on setup. Set `SKIP_BUILD=1` to restart without rebuilding.

## Desktop / LiveKit

```bash
cd desktop
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Fill `LIVEKIT_*` + trunks in `.env`, set `TENANT_SLUG`, then run `python agent.py` (or `bash scripts/prod-desktop.sh`).

Details: [`desktop/README.md`](desktop/README.md)

## Environment

See [`.env.example`](.env.example). Required: `OPENAI_API_KEY`, `JWT_SECRET`.  
Phone calls: `LIVEKIT_*`, trunk IDs, `DESKTOP_WORKER_KEY`, `TENANT_SLUG`.

## Security

- `.env` is gitignored  never commit secrets
- Desktop worker authenticates with `DESKTOP_WORKER_KEY`
- Guardrails block off-topic / secret fishing and can auto-close chat
- All operator data is scoped by the active tenant
