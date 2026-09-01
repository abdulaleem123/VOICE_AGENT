# Voice Agent

Single-tenant AI voice & chat agent built with **Next.js 16.3.1**. Configure your agent, upload a knowledge base (PDF/DOC/TXT), run conversations with voice, qualify leads, hand off pricing/NDA threads, and book meetings — all powered by your OpenAI API key.

## Features

- **Agent configuration** — name, tone, description, target titles (CEO/CFO/CTO…), qualification asks, OpenAI voice avatars
- **Knowledge base** — PDF, DOC/DOCX, TXT with embeddings
- **Conversation** — chat + mic (Whisper) + spoken replies (TTS)
- **Leads** — capture details + persona classification
- **Handoff** — pricing, NDA, meeting, human transfer
- **Meetings** — schedule follow-ups
- **Settings** — company profile
- **Super admin** (`/admin/login`) — health, cost usage, inbound/outbound call totals

## Quick start

```bash
# 1. Clone
git clone https://github.com/abdulaleem123/VOICE_AGENT.git
cd VOICE_AGENT

# 2. Environment
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and a strong JWT_SECRET

# 3. Install & database
npm install
npx prisma db push
npx tsx prisma/seed.ts

# 4. Run (localhost:4000)
npm run dev
```

Open **http://localhost:4000/login**

| Role | URL | Default credentials |
|------|-----|---------------------|
| Operator | `/login` | `operator@voiceagent.local` / `Operator123!` |
| Super admin | `/admin/login` | `admin@voiceagent.local` / `Admin123!` |

## Production

```bash
npm run build
npm start
```

## Environment variables

See [`.env.example`](.env.example) for the full list. Required:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI / ChatGPT API key |
| `JWT_SECRET` | Session signing secret (32+ chars) |
| `DATABASE_URL` | SQLite path (default `file:./dev.db`) |
| `USER_EMAIL` / `USER_PASSWORD` | Operator login (seeded on first run) |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Admin login (seeded on first run) |
| `APP_URL` | App origin, e.g. `http://localhost:4000` |

## Security notes

- `.env` is gitignored — never commit secrets
- Auth enforced on every API route + proxy layer
- Login rate-limited, CSRF origin checks on writes
- Next.js 16.3.1 (patched security release)

## License

MIT
