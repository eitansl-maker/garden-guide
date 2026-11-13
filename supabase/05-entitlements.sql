-- Sellable packs (David, 2026-11-13). Run once in Supabase > SQL Editor. Safe to run with no payment yet: nothing is locked until the app flag PACKS_ENFORCE is turned on.
-- One row = one thing the user owns. pack null = the whole domain. domain '*' = everything.
create table if not exists public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,
  pack text,
  source text not null default 'manual',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, domain, pack)
);
alter table public.entitlements enable row level security;
-- Read-only for the user. No insert/update/delete policy: only the service role (payment webhook) writes.
drop policy if exists entitlements_read_own on public.entitlements;
create policy entitlements_read_own on public.entitlements for select using (user_id = auth.uid() and (expires_at is null or expires_at > now()));
