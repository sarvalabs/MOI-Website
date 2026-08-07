# CLAUDE.md

## Project Overview

MOI marketing website — React + Vite frontend with an Express chatbot backend. Two main pages: landing (Home) and "The Shift" (How It Works) with canvas-based animations.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, GSAP, React Router
- **Backend**: Express, Anthropic SDK (Claude streaming), OpenAI (embeddings), Supabase (vector DB)
- **Styling**: Tailwind v4 (config in `src/index.css`, no tailwind.config.js) + custom CSS variables

## Commands

```bash
npm install                    # Install frontend deps
npm install --prefix server    # Install backend deps
npm run dev                    # Vite dev server (localhost:5173)
npm run dev:server             # Express backend (localhost:3001)
npm run build                  # Production build → dist/
npm run lint                   # ESLint
npm run ingest                 # Ingest docs/ into Supabase
```

## Project Structure

```
src/
  pages/              # HomePage.jsx, HowItWorksPageV5.jsx
  components/         # Navbar, MOIChatbot, LandingFooter, BadgePill
  phases/v5/          # Canvas animation drawing functions
  hooks/              # useCanvasAnimation, useScrollReveal
  styles/             # Additional stylesheets
  index.css           # Tailwind v4 imports + CSS variables + custom classes
  App.jsx             # Routes: / (Home), /why-moi (The Shift)
server/
  index.js            # Express API: /api/chat (streaming), /api/health
lib/
  websiteChat.js      # Chat system prompt, markdown stripping, request builder
scripts/
  ingest.js           # PDF → chunks → OpenAI embeddings → Supabase
api/
  chat.js             # Vercel edge function (proxies to data room)
```

## Routes

- `/` → HomePage (landing)
- `/why-moi` → HowItWorksPageV5 (The Shift page)
- `/how-it-works` → redirects to `/why-moi`

## Design System

- **Colors**: `--cream` (#F5F3EE), `--ink` (#1A1A1A), `--purple` (#7B5EA7)
- **Fonts**: Instrument Serif (headlines), DM Mono (body/UI)
- **Patterns**: Frosted glass (`card-surface`), scroll reveals (`fade-slide-up`), canvas animations
- **Breakpoint**: 768px (mobile/desktop)
- See `DESIGN_SYSTEM.md` for full tokens

## Environment Variables

```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
PORT=3001
VITE_CHATBOT_API=http://localhost:3001
DATA_ROOM_CHAT_URL=...          # Optional: overrides default chat proxy target
```

## Key Conventions

- Tailwind v4: config lives in `src/index.css` using `@theme` block, not a config file
- Canvas animations are phase-based — each phase in `src/phases/v5/` is a separate draw function
- Chat uses SSE streaming — backend streams Claude responses chunk by chunk
- All API keys loaded from env vars, never hardcoded
- `.env` is gitignored; only `.env.example` is tracked
