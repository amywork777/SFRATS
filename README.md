# SFRATS — SF Really Awesome Things Sharing

Map-based app for sharing free events, food, items, and services in San Francisco. Frontend is React + Vite + Leaflet, backed by Supabase (Postgres + storage).

## Getting it running

### 1. Install deps

```bash
cd frontend
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com → **New project**.
2. Pick a region close to you. Set a strong DB password (you won't need it for the frontend).
3. Wait ~1 min for the project to provision.

### 3. Apply the schema

1. In the project dashboard, open **SQL Editor** → **New query**.
2. Paste the contents of [`database/supabase-setup.sql`](database/supabase-setup.sql) and click **Run**.
3. This creates the `items` table, RLS policies, the `increment_interest` RPC, the `item-images` storage bucket, and a few demo rows so the map isn't empty.

### 4. Wire credentials

1. In the project dashboard, go to **Settings** → **API**.
2. Copy **Project URL** and **anon public** key.
3. Paste them into `frontend/.env`:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Run the dev server

```bash
cd frontend
npm run dev
```

Open http://localhost:3000. You should see a Leaflet map of SF centred on (37.7749, -122.4194) with three demo markers.

## What the recent fixes did

- `frontend/.eslintrc.cjs` restores the lint gate, and `npm run type-check` now passes again.
- Unused vulnerable client dependencies were removed, remaining runtime dependencies were refreshed, and `npm audit --omit=dev` reports no vulnerabilities.
- `frontend/.env` and `frontend/.env.production` are no longer tracked by git. Keep local credentials in ignored env files and use `frontend/.env.example` as the template.
- `frontend/src/utils/supabase.ts` no longer throws at import when env vars are missing — it warns instead, so the React app can still mount and you can see what's broken.
- `frontend/src/components/Map.tsx` now always renders the map. Loading / error / empty states show as a small overlay banner on top of the map instead of replacing it (which was why the map "didn't render" before).
- `frontend/src/components/LocationPicker.tsx` had a duplicate `className` key in its marker icon definition; removed.
- `database/supabase-setup.sql` is a new, idempotent migration matching what the frontend code actually expects (including the `images` text[] column, the `increment_interest` RPC, RLS policies, and the storage bucket).

## Known rough edges

- There are no automated unit or integration tests yet; current verification is `npm run type-check`, `npm run lint`, `npm run build`, and `npm audit --omit=dev`.

## Project layout

```
frontend/         Vite + React + TS app (the thing you actually run)
database/
  schema.sql           original Postgres schema (legacy)
  supabase-setup.sql   what to paste into Supabase SQL editor
```
