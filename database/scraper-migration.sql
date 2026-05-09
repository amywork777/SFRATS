-- Run this in Supabase SQL editor (after supabase-setup.sql).
-- Adds the dedup index and a "scraped" flag the scheduler will use.
-- Idempotent: safe to re-run.

-- Allow null urls (legacy rows) but enforce uniqueness on non-null urls
create unique index if not exists items_url_unique
  on public.items (url)
  where url is not null;

-- Convenience: index for filtering by source
create index if not exists items_posted_by_idx
  on public.items (posted_by);
