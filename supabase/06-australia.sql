-- Australia (southern hemisphere) as a country (David, 2026-11-13). Run once in Supabase > SQL Editor.
insert into public.countries (code, names, default_lang, units, hemisphere, sources) values
 ('AU','{"he":"אוסטרליה","en":"Australia"}','en','metric','S','[
 {"name":"APVMA (Australian Pesticides and Veterinary Medicines Authority)","url":"https://apvma.gov.au/"},
 {"name":"Department of Agriculture, Fisheries and Forestry","url":"https://www.agriculture.gov.au/"}]')
on conflict (code) do update set sources = excluded.sources;
