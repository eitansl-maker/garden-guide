-- Tombstones for multi-device delete (David, 2026-11-13). Run once in Supabase > SQL Editor. Safe: the app works without it.
create table if not exists public.tombstones (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('event','reminder')),
  item_id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
alter table public.tombstones enable row level security;
drop policy if exists tombstones_own on public.tombstones;
create policy tombstones_own on public.tombstones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
