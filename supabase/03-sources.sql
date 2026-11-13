-- Official sources per country + run log for the knowledge-refresh function (David, 2026-11-13).
-- Run once in Supabase > SQL Editor. Sources are a starting list: review/extend them over time.
update public.countries set sources = '[
 {"name":"Ministry of Agriculture and Rural Development","url":"https://www.gov.il/he/departments/ministry_of_agriculture_and_rural_development"},
 {"name":"Shaham (Extension Service)","url":"https://www.moag.gov.il/shaham"}]' where code='IL';
update public.countries set sources = '[
 {"name":"Ruokavirasto: home gardeners","url":"https://www.ruokavirasto.fi/en/plants/garden-plants/home-gardeners"}]' where code='FI';
update public.countries set sources = '[
 {"name":"Miljøstyrelsen: pesticides","url":"https://eng.mst.dk/chemicals/pesticides"}]' where code='DK';
update public.countries set sources = '[
 {"name":"BVL: authorised plant protection products","url":"https://bvl.bund.de/EN/Tasks/04_Plant_protection_products/01_ppp_tasks/02_ppp_AuthorisationReviewActSub/01_ppps_authorised/ppp_authorised_node.html"}]' where code='DE';
update public.countries set sources = '[
 {"name":"USDA Plant Hardiness Zone Map","url":"https://planthardiness.ars.usda.gov/"}]' where code='US';

-- One row per refresh attempt, so the function can rate-limit itself. No client policy = clients cannot read or write it.
create table if not exists public.knowledge_runs (
  id bigint generated always as identity primary key,
  country text not null, domain text not null, lang text not null,
  started_at timestamptz not null default now(),
  status text not null default 'started'
);
alter table public.knowledge_runs enable row level security;
