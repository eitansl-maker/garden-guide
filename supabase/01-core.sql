-- ===========================================================
-- Garden app platform: core schema v1 (David, 2026-11-13)
-- Paste the whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run once. Uses only public schema + auth.uid().
-- ===========================================================

-- ---------- Reference data (readable by everyone, written only by service role) ----------
create table if not exists public.countries (
  code text primary key,                 -- ISO 3166-1 alpha-2: IL, FI, DK, DE, US
  names jsonb not null,                  -- {"he":"ישראל","en":"Israel",...}
  default_lang text not null,
  units text not null default 'metric',  -- metric | imperial
  hemisphere text not null default 'N',  -- N | S
  sources jsonb not null default '[]',   -- official sources: [{"name":..., "url":..., "domain":"plants"}]
  enabled boolean not null default true
);

create table if not exists public.domain_packs (
  domain text primary key,               -- plants | pets | aquarium | livestock
  names jsonb not null,
  config jsonb not null default '{}',    -- event types, fields, metrics, prompts, warnings
  enabled boolean not null default false
);

create table if not exists public.species (
  id uuid primary key default gen_random_uuid(),
  domain text not null references public.domain_packs(domain),
  key text not null,
  names jsonb not null,
  attrs jsonb not null default '{}',
  unique (domain, key)
);

-- Country knowledge packs, refreshed automatically (Edge Function + pg_cron, step 3)
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  country text not null references public.countries(code),
  domain text not null references public.domain_packs(domain),
  lang text not null,
  topic text not null,
  content jsonb not null,
  source_url text,
  fetched_at timestamptz not null default now(),
  valid_until timestamptz not null default (now() + interval '90 days'),
  version int not null default 1,
  review_status text not null default 'auto' check (review_status in ('auto','needs_review','approved')),
  unique (country, domain, lang, topic)
);

-- ---------- Users ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  country text references public.countries(code) default 'IL',
  lang text not null default 'he',
  units text not null default 'metric',
  domains text[] not null default '{plants}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Generic core ----------
create table if not exists public.spaces (          -- plot / aquarium / dog's home / coop
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  domain text not null references public.domain_packs(domain),
  name text not null,
  attrs jsonb not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.space_members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor','advisor','viewer')),
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists public.invites (
  code text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 18),
  space_id uuid not null references public.spaces(id) on delete cascade,
  role text not null check (role in ('editor','advisor','viewer')),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references auth.users(id)
);

create table if not exists public.subjects (        -- a crop in a plot / a group of fish / a dog
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  species_id uuid references public.species(id),
  label text not null,                               -- free text, e.g. "תות"
  qty numeric,
  acquired_on date,
  status text not null default 'active',             -- active | sold | dead | harvested | gone
  ended_on date,
  attrs jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.events (          -- the log
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null default 'done' check (kind in ('done','instruction')),
  type text not null,                                -- stable key: spray, pest, fertilize, irrigate, prune, sow, harvest, other, feed, vaccine, vet, water_change, death, birth...
  occurred_on date not null default current_date,    -- for kind='instruction' this is the due date
  product text,
  dose text,
  notes text,
  advisor_name text,
  attrs jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists events_space_date on public.events (space_id, occurred_on desc);

create table if not exists public.measurements (    -- time series: pH, temp, weight...
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  metric text not null,
  value numeric not null,
  unit text,
  measured_at timestamptz not null default now()
);
create index if not exists meas_space_metric on public.measurements (space_id, metric, measured_at desc);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  space_id uuid references public.spaces(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  due_on date not null,
  rrule text,                                        -- optional recurrence, e.g. FREQ=WEEKLY
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnoses (       -- AI result history
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  space_id uuid references public.spaces(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  domain text not null default 'plants',
  label text,
  image_path text,                                   -- Supabase Storage path (added later)
  result text,
  thread jsonb not null default '[]',                -- follow-up Q&A
  created_at timestamptz not null default now()
);

-- ---------- Access helpers ----------
create or replace function public.space_role(sid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.spaces where id = sid and owner_id = auth.uid()) then 'owner'
    else (select role from public.space_members where space_id = sid and user_id = auth.uid() limit 1)
  end
$$;

create or replace function public.accept_invite(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites
   where code = p_code and used_by is null and expires_at > now();
  if not found then raise exception 'invite invalid or expired'; end if;
  insert into public.space_members (space_id, user_id, role)
    values (inv.space_id, auth.uid(), inv.role)
    on conflict (space_id, user_id) do update set role = excluded.role;
  update public.invites set used_by = auth.uid() where code = p_code;
  return inv.space_id;
end $$;

-- Account deletion (app-store requirement): removes the user and, by cascade, all their data
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- Row Level Security ----------
alter table public.countries       enable row level security;
alter table public.domain_packs    enable row level security;
alter table public.species         enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.profiles        enable row level security;
alter table public.spaces          enable row level security;
alter table public.space_members   enable row level security;
alter table public.invites         enable row level security;
alter table public.subjects        enable row level security;
alter table public.events          enable row level security;
alter table public.measurements    enable row level security;
alter table public.reminders       enable row level security;
alter table public.diagnoses       enable row level security;

-- reference data: read-only for everyone (writes only with the service role, no policy = denied)
create policy "ref read countries"  on public.countries       for select using (true);
create policy "ref read domains"    on public.domain_packs    for select using (true);
create policy "ref read species"    on public.species         for select using (true);
create policy "ref read knowledge"  on public.knowledge_items for select using (true);

-- profiles: own row
create policy "profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- spaces
create policy "spaces read"   on public.spaces for select to authenticated using (public.space_role(id) is not null);
create policy "spaces insert" on public.spaces for insert to authenticated with check (owner_id = auth.uid());
create policy "spaces update" on public.spaces for update to authenticated using (owner_id = auth.uid());
create policy "spaces delete" on public.spaces for delete to authenticated using (owner_id = auth.uid());

-- members + invites: managed by the space owner (members can see and leave)
create policy "members read"   on public.space_members for select to authenticated
  using (user_id = auth.uid() or public.space_role(space_id) = 'owner');
create policy "members manage" on public.space_members for all to authenticated
  using (public.space_role(space_id) = 'owner' or user_id = auth.uid())
  with check (public.space_role(space_id) = 'owner');
create policy "invites owner"  on public.invites for all to authenticated
  using (public.space_role(space_id) = 'owner') with check (public.space_role(space_id) = 'owner');

-- subjects / measurements: owner + editor write, any member reads
create policy "subjects read"  on public.subjects for select to authenticated using (public.space_role(space_id) is not null);
create policy "subjects write" on public.subjects for all to authenticated
  using (public.space_role(space_id) in ('owner','editor'))
  with check (public.space_role(space_id) in ('owner','editor'));

create policy "meas read"  on public.measurements for select to authenticated using (public.space_role(space_id) is not null);
create policy "meas write" on public.measurements for all to authenticated
  using (public.space_role(space_id) in ('owner','editor'))
  with check (public.space_role(space_id) in ('owner','editor'));

-- events: owner/editor full; advisor may add instructions and edit/delete their own
create policy "events read" on public.events for select to authenticated using (public.space_role(space_id) is not null);
create policy "events insert" on public.events for insert to authenticated
  with check (created_by = auth.uid() and (
    public.space_role(space_id) in ('owner','editor')
    or (public.space_role(space_id) = 'advisor' and kind = 'instruction')));
create policy "events update" on public.events for update to authenticated
  using (public.space_role(space_id) in ('owner','editor') or created_by = auth.uid());
create policy "events delete" on public.events for delete to authenticated
  using (public.space_role(space_id) in ('owner','editor') or created_by = auth.uid());

-- reminders / diagnoses: private to the owner
create policy "reminders own"  on public.reminders for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "diagnoses own"  on public.diagnoses for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------- Seed data ----------
insert into public.countries (code, names, default_lang, units, hemisphere, sources) values
 ('IL','{"he":"ישראל","en":"Israel"}','he','metric','N','[{"name":"משרד החקלאות","url":"https://www.gov.il/he/departments/ministry_of_agriculture_and_rural_development"},{"name":"שה\"ם","url":"https://www.moag.gov.il/shaham"}]'),
 ('FI','{"he":"פינלנד","en":"Finland","fi":"Suomi"}','fi','metric','N','[]'),
 ('DK','{"he":"דנמרק","en":"Denmark","da":"Danmark"}','da','metric','N','[]'),
 ('DE','{"he":"גרמניה","en":"Germany","de":"Deutschland"}','de','metric','N','[]'),
 ('US','{"he":"ארצות הברית","en":"United States"}','en','imperial','N','[]')
on conflict (code) do nothing;

insert into public.domain_packs (domain, names, config, enabled) values
 ('plants','{"he":"צמחים וגינה","en":"Plants & garden"}',
  '{"event_types":["spray","pest","fertilize","irrigate","prune","sow","harvest","other"],"metrics":["soil_ph","soil_moisture"]}', true),
 ('pets','{"he":"כלבים וחתולים","en":"Dogs & cats"}',
  '{"event_types":["feed","vaccine","vet","deworm","groom","weight","other"],"metrics":["weight"],"warning":"not_a_vet"}', false),
 ('aquarium','{"he":"אקווריום","en":"Aquarium"}',
  '{"event_types":["water_change","feed","medicine","death","new_fish","other"],"metrics":["ph","temp","nitrate","nitrite","ammonia"],"warning":"not_a_vet"}', false),
 ('livestock','{"he":"משק חי קטן","en":"Small livestock"}',
  '{"event_types":["feed","vaccine","vet","birth","death","harvest","other"],"metrics":["weight"],"warning":"not_a_vet"}', false)
on conflict (domain) do nothing;
