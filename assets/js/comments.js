// Comentarii articole — formular discret stil YouTube + raspunsuri, Netlify Blobs
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

  const who = (c) => c.website
    ? `<a href="${esc(c.website)}" rel="nofollow ugc noopener" target="_blank">${esc(c.name)}</a>`
    : esc(c.name);

  mount.innerHTML =
    '<form class="cnew" novalidate>' +
    '<h3 class="ckicker">Lasă un comentariu</h3>' +
    '<div class="crow">' +
    '<input class="cline" name="name" required maxlength="60" autocomplete="name" placeholder="Numele tău *">' +
    '<input class="cline" name="website" maxlength="300" inputmode="url" autocomplete="url" placeholder="Site web (opțional)">' +
    "</div>" +
    '<input class="cline cmain" name="text" required maxlength="2000" placeholder="Adaugă un comentariu…" autocomplete="off">' +
    '<div class="hp" aria-hidden="true"><input name="companie" tabindex="-1"></div>' +
    '<div class="cactions"><span class="cmsg muted" role="status"></span>' +
    '<button class="btn btn-dark" type="submit">Comentează</button></div>' +
    "</form>" +
    '<div class="clist-wrap"><h3 class="ckicker">Comentarii <span class="ccount muted"></span></h3>' +
    '<div class="clist"><p class="muted">Se încarcă comentariile…</p></div></div>';

  const list = mount.querySelector(".clist");
  const count = mount.querySelector(".ccount");
  const form = mount.querySelector(".cnew");
  const msg = mount.querySelector(".cmsg");

  const replyForm = (id) =>
    `<form class="creply" data-parent="${esc(id)}">` +
    '<div class="crow">' +
    '<input class="cline" name="name" required maxlength="60" autocomplete="name" placeholder="Numele tău *">' +
    '<input class="cline" name="website" maxlength="300" inputmode="url" autocomplete="url" placeholder="Site (opțional)">' +
    "</div>" +
    '<input class="cline" name="text" required maxlength="2000" placeholder="Scrie un răspuns…" autocomplete="off">' +
    '<div class="hp" aria-hidden="true"><input name="companie" tabindex="-1"></div>' +
    '<div class="cactions"><button class="cbtn-link" type="button" data-cancel>Renunță</button>' +
    '<button class="btn btn-dark btn-s" type="submit">Răspunde</button></div>' +
    "</form>";

  const item = (c, isReply) =>
    `<article class="citem" data-id="${esc(c.id)}">` +
    `<header><b>${who(c)}</b><span class="meta"> • ${esc(fmtDate(c.at))}</span></header>` +
    `<p>${esc(c.text)}</p>` +
    (isReply ? "" : '<button class="creply-btn" type="button">Răspunde</button><div class="rform"></div>') +
    "</article>";

  const render = (comments) => {
    count.textContent = comments.length ? `(${comments.length})` : "";
    if (!comments.length) {
      list.innerHTML = '<p class="muted">Niciun comentariu încă. Fii primul care scrie!</p>';
      return;
    }
    list.innerHTML = comments.map((c) =>
      `<article class="citem" data-id="${esc(c.id)}">` +
      `<header><b>${who(c)}</b><span class="meta"> • ${esc(fmtDate(c.at))}</span></header>` +
      `<p>${esc(c.text)}</p>` +
      '<button class="creply-btn" type="button">Răspunde</button><div class="rform"></div>' +
      (c.replies && c.replies.length
        ? `<div class="creplies">${c.replies.map((r) => item(r, true)).join("")}</div>`
        : "") +
      "</article>"
    ).join("");
  };

  const reload = () =>
    fetch(`${API}?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => render(Array.isArray(d.comments) ? d.comments : []));

  reload().catch(() => {
    list.innerHTML = '<p class="muted">Comentariile nu pot fi încărcate momentan.</p>';
  });

  const post = (fd, parentId, okMsg, statusEl, btn) => {
    statusEl.textContent = "";
    btn.disabled = true;
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: fd.get("name"),
        website: fd.get("website"),
        text: fd.get("text"),
        companie: fd.get("companie"),
        parentId: parentId || "",
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Eroare la trimitere.");
        statusEl.textContent = okMsg;
        const f = btn.form;
        if (f) {
          if (f.classList.contains("creply")) {
            const box = f.closest(".rform");
            const art = f.closest(".citem");
            f.reset();
            if (box) box.innerHTML = "";
            const tb = art ? art.querySelector(":scope > .creply-btn") : null;
            if (tb) tb.textContent = "Răspunde";
          } else {
            const t = f.querySelector(".cmain");
            if (t) t.value = "";
          }
        }
        return reload();
      })
      .catch((err) => {
        statusEl.textContent = err.message || "Nu am putut trimite comentariul.";
      })
      .finally(() => {
        btn.disabled = false;
      });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);
    if (!String(fd.get("name") || "").trim() || !String(fd.get("text") || "").trim()) {
      msg.textContent = "Completează numele și comentariul.";
      return;
    }
    post(fd, "", "Mulțumim! Comentariul a fost publicat.", msg, btn);
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".creply-btn");
    if (!btn) return;
    const article = btn.closest(".citem");
    const box = article.querySelector(".rform");
    if (box.innerHTML) {
      box.innerHTML = "";
      btn.textContent = "Răspunde";
      return;
    }
    list.querySelectorAll(".rform").forEach((el) => { el.innerHTML = ""; });
    list.querySelectorAll(".creply-btn").forEach((el) => { el.textContent = "Răspunde"; });
    box.innerHTML = replyForm(article.dataset.id);
    btn.textContent = "Închide";
    box.querySelector(".cline").focus();
  });

  list.addEventListener("click", (e) => {
    if (e.target.closest("[data-cancel]")) {
      const box = e.target.closest(".rform");
      box.innerHTML = "";
      const article = e.target.closest(".citem");
      const btn = article.querySelector(":scope > .creply-btn");
      if (btn) btn.textContent = "Răspunde";
    }
  });

  list.addEventListener("submit", (e) => {
    const rf = e.target.closest(".creply");
    if (!rf) return;
    e.preventDefault();
    const fd = new FormData(rf);
    if (!String(fd.get("name") || "").trim() || !String(fd.get("text") || "").trim()) return;
    const btn = rf.querySelector('button[type="submit"]');
    const tmp = document.createElement("span");
    tmp.className = "meta";
    btn.after(tmp);
    post(fd, rf.dataset.parent, "", tmp, btn);
  });
});
