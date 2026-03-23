# CategoryCrash 🎮

A real-time multiplayer word game where 2–6 players race to type answers that satisfy **two categories at once**. Speed meets creativity!

## 🎯 Game Concept

Each round presents TWO categories simultaneously. Players must find a single answer that fits BOTH categories.

**Example:**
- Categories: "Things that are RED" × "Things found in a KITCHEN"
- Valid answers: Tomato, Apple, Chili pepper, Ketchup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API key (for AI validation)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
GROQ_API_KEY=your_groq_api_key_here
```

### Development

Run both servers in separate terminals:

```bash
# Terminal 1: Start PartyKit server
npm run partykit:dev

# Terminal 2: Start Next.js dev server
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

| Event | Points |
|-------|--------|
| 1st valid answer | 500 |
| 2nd valid answer | 400 |
| 3rd+ valid answer | 300 |
| Unique answer bonus | +100 |
| Invalid answer | 0 |

**Pro Tips:**
- Speed matters! First valid submission gets the most points
- Creative answers are more likely to be unique (+100 bonus)
- Invalid answers (AI validated) score nothing

## ✨ Features

- **125 Category Pairs** - Diverse combinations across colors, animals, food, geography, sports, jobs, and more
- **AI Validation** - Groq-powered answer validation using llama-3.3-70b
- **Real-time Multiplayer** - WebSocket-based gameplay via PartyKit
- **Toast Notifications** - Instant feedback for all game actions
- **Round-by-Round Results** - See who won each round and their winning answers
- **Customizable Settings** - Adjust rounds (3-15), time limits, and difficulty

## 📦 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page with rules
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── room/[roomId]/     # Game room & results pages
│   └── api/               # API routes (room create, AI validation)
├── components/
│   ├── game/              # Game views (Lobby, Answer, Voting, Score, Results)
│   └── ui/                # Reusable UI components
├── contexts/              # React contexts (Toast)
├── hooks/                 # Custom hooks (useGameRoom)
├── lib/                   # Utilities & types
├── party/                 # PartyKit server
│   └── index.ts          # Real-time game logic & AI integration
├── public/                # Static assets (logos, icons)
└── partykit.json          # PartyKit configuration
```

## 🎨 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (Neobrutalism design)
- **Real-time**: PartyKit (WebSockets)
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Fonts**: Anton, Epilogue, DM Mono
- **Deployment**: Vercel (frontend) + PartyKit (WebSockets)

## 🏗️ Architecture

```
┌─────────────┐         WebSocket         ┌──────────────┐
│  Next.js    │ ◄──────────────────────► │   PartyKit   │
│  Frontend   │      (partysocket)        │    Server    │
└─────────────┘                           └──────────────┘
       │                                         │
       │  HTTP                                   │ AI Validation
       ▼                                         ▼
┌─────────────┐                           ┌──────────────┐
│  API Routes │                           │   Groq API   │
│  /api/*     │                           │  (LLM)       │
└─────────────┘                           └──────────────┘
```

## 🎮 Game Flow

1. **Lobby** → Players join, host configures settings
2. **Revealing** → Categories appear (3s countdown)
3. **Answering** → Type your answer (configurable, default 20s)
4. **Voting** → AI validates + optional manual voting (15s)
5. **Scores** → See round results (5s)
6. **Repeat** → Continue for configured rounds (default 10)
7. **Results** → Final standings, winner, and round-by-round breakdown

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run partykit:dev     # Start PartyKit dev server

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run partykit:deploy  # Deploy PartyKit

# Utilities
npm run lint             # Run ESLint
```

## 🚀 Deployment

### 1. Deploy PartyKit

```bash
npm run partykit:deploy
```

You'll get a URL like: `https://categorycrash.<username>.partykit.dev`

### 2. Deploy Next.js to Vercel

```bash
vercel
```

Set environment variables in Vercel:
- `NEXT_PUBLIC_PARTYKIT_HOST` = your PartyKit URL
- `GROQ_API_KEY` = your Groq API key

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
