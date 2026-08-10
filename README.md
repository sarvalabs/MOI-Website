# MOI Website

Landing page and chatbot experience for MOI.

## Repo Structure

- `src/`: React frontend built with Vite.
- `server/`: Express chatbot API.
- `scripts/ingest.js`: document ingestion script for the retrieval pipeline.
- `docs/`: source documents used for ingestion into Supabase.
- `public/`: static frontend assets served to users.
- `supabase-setup.sql`: database setup for the retrieval store.

## How The App Is Split

This repo is intentionally split into two runtime pieces:

1. The frontend is a static Vite app.
2. The chatbot runs on a separate Node/Express backend.

The frontend sends chat requests to `VITE_CHATBOT_API`, and the backend handles:

- embeddings via OpenAI
- retrieval via Supabase
- response generation and streaming via Anthropic

## Environment Variables

Copy `.env.example` to `.env` for local development and fill in your real values.

Required variables:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PORT`
- `VITE_CHATBOT_API`

For local development, `VITE_CHATBOT_API` should usually be `http://localhost:3001`.

## Local Development

Install dependencies:

```bash
npm install
npm install --prefix server
```

Run the frontend:

```bash
npm run dev
```

Run the backend in a second terminal:

```bash
npm run dev:server
```

The local app will then run as:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Ingestion Workflow

The chatbot relies on documents stored in `docs/`.

To ingest documents into Supabase:

```bash
npm run ingest
```

To clear existing stored chunks first:

```bash
npm run ingest:clear
```

Notes:

- `docs/` is the ingestion source of truth.
- `public/MOILitePaper.pdf` is kept separately because it is linked from the site UI.

## Build

Build the frontend:

```bash
npm run build
```

Preview the frontend build locally:

```bash
npm run preview
```

Run the backend in production mode:

```bash
npm start --prefix server
```

## Deployment

The site and the blog deploy as static builds to a VM behind nginx — see
[DEPLOYMENT.md](DEPLOYMENT.md) for what gets built, where it is served, and how
posts get published. Earlier revisions of this file recommended Vercel; that is
no longer the model.

### Frontend

Deploy the root app as a static Vite site and set:

```bash
VITE_CHATBOT_API=https://your-backend-url
```

### Backend

Deploy `server/` as a Node service with these env vars:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PORT`

The backend exposes:

- `GET /api/health`
- `POST /api/chat`

## Notes

- Do not commit `.env`.
- `CHATBOT_PROCESS.md` is internal process documentation and is not required for runtime.
- The app currently uses a split frontend/backend architecture by design; this repo is not set up as a single full-stack deployment target.
