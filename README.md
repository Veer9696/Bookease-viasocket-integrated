# BookEase

A doctor-client appointment and lab-test booking platform: React + Vite frontend, Node/Express +
Prisma/MongoDB Atlas backend, with viaSocket-powered automation (Google Calendar, Gmail, Slack, and
more). See `VIASOCKET_INTEGRATIONS.md` for the integration roadmap.

The original plain HTML/CSS/JS prototype (`public/`, `server.js`, `flows.json`) is kept as a
reference until the new app (`client/`, `server/`) is verified feature-complete, then should be
removed.

## Project layout

```
client/   React + Vite + React Router + TanStack Query SPA
server/   Express API (routes -> controllers -> services), Prisma + MongoDB Atlas
```

## Local development

Requires Node 18+ and a MongoDB Atlas cluster (the free M0 tier is enough). In Atlas: create a
cluster, add a database user, and under Network Access allow your IP (or `0.0.0.0/0` for a demo) —
Atlas blocks every connection by default until its IP is allowlisted.

```bash
# 1. Server
cd server
cp .env.example .env         # fill in DATABASE_URL (Atlas connection string), JWT_SECRET, viaSocket creds
npm install
npx prisma db push           # syncs the schema to your Atlas database (Mongo has no migration history)
node prisma/seed.js          # double-booking index + demo doctors, lab tests, migrates flows.json
npm run dev                  # http://localhost:3000

# 2. Client (separate terminal)
cd client
npm install
npm run dev                  # http://localhost:5173, proxies /api to :3000
```

Demo doctor logins are printed by the seed script (password `Demo12345!`). Register a patient
account from the app itself.

**No Atlas account yet?** Run `node scripts/dev-db.js` in a separate terminal (from `server/`) —
it starts a local MongoDB with no install needed, on port 27117, saving data in `server/.dev-db`
so it survives restarts. Use `DATABASE_URL=mongodb://127.0.0.1:27117/bookease?replicaSet=rs0`.
It's for local testing only; swap in your Atlas URL for anything real.

Double-booking protection is a MongoDB partial unique index that Prisma's schema can't declare;
`prisma/ensure-indexes.js` creates it (run by `seed.js`, and on every Render deploy).

## Production build

```bash
cd client && npm run build   # outputs client/dist
cd server && npx prisma db push && node prisma/ensure-indexes.js && npm start
```

Express serves the built SPA directly — one process, no separate frontend host needed.

## Deploying to Render

`render.yaml` at the repo root defines a single Node Web Service. In the Render dashboard:
"New +" → "Blueprint", point it at this repo. You'll be prompted for `DATABASE_URL` (your Atlas
connection string) and the viaSocket env vars (`VIASOCKET_ORG_ID`, `VIASOCKET_PROJECT_ID`,
`VIASOCKET_EMBED_SECRET`) since those are all secrets marked `sync: false`. Remember to allow
Render's egress in Atlas's Network Access list (or `0.0.0.0/0`, since Render doesn't publish static
outbound IPs on the starter plan).
