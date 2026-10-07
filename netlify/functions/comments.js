import { getStore } from "@netlify/blobs";

const MAX_COMMENTS = 300;
const MAX_NAME = 60;
const MAX_TEXT = 2000;
const MAX_SITE = 300;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const cleanText = (v) =>
  String(v ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_TEXT);

function normSite(raw) {
  const s = clean(raw, MAX_SITE);
  if (!s) return "";
  const withProto = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    if (!u.hostname.includes(".")) return "";
    return u.toString().slice(0, MAX_SITE);
  } catch {
    return "";
  }
}

export default async (req) => {
  let store;
  try {
    store = getStore("comentarii");
  } catch {
    return json({ error: "Stocarea comentariilor nu este disponibilă." }, 500);
  }

  if (req.method === "GET") {
    const slug = clean(new URL(req.url).searchParams.get("slug"), 120);
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return json({ error: "Articol invalid." }, 400);
    const list = (await store.get(`articol/${slug}.json`, { type: "json" })) ?? [];
    return json({ comments: Array.isArray(list) ? list : [] });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cerere invalidă." }, 400);
    }
    if (body.companie) return json({ ok: true }); // honeypot anti-boți
    const slug = clean(body.slug, 120);
    const name = clean(body.name, MAX_NAME);
    const text = cleanText(body.text);
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return json({ error: "Articol invalid." }, 400);
    if (name.length < 2) return json({ error: "Scrie-ți numele (minim 2 caractere)." }, 400);
    if (text.length < 2) return json({ error: "Scrie un comentariu (minim 2 caractere)." }, 400);
    const website = normSite(body.website);

    const key = `articol/${slug}.json`;
    const list = (await store.get(key, { type: "json" })) ?? [];
    const arr = Array.isArray(list) ? list : [];
    const comment = { name, website, text, at: new Date().toISOString() };
    arr.push(comment);
    await store.setJSON(key, arr.slice(-MAX_COMMENTS));
    return json({ ok: true, comment });
  }

  return json({ error: "Metodă neacceptată." }, 405);
};
