// Comentarii articole — Netlify Blobs (fara cont, doar nume + site optional)
document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("comentarii");
  if (!mount) return;
  const slug = (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return;
  const API = "/.netlify/functions/comments";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) +
      ", " + d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  };

  mount.innerHTML =
    '<section class="comments" aria-label="Comentarii">' +
    '<h2 class="stitle">Comentarii <span class="ccount muted"></span></h2>' +
    '<div class="clist"><p class="muted">Se încarcă comentariile…</p></div>' +
    '<h3>Adaugă un comentariu</h3>' +
    '<form class="cform" novalidate>' +
    '<div class="field"><label for="c-nume">Nume *</label>' +
    '<input id="c-nume" name="name" required maxlength="60" autocomplete="name" placeholder="Numele tău"></div>' +
    '<div class="field"><label for="c-site">Site web (opțional)</label>' +
    '<input id="c-site" name="website" maxlength="300" inputmode="url" autocomplete="url" placeholder="https://exemplu.ro"></div>' +
    '<div class="field hp" aria-hidden="true"><label>Companie<input name="companie" tabindex="-1"></label></div>' +
    '<div class="field"><label for="c-text">Comentariu *</label>' +
    '<textarea id="c-text" name="text" rows="4" required maxlength="2000" placeholder="Scrie aici…"></textarea></div>' +
    '<button class="btn btn-dark" type="submit">Trimite comentariul →</button>' +
    '<p class="cmsg muted" role="status"></p>' +
    "</form></section>";

  const list = mount.querySelector(".clist");
  const count = mount.querySelector(".ccount");
  const form = mount.querySelector(".cform");
  const msg = mount.querySelector(".cmsg");

  const render = (comments) => {
    count.textContent = comments.length ? `(${comments.length})` : "";
    if (!comments.length) {
      list.innerHTML = '<p class="muted">Niciun comentariu încă. Fii primul care scrie!</p>';
      return;
    }
    list.innerHTML = comments.map((c) => {
      const who = c.website
        ? `<a href="${esc(c.website)}" rel="nofollow ugc noopener" target="_blank">${esc(c.name)}</a>`
        : esc(c.name);
      return `<article class="citem"><header><b>${who}</b><span class="meta"> • ${esc(fmtDate(c.at))}</span></header><p>${esc(c.text)}</p></article>`;
    }).join("");
  };

  fetch(`${API}?slug=${encodeURIComponent(slug)}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => render(Array.isArray(d.comments) ? d.comments : []))
    .catch(() => {
      list.innerHTML = '<p class="muted">Comentariile nu pot fi încărcate momentan.</p>';
    });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    msg.textContent = "";
    btn.disabled = true;
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: data.get("name"),
        website: data.get("website"),
        text: data.get("text"),
        companie: data.get("companie"),
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Eroare la trimitere.");
        form.reset();
        msg.textContent = "Mulțumim! Comentariul a fost publicat.";
        return fetch(`${API}?slug=${encodeURIComponent(slug)}`)
          .then((r) => r.json())
          .then((full) => render(Array.isArray(full.comments) ? full.comments : []));
      })
      .catch((err) => {
        msg.textContent = err.message || "Nu am putut trimite comentariul.";
      })
      .finally(() => {
        btn.disabled = false;
      });
  });
});
