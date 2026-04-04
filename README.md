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
# Edit backend/.env — MONGODB_URI, JWT_SECRET (≥16 chars), FRONTEND_ORIGIN
npm run dev:backend
```

**Auth (JWT in httpOnly cookie):** the browser calls **`/api/...` on the Next app** (port 3000); Next **rewrites** those requests to the Express server (`BACKEND_URL`, default `http://127.0.0.1:4000`). The session cookie is set on **localhost:3000**, so middleware can protect pages.

```bash
cp frontend/.env.example frontend/.env.local
# Use the same JWT_SECRET string as in backend/.env
```

Run **both** in development: `npm run dev` and `npm run dev:backend` (two terminals).

- Register / login: `/register`, `/login` → redirects to **`/feed`** when successful.
- **`/feed`**, **`/friends`**, **`/messages`**, **`/profile`** require a valid session cookie.
- API: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (requires cookie).

- Health check: `GET http://localhost:4000/api/health` (direct to Express)

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
