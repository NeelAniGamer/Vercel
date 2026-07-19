-- Run this in your Supabase SQL editor (Project → SQL Editor → New query).
-- Creates a table just for the shareable parts of a completed certificate —
-- deliberately not the full user profile, so it's safe to make publicly readable.

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  modules_completed int not null default 0,
  total_modules int not null default 52,
  score int not null default 0,
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists certificates_user_id_key on public.certificates(user_id);

alter table public.certificates enable row level security;

create policy "Certificates are publicly readable"
  on public.certificates for select
  using (true);

create policy "Users can upsert their own certificate"
  on public.certificates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own certificate"
  on public.certificates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
