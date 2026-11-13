// Supabase Edge Function: builds (or refreshes) the shared knowledge pack for one country + domain + language.
// Deploy: Supabase Dashboard > Edge Functions > Deploy a new function (via Editor), name: knowledge-refresh, paste this file.
// Secret needed: GEMINI_API_KEY (Edge Functions > Secrets). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// Cost control: results are shared by all users, a pack younger than 90 days is never regenerated, one attempt per hour per pack.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const DOMAINS = ["plants", "pets", "aquarium", "livestock"];
const TOPICS: Record<string, string[]> = {
  plants: ["growing_season", "common_pests_and_diseases", "pesticide_rules", "where_to_get_help"],
  pets: ["vaccinations_and_health_checks", "common_health_risks", "regulations", "where_to_get_help"],
  aquarium: ["water_quality_basics", "common_fish_diseases", "regulations", "where_to_get_help"],
  livestock: ["housing_and_feeding", "vaccinations_and_diseases", "regulations", "where_to_get_help"],
};
const LANG_NAMES: Record<string, string> = { he: "Hebrew", en: "English", fi: "Finnish", da: "Danish", de: "German" };

async function pageText(url: string): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { "User-Agent": "garden-guide-knowledge/1.0" } });
  if (!r.ok) throw new Error(`source ${url} returned ${r.status}`);
  const html = await r.text();
  return html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 15000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { country, domain = "plants", lang = "en" } = await req.json();
    if (!/^[A-Z]{2}$/.test(country ?? "") || !DOMAINS.includes(domain) || !/^[a-z]{2}$/.test(lang)) return json({ error: "bad input" }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. fresh pack already there? serve from cache
    const { data: have } = await admin.from("knowledge_items").select("topic,valid_until").eq("country", country).eq("domain", domain).eq("lang", lang);
    if (have?.length && have.every((r) => new Date(r.valid_until) > new Date())) return json({ cached: true, count: have.length });

    // 2. one attempt per hour per pack
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { data: runs } = await admin.from("knowledge_runs").select("id").eq("country", country).eq("domain", domain).eq("lang", lang).gte("started_at", since);
    if (runs?.length) return json({ error: "a refresh was already tried in the last hour" }, 429);
    await admin.from("knowledge_runs").insert({ country, domain, lang });

    // 3. official sources for the country
    const { data: c } = await admin.from("countries").select("sources").eq("code", country).single();
    const sources: { name: string; url: string }[] = (c?.sources ?? []).slice(0, 3);
    if (!sources.length) return json({ error: "no official sources configured for this country yet" }, 422);
    const pages: string[] = [];
    for (const s of sources) { try { pages.push(`SOURCE: ${s.name} (${s.url})\n${await pageText(s.url)}`); } catch (_) { /* skip a broken source */ } }
    if (!pages.length) return json({ error: "official sources could not be read" }, 502);

    // 4. summarise with Gemini, grounded only in the pages
    const topics = TOPICS[domain];
    const prompt = `You prepare a short information pack for home growers/keepers in ${country}, in ${LANG_NAMES[lang] ?? lang}.
Use ONLY the source pages below. If the pages do not support a topic, return one bullet saying the information is not available from the sources. Never give pesticide or medicine doses; refer to the product label and a local expert. Max 5 short bullets per topic.
Return JSON: an array of {"topic": one of ${JSON.stringify(topics)}, "title": string, "bullets": string[]}, one object per topic.
SOURCES:\n${pages.join("\n\n")}`;
    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash";
    const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    const gj = await g.json();
    if (gj.error) return json({ error: "AI: " + gj.error.message }, 502);
    const items = JSON.parse(gj.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]");
    const rows = items.filter((i: any) => topics.includes(i.topic) && Array.isArray(i.bullets)).map((i: any) => ({
      country, domain, lang, topic: i.topic, content: { title: String(i.title ?? i.topic), bullets: i.bullets.map(String) },
      source_url: sources[0].url, fetched_at: new Date().toISOString(), valid_until: new Date(Date.now() + 90 * 86400_000).toISOString(),
      version: 1, review_status: "auto",
    }));
    if (!rows.length) return json({ error: "AI returned no usable topics" }, 502);
    const { error } = await admin.from("knowledge_items").upsert(rows, { onConflict: "country,domain,lang,topic" });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, count: rows.length });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
