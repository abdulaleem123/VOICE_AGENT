# Voice Agent  Desktop / Low-latency Worker

Staging layer merged from `conversational_ai_Agent` into this SaaS product.

## What you get

| Feature | How |
|--------|-----|
| Inbound / outbound calls | LiveKit SIP + Telnyx trunk |
| Short humanized replies | Agent profile from SaaS |
| Knowledge base | Synced from Next.js `/api/desktop/profile` |
| Interruption (barge-in) | OpenAI Realtime server VAD |
| Auto-pause | Silence detection (`vadSilenceMs`) |
| Noise cancellation | LiveKit `BVCTelephony` |
| Low latency | Minimal first prompt + short VAD silence |
| Token / call outcomes | Posted to Next.js `/api/desktop/events` |

## Setup

```bash
cd desktop
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
```

Add to root `.env` (see `.env.example`):

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
OUTBOUND_TRUNK_ID=ST_...
INBOUND_TRUNK_ID=ST_...
AGENT_NAME=voice-agent-desktop
DESKTOP_WORKER_KEY=desktop-dev-key
APP_URL=http://localhost:4000
```

## Run (3 terminals)

1. SaaS dashboard: `npm run dev` (port 4000)
2. Desktop worker: `python agent.py start`
3. Browser staging: `python token_server.py` → http://localhost:3001  
   **or** outbound API: `python api.py` → http://localhost:8000/docs

## Outbound call

```bash
curl -X POST http://localhost:8000/call/outbound \
  -H "Content-Type: application/json" \
  -d '{"lead":{"phone_number":"+15551234567","contact_name":"Alex","company_name":"Acme"}}'
```

Pickup / miss outcomes appear on the SaaS **Calls** page and Overview dashboard.
