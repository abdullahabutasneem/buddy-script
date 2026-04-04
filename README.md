# Buddy Script

Monorepo layout:

- **`frontend/`** — Next.js app (UI, run `npm run dev` from repo root or from `frontend/`)
- **`backend/`** — Express + MongoDB API (`npm run dev:backend`)

Reference HTML/CSS for feed conversion stays in **`appifylab-project/`** (gitignored); keep it next to the repo root for `frontend/scripts/convert-feed-html.mjs`.

## Commands (from repository root)

```bash
npm install
npm run dev
npm run build
npm run lint
```

### Backend (Express + MongoDB)

**Prerequisites:** [Node.js](https://nodejs.org/) and a MongoDB instance ([MongoDB Community](https://www.mongodb.com/try/download/community) locally, or [Atlas](https://www.mongodb.com/cloud/atlas)).

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI (and PORT if you want)
npm run dev:backend
```

- Health check: `GET http://localhost:4000/api/health` (default port from `.env.example`)

```bash
npm run build:backend
npm run start:backend
```

Regenerate `FeedMarkup.tsx` from local `appifylab-project/feed.html`:

```bash
npm run convert-feed
```

## Commands (from `frontend/` only)

```bash
cd frontend
npm install
npm run dev
```
