import { getStore } from "@netlify/blobs";

const MAX_COMMENTS = 300;
const MAX_REPLIES = 100;
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

const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

// id-uri stabile pentru comentariile vechi (fara id): c0, c1… + replici c0r0…
function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list.map((c, i) => ({
    id: typeof c.id === "string" && c.id ? c.id : `c${i}`,
    name: String(c.name ?? ""),
    website: String(c.website ?? ""),
    text: String(c.text ?? ""),
    at: String(c.at ?? ""),
    replies: Array.isArray(c.replies)
      ? c.replies.map((r, j) => ({
          id: typeof r.id === "string" && r.id ? r.id : `c${i}r${j}`,
          name: String(r.name ?? ""),
          website: String(r.website ?? ""),
          text: String(r.text ?? ""),
          at: String(r.at ?? ""),
        }))
      : [],
  }));
}

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
    const list = normalize((await store.get(`articol/${slug}.json`, { type: "json" })) ?? []);
    return json({ comments: list });
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
    const parentId = clean(body.parentId, 40);
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return json({ error: "Articol invalid." }, 400);
    if (name.length < 2) return json({ error: "Scrie-ți numele (minim 2 caractere)." }, 400);
    if (text.length < 2) return json({ error: "Scrie un comentariu (minim 2 caractere)." }, 400);

    const key = `articol/${slug}.json`;
    const arr = normalize((await store.get(key, { type: "json" })) ?? []);
    const item = { id: rid(), name, website: normSite(body.website), text, at: new Date().toISOString() };

    if (parentId) {
      const parent = arr.find((c) => c.id === parentId);
      if (!parent) return json({ error: "Comentariul părinte nu există." }, 400);
      parent.replies.push(item);
      parent.replies = parent.replies.slice(-MAX_REPLIES);
    } else {
      arr.push(item);
    }
    await store.setJSON(key, arr.slice(-MAX_COMMENTS));
    return json({ ok: true, comment: item });
  }

  return json({ error: "Metodă neacceptată." }, 405);
};
