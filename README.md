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

- `frontend/src/utils/supabase.ts` no longer throws at import when env vars are missing — it warns instead, so the React app can still mount and you can see what's broken.
- `frontend/src/components/Map.tsx` now always renders the map. Loading / error / empty states show as a small overlay banner on top of the map instead of replacing it (which was why the map "didn't render" before).
- `frontend/src/components/LocationPicker.tsx` had a duplicate `className` key in its marker icon definition; removed.
- `database/supabase-setup.sql` is a new, idempotent migration matching what the frontend code actually expects (including the `images` text[] column, the `increment_interest` RPC, RLS policies, and the storage bucket).

## Known rough edges

- A bunch of pre-existing TypeScript errors in `EditListing`, `SubmitForm`, `MobileNav`, `ListingPreview`, `RecentSubmissions`, `ManagePage`, etc. The Vite build uses esbuild which is permissive, so the app still runs — but `npm run type-check` will complain. These are not new and are unrelated to the map-rendering issue.
- The `backend/` directory is the legacy Express + Postgres backend. The frontend talks to Supabase directly now, so you do not need to run the backend.
- The `.env` file is committed to git in this repo (carried over from the old setup). If you put real credentials there, consider adding it to `.gitignore`.

## Project layout

```
frontend/         Vite + React + TS app (the thing you actually run)
backend/          Legacy Express API — not used by the frontend anymore
database/
  schema.sql           original Postgres schema (legacy)
  supabase-setup.sql   what to paste into Supabase SQL editor
```

## Recurring events and expiry

`items.recurrence` is nullable JSON: `{"freq":"weekly","byday":[2,4,6],"time":"18:00"}`.
Weekdays are ISO Monday=1 through Sunday=7. Use `daily` for nightly events,
`monthly` with `ordinal: 1` for a first-Sunday market. All wall-clock times are
America/Los_Angeles, including DST. `available_from` is the first occurrence;
`available_until` is the series cutoff, NOT an individual occurrence's end.
Do not bump stored dates every scrape. Leave recurrence null for one-off events.
The map projects the next start every minute, hides ended events and undated
rows, and hides one-off starts older than 12 hours when no end is known.

Apply `database/recurrence-migration.sql` in Supabase SQL Editor. As of Oct 25,
2026 this migration is prepared but NOT applied: dashboard login requires 2FA
enrollment and no management/PG credential is available. The frontend temporarily
uses `legacyRecurrences.json` for 18 exact ID/title-matched birby rows, superseded
by a real recurrence value after migration. Three rows with no verifiable schedule
(Bow Bow karaoke, Panhandle pickup basketball, SFBV) are deliberately not guessed.
The earlier estimate of 41 did not match the 21 remaining birby rows at inspection.
Backups are under `/home/kit/files/sfrats-*-recurrence*-oct25.json`.
`__SCRAPER_RUN__` log rows must never be scheduled, displayed or modified here.

Run `cd frontend && npm run build && npm run type-check && npm test`.
