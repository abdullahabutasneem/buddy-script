# Buddy Script

Full-stack feed app: Next.js frontend, Express API, MongoDB, JWT auth in an httpOnly cookie (`buddy_token`). npm workspaces monorepo (`frontend/`, `backend/`).

The browser talks to Next on `/api/*` and `/uploads/*`; Next rewrites those to your Express `BACKEND_URL` so cookies stay on the frontend origin.

## What you need

Node.js 20 or 22, npm, and MongoDB (local or Atlas).

## Run locally

From the repo root:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env`: set `MONGODB_URI`, `JWT_SECRET` (at least 16 characters), and `FRONTEND_ORIGIN` (e.g. `http://localhost:3000`).

Edit `frontend/.env.local`: set `BACKEND_URL` (e.g. `http://127.0.0.1:4000`) and the same `JWT_SECRET` as the backend.

Two terminals:

```bash
npm run dev:backend
npm run dev
```

Open the URL Next prints (usually http://localhost:3000). `/` goes to `/login`; after login you use `/feed` and other protected routes.

## Backend environment

See `backend/.env.example`. Main variables:

- `MONGODB_URI` — required
- `JWT_SECRET` — required, 16+ chars
- `FRONTEND_ORIGIN` — CORS; comma-separated for multiple sites
- `TRUST_PROXY` — set to `true` behind Render/nginx so IPs are correct
- `CLOUDINARY_URL` — optional; use on free hosts so avatars/post images are stored as HTTPS URLs instead of ephemeral disk
- `UPLOADS_ROOT` — optional; absolute path for local uploads if you use a persistent disk

## Frontend environment

See `frontend/.env.example`:

- `BACKEND_URL` — Express origin only (http or https, no path)
- `JWT_SECRET` — must match the backend exactly

## Production notes

Use the same env ideas on your host: MongoDB URL, matching `JWT_SECRET` on API and Next, real `FRONTEND_ORIGIN` and `BACKEND_URL`, `TRUST_PROXY` on the API if you are behind a proxy.

Build: `npm run build:backend` then `npm run start:backend` for the API; `npm run build` then `npm run start` for Next (or your host’s equivalent).

On free PaaS without a disk, set `CLOUDINARY_URL` so images keep working after redeploys.


## Scripts (repo root)

- `npm run dev` — Next dev
- `npm run dev:backend` — API dev
- `npm run build` / `npm run start` — frontend production
- `npm run build:backend` / `npm run start:backend` — API production
- `npm run lint` — frontend ESLint
- `npm run convert-feed` — optional script to regenerate feed markup from static HTML (`frontend/scripts/convert-feed-html.mjs`)

## License

Private project unless you add a LICENSE and change this line.
