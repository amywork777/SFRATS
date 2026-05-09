-- SFRATS Supabase setup
-- Run this in your Supabase project's SQL editor (Project → SQL Editor → New query → paste → Run).
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. items table
-- ============================================================
create table if not exists public.items (
  id            bigserial primary key,
  title         varchar(255) not null,
  description   text,
  category      varchar(50),
  location_address text,
  location_lat  double precision,
  location_lng  double precision,
  available_from  timestamptz,
  available_until timestamptz,
  created_at    timestamptz default now(),
  interest_count integer default 0,
  status        varchar(20) default 'available',
  url           text,
  posted_by     varchar(255),
  contact_info  text,
  edit_code     varchar(255) not null,
  images        text[] default '{}'::text[]
);

create index if not exists idx_items_status     on public.items(status);
create index if not exists idx_items_created_at on public.items(created_at);

-- ============================================================
-- 2. RLS — open policies that match the original app's design
--    (anonymous public posting; client-side edit_code check)
--    Tighten these later if you add real auth.
-- ============================================================
alter table public.items enable row level security;

drop policy if exists "items_public_select" on public.items;
create policy "items_public_select" on public.items
  for select using (true);

drop policy if exists "items_public_insert" on public.items;
create policy "items_public_insert" on public.items
  for insert with check (true);

drop policy if exists "items_public_update" on public.items;
create policy "items_public_update" on public.items
  for update using (true) with check (true);

drop policy if exists "items_public_delete" on public.items;
create policy "items_public_delete" on public.items
  for delete using (true);

-- ============================================================
-- 3. increment_interest RPC (called by api.updateInterestCount)
-- ============================================================
create or replace function public.increment_interest(item_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.items
     set interest_count = coalesce(interest_count, 0) + 1
   where id = item_id
  returning interest_count;
$$;

grant execute on function public.increment_interest(bigint) to anon, authenticated;

-- ============================================================
-- 4. Storage bucket for item images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = true;

drop policy if exists "item_images_public_read"   on storage.objects;
drop policy if exists "item_images_public_insert" on storage.objects;
drop policy if exists "item_images_public_update" on storage.objects;
drop policy if exists "item_images_public_delete" on storage.objects;

create policy "item_images_public_read" on storage.objects
  for select using (bucket_id = 'item-images');

create policy "item_images_public_insert" on storage.objects
  for insert with check (bucket_id = 'item-images');

create policy "item_images_public_update" on storage.objects
  for update using (bucket_id = 'item-images') with check (bucket_id = 'item-images');

create policy "item_images_public_delete" on storage.objects
  for delete using (bucket_id = 'item-images');

-- ============================================================
-- 5. (Optional) seed a couple of rows so the map has markers
-- ============================================================
insert into public.items
  (title, description, category, location_address, location_lat, location_lng,
   available_from, status, edit_code)
values
  ('Free couch (test)',     'Comfy 3-seater, must take today.', 'Items',    'Mission St, San Francisco, CA',  37.7599, -122.4148, now(), 'available', 'demo1'),
  ('Free pizza @ meetup',   'Leftovers from a tech talk.',      'Food',     'SoMa, San Francisco, CA',         37.7785, -122.3948, now(), 'available', 'demo2'),
  ('Yard sale',             'Everything must go.',              'Events',   'Noe Valley, San Francisco, CA',   37.7508, -122.4337, now(), 'available', 'demo3')
on conflict do nothing;
