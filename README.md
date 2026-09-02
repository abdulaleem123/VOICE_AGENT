# Voice Agent

Single-tenant AI voice & chat agent on **Next.js 16.3.1**, plus a **desktop / low-latency LiveKit worker** merged from `conversational_ai_Agent`.

## Features

- **Agent configuration** — name, tone, short replies, humanized tone, interruption, auto-pause, noise cancel, low latency
- **Knowledge base** — PDF, DOC/DOCX, TXT with embeddings (synced to desktop worker)
- **Conversation** — chat + mic + spoken replies + barge-in
- **Calls** — inbound / outbound logging, **picked up vs not picked up**, LiveKit dial
- **Leads / Handoff / Meetings / Sessions**
- **Integrations** — LiveKit + SIP / Telnyx third-party APIs
- **SaaS token tracking** — input tokens, output tokens, cost
- **Super admin** — health, cost usage, call totals
- **Desktop staging** — realtime voice worker with noise cancellation + VAD interruption

## Quick start (SaaS dashboard)

```bash
cp .env.example .env
# add OPENAI_API_KEY + JWT_SECRET
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open **http://localhost:4000/login**

| Role | URL | Default |
|------|-----|---------|
| Operator | `/login` | `operator@voiceagent.local` / `Operator123!` |
| Super admin | `/admin/login` | `admin@voiceagent.local` / `Admin123!` |

## Desktop / low-latency voice (staging)

```bash
cd desktop
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Fill LiveKit + trunk vars in root `.env`, then in 3 terminals:

1. `npm run dev` — SaaS on :4000  
2. `python agent.py start` — voice worker  
3. `python token_server.py` — browser staging on :3001  
   or `python api.py` — outbound dispatch on :8000  

Details: [`desktop/README.md`](desktop/README.md)

## Environment

See [`.env.example`](.env.example). Required for dashboard: `OPENAI_API_KEY`, `JWT_SECRET`.  
Required for real phone calls: `LIVEKIT_*`, `OUTBOUND_TRUNK_ID` / `INBOUND_TRUNK_ID`.

## Security

- `.env` is gitignored — never commit secrets
- Desktop worker authenticates with `DESKTOP_WORKER_KEY`
- Guardrails block off-topic / secret fishing and can auto-close chat
