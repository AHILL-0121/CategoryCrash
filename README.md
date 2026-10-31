# CategoryCrash 🎮

A real-time multiplayer word game where 2–6 players race to type answers that satisfy **two categories at once**. Speed meets creativity!

## 🎯 Game Concept

Each round presents TWO categories simultaneously. Players must find a single answer that fits BOTH categories.

**Example:**
- Categories: "Things that are RED" × "Things found in a KITCHEN"
- Valid answers: Tomato, Apple, Chili pepper, Ketchup

## 🚀 Quick Start

### Prerequisites
- Node.js 22.6+ (the test runner uses native TypeScript type-stripping)
- npm
- Groq API key (for AI validation)

### Installation

All application code lives in `frontend/` — there is no root package manifest, so
every command below runs from that directory.

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Then fill in `.env.local` — see [Environment variables](#-environment-variables).
At minimum you need `GROQ_API_KEY`.

### Development

Run both servers in separate terminals, both from `frontend/`:

```bash
# Terminal 1: Cloudflare Worker (WebSocket game server, wrangler dev) on :1999
npm run party:dev

# Terminal 2: Next.js (UI + AI API routes) on :3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Play

1. **Create or Join** a room with a unique code
2. **Wait** for 2-6 players to join
3. **Start** the game (host only)
4. **Answer** each round by typing something that fits BOTH categories
5. **AI validates** your answer automatically
6. **Score points** for speed, validity, and uniqueness
7. **Win** by having the highest score after all rounds!

## 🏆 Scoring System

Speed bonuses are ranked among **valid answers only** — an invalid answer never
occupies a scoring slot, so being fast and wrong does not push a correct answer
down the ranking.

| Event | Points |
|-------|--------|
| Fastest valid answer | 500 |
| 2nd fastest valid answer | 400 |
| 3rd+ valid answer | 300 |
| Unique answer bonus | +100 |
| Invalid answer | 0 |

**Pro Tips:**
- Speed matters! The first *valid* submission gets the most points
- Creative answers are more likely to be unique (+100 bonus)
- Invalid answers (AI validated) score nothing

## ✨ Features

- **125 Category Pairs** — across colors, animals, food, geography, sports, jobs, and more, each tagged easy / medium / hard
- **AI Validation** — Groq-powered, in two tiers: an exact match against a pre-fetched answer list is instant, and anything else is escalated to a strict AI judge
- **Real-time Multiplayer** — WebSocket-based gameplay via PartyKit
- **Reconnect-safe** — a refresh or a dropped connection keeps your seat, score and submitted answer
- **Toast Notifications** — instant feedback for all game actions
- **Round-by-Round Results** — the winner of each round is the fastest valid answer
- **Customizable Settings** — rounds (3–15), answer time, reveal time, voting time, difficulty, max players, and the manual-voting fallback

## 📦 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page with rules
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   ├── globals.css        # Global styles
│   ├── room/[roomId]/     # Game room & results pages
│   └── api/               # Room creation + the two AI routes
├── components/
│   ├── game/              # Game views (Lobby, Answer, Voting, Score, Results)
│   └── ui/                # Reusable UI components
├── contexts/              # React contexts (Toast)
├── hooks/                 # Custom hooks (useGameRoom, useCountdown)
├── lib/                   # Shared logic
│   ├── answer-matching.ts # Normalisation + conservative answer matching
│   ├── rounds.ts          # Round validity / round-winner rules
│   ├── ai-support.ts      # AI route auth, CORS, usage logging
│   └── types.ts           # Shared types + setting bounds
├── party/
│   ├── index.ts           # Game room (partyserver): logic, AI validation, scoring
│   └── worker.ts          # Worker entry point / routing
├── tests/                 # node:test suites
├── public/                # Static assets (logos, icons)
└── wrangler.jsonc         # Cloudflare Worker + Durable Object config
```

## 🎨 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (Neobrutalism design)
- **Real-time**: Cloudflare Workers + Durable Objects via partyserver (WebSockets)
- **AI**: Groq API (openai/gpt-oss-120b)
- **Fonts**: Anton, Epilogue, DM Mono (self-hosted via `next/font`)
- **Tests**: `node:test` (no test-framework dependency)
- **Deployment**: Vercel (frontend) + Cloudflare Workers (WebSockets)

## 🏗️ Architecture

```
┌─────────────┐         WebSocket         ┌──────────────┐
│  Next.js    │ ◄──────────────────────►  │   PartyKit   │
│  Frontend   │      (partysocket)        │    Server    │
└─────────────┘                           └──────────────┘
       │                                         │
       │  HTTP                                   │ BACKEND_URL
       ▼                                         │ + x-internal-key
┌─────────────┐                                  │
│  API Routes │ ◄────────────────────────────────┘
│  /api/*     │
└──────┬──────┘
       │ GROQ_API_KEY
       ▼
┌──────────────┐
│   Groq API   │
│    (LLM)     │
└──────────────┘
```

The AI routes are called by the **PartyKit server**, not by the browser. They
spend Groq tokens on every request, so they are protected by a shared secret.

## 🎮 Game Flow

1. **Lobby** → Players join, host configures settings
2. **Revealing** → Categories appear (configurable, default 5s)
3. **Answering** → Type your answer (configurable, default 20s)
4. **Voting** → Answers are revealed with their AI verdicts (default 15s). Manual voting appears only for answers the AI could not judge, and only if the host left the fallback enabled
5. **Scores** → See the round winner and the leaderboard (5s)
6. **Repeat** → Continue for the configured rounds (default 10)
7. **Results** → Final standings, winner, and round-by-round breakdown

## 🔑 Environment variables

Copy `frontend/.env.local.example` to `frontend/.env.local`.

| Variable | Used by | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_PARTYKIT_HOST` | browser | yes | PartyKit host to connect to |
| `NEXT_PUBLIC_SITE_URL` | Next build | production | `metadataBase` for Open Graph / Twitter share images |
| `GROQ_API_KEY` | Next API routes | yes | Groq authentication |
| `INTERNAL_API_SECRET` | Next + PartyKit | **production** | Shared secret for the AI routes. Without it they return `503` in production |
| `ALLOWED_ORIGINS` | Next API routes | no | Comma-separated browser origins allowed to call the AI routes |
| `BACKEND_URL` | PartyKit | **production** | Where the worker reaches the Next.js API. Defaults to `http://localhost:3000`, which does not exist once deployed — **AI validation silently no-ops if this is unset** |

## 🔧 Available Scripts

Run from `frontend/`:

```bash
# Development
npm run dev              # Start Next.js dev server
npm run party:dev        # Start Worker dev server (port 1999)

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run party:deploy     # Deploy Worker (wrangler deploy)

# Quality
npm test                 # Run the node:test suites
npm run lint             # Run ESLint
```

## 🚀 Deployment

### 1. Deploy Next.js to Vercel

```bash
cd frontend
vercel
```

Set environment variables in Vercel:
- `NEXT_PUBLIC_PARTYKIT_HOST` — your PartyKit URL
- `NEXT_PUBLIC_SITE_URL` — your deployed site URL
- `GROQ_API_KEY` — your Groq API key
- `INTERNAL_API_SECRET` — generate with `openssl rand -hex 32`
- `ALLOWED_ORIGINS` — your deployed site URL

### 2. Deploy the Worker (Cloudflare)

The Worker must know how to reach the deployed API, and must present the same
secret:

```bash
cd frontend
npx wrangler login
npx wrangler secret put INTERNAL_API_SECRET        # same value as on Vercel
npm run party:deploy -- --var BACKEND_URL:https://your-app.vercel.app
```

You'll get a URL like `https://categorycrash.<subdomain>.workers.dev` — put the
host (no `https://`) in Vercel as `NEXT_PUBLIC_PARTYKIT_HOST` and redeploy.
Clients connect to `/parties/category-crash-room/<roomId>`.

## 🎨 Design System

| Element | Value |
|---------|-------|
| Background | Newsprint (#FAF8F2) |
| Primary | Crash Red (#FF2020) |
| Secondary | Volt Green (#5DC900) |
| Accent | Coral (#FF6B2B) |
| Text | Press Black (#0D0D0D) |
| Display Font | Anton |
| Body Font | Epilogue |
| Mono Font | DM Mono |
| Style | Neobrutalism (thick borders, bold shadows) |

## 📝 License

MIT
