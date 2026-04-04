# Buddy Script

Monorepo layout:

- **`frontend/`** — Next.js app (UI, run `npm run dev` from repo root or from `frontend/`)
- **`backend/`** — API / server (add your stack here later)

Reference HTML/CSS for feed conversion stays in **`appifylab-project/`** (gitignored); keep it next to the repo root for `frontend/scripts/convert-feed-html.mjs`.

## Commands (from repository root)

```bash
npm install
npm run dev
npm run build
npm run lint
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
