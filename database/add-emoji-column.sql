-- Add an emoji column to items so each listing can carry a specific
-- icon (🏺 pottery, 🛒 market, 😂 comedy, 🎵 music, ✂️ craft, etc).
-- The scraper sets this automatically based on title/description keywords;
-- users can also pick one when they post a listing.
--
-- Run this in your Supabase project's SQL Editor.

alter table public.items
  add column if not exists emoji text;
