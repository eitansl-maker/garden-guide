-- Portugal as a country + full pet event types (David, 2026-11-13). Run once in Supabase > SQL Editor.
insert into public.countries (code, names, default_lang, units, hemisphere, sources) values
 ('PT','{"he":"פורטוגל","en":"Portugal","pt":"Portugal"}','pt','metric','N','[
 {"name":"DGAV (Direcao-Geral de Alimentacao e Veterinaria)","url":"https://www.dgav.pt/"},
 {"name":"DGADR (Direcao-Geral de Agricultura e Desenvolvimento Rural)","url":"https://www.dgadr.gov.pt/"}]')
on conflict (code) do update set sources = excluded.sources;

update public.domain_packs set config = jsonb_set(config, '{event_types}', '["feed","vaccine","deworm","flea","vet","meds","weight","groom","walk","other"]'::jsonb) where domain = 'pets';
