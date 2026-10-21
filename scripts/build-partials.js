#!/usr/bin/env node
/* ==========================================================
   build-partials.js
   1. Membuat halaman layanan (/layanan/ dan tiap kategori) dari
      templates/ + content/layanan.json
   2. Mengisi header & footer (partials/) ke SEMUA halaman,
      di antara penanda <!-- PARTIAL:header --> ... <!-- /PARTIAL:header -->
   3. Mengisi kartu kategori layanan di beranda, di antara
      <!-- GEN:category-cards --> ... <!-- /GEN:category-cards -->

   Jangan edit langsung file di layanan/ — akan tertimpa.
   Edit content/layanan.json atau templates/ lalu jalankan:
     node scripts/build.js
   Tanpa dependensi. Hanya butuh Node.js 14+.
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const data = JSON.parse(read("content/layanan.json"));
const seo = JSON.parse(read("seo/seo.config.json"));
const cats = data.categories;
const wa = (read("js/config.js").match(/whatsapp:\s*"(\d+)"/) || [])[1] || "";
const waUrl = (text) => "https://wa.me/" + wa + (text ? "?text=" + encodeURIComponent(text) : "");

/* ---------- Ikon (garis, 24x24) ---------- */
const ICONS = {
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3"/>',
  banner: '<path d="M4 5h16v10H4z"/><path d="M8 15v4M16 15v4M7 9h10M7 12h6"/>',
  billboard: '<rect x="3" y="4" width="18" height="11" rx="1"/><path d="M12 15v6M8 21h8M7 8h6M7 11h10"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h4"/>',
  brochure: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
  stamp: '<rect x="9" y="3" width="6" height="7" rx="1"/><path d="M5 14h14v3H5zM4 20h16"/>',
  sticker: '<path d="M4 5h16v10l-5 5H4z"/><path d="M15 20v-5h5"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  mug: '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8 4v1M12 4v1"/>',
  letters: '<path d="M4 19 9 5l5 14M6 14h6"/><path d="M17 7h3M18.5 7v12"/>',
  neon: '<rect x="4" y="6" width="16" height="12" rx="3"/><path d="M8 10h8M8 14h5M12 3v2M12 19v2"/>',
  signboard: '<path d="M5 4v16M19 4v16M5 7h14v8H5z"/><path d="M9 11h6"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  car: '<path d="M5 16v-5l2-5h10l2 5v5H5zM5 11h14"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
  build: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  stage: '<path d="M3 19h18M5 19V9h14v10M3 9l9-5 9 5"/>',
  sound: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  tent: '<path d="M3 19 12 5l9 14M12 5v14M7 19l5-9 5 9"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  food: '<path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7M8 3v7M17 3c-2 2-2 6 0 8v10"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1M16 5a3 3 0 0 1 0 6M18 14a4 4 0 0 1 3 4v1"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  printer: '<path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'
};
const warnings = [];
const svg = (name) => {
  if (!ICONS[name]) { warnings.push(`Ikon "${name}" tidak dikenal.`); name = "clipboard"; }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
};
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- Template sederhana: {{kunci}} ---------- */
function render(str, vars, file) {
  return str.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => {
    if (k in vars) return vars[k];
    warnings.push(`${file}: {{${k}}} tidak punya nilai.`);
    return m;
  });
}

/* ---------- Potongan HTML ---------- */
function itemCard(c, i) {
  const text = `Halo ADAM XII PRINTING, saya mau tanya soal ${i.title}.`;
  return `      <article class="card item-card reveal">
        <span class="icon">${svg(i.icon)}</span>
        <h3>${esc(i.title)}</h3>
        <p>${esc(i.desc)}</p>
        <a class="detail" data-wa data-wa-text="${esc(text)}" href="${esc(waUrl(text))}">Tanya lewat WhatsApp →</a>
      </article>`;
}

function categoryCard(c, root, n) {
  const href = `${root}layanan/${c.slug}/`;
  const chips = c.items.slice(0, n).map((i) => `<li>${esc(i.title)}</li>`).join("");
  const more = c.items.length > n ? `<li class="more">+${c.items.length - n} lainnya</li>` : "";
  return `      <article class="card cat-card reveal">
        <a class="cat-media img-slot" href="${href}" aria-label="Lihat layanan ${esc(c.title)}">
          <span class="cat-fallback">${svg(c.icon)}</span>
          <img src="${root}${c.image}" alt="Layanan ${esc(c.title)} ADAM XII PRINTING Sorong" width="800" height="500" loading="lazy">
        </a>
        <div class="cat-body">
          <span class="icon">${svg(c.icon)}</span>
          <h3><a href="${href}">${esc(c.title)}</a></h3>
          <p>${esc(c.tagline)}</p>
          <ul class="mini-chips">${chips}${more}</ul>
          <a class="btn btn-outline btn-sm" href="${href}">Lihat Layanan ${esc(c.title)} ${ARROW}</a>
        </div>
      </article>`;
}

function tabs(root, activeId) {
  const all = [{ label: "Semua", href: `${root}layanan/`, id: null }].concat(
    cats.map((c) => ({ label: c.title, href: `${root}layanan/${c.slug}/`, id: c.id }))
  );
  return all
    .map((t) => `<a class="chip"${t.id === activeId ? ' aria-current="page"' : ""} href="${t.href}">${esc(t.label)}</a>`)
    .join("\n      ");
}

/* ---------- Variabel header/footer per halaman ---------- */
function layoutVars(file, nav) {
  const root = "../".repeat(file.split("/").length - 1);
  const act = (k) => (nav === k ? ' class="active" aria-current="page"' : "");
  return {
    root,
    wa,
    href_beranda: root || "#beranda",
    href_tentang: root + "tentang/",
    href_blog: root + "blog/",
    href_layanan: root + "layanan/",
    href_galeri: root + "galeri/",
    href_proses: root + "#proses",
    act_beranda: act("beranda"),
    act_layanan: act("layanan"),
    act_galeri: act("galeri"),
    act_tentang: act("tentang"),
    act_blog: act("blog"),
    foot_services: cats.map((c) => `<a href="${root}layanan/${c.slug}/">${esc(c.title)}</a>`).join("\n      ")
  };
}

function inject(html, name, content, file, open, close) {
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a === -1 || b === -1) { warnings.push(`${file}: penanda ${open} tidak ditemukan.`); return html; }
  return html.slice(0, a + open.length) + "\n" + content + "\n" + html.slice(b);
}

/* ---------- 1. Buat halaman layanan dari template ---------- */
const pageByFile = (f) => seo.pages.find((p) => p.file === f);
const generated = [];

(function generate() {
  const hubFile = "layanan/index.html";
  if (!pageByFile(hubFile)) warnings.push(`${hubFile} belum ada di seo.config.json → "pages".`);
  const hubRoot = "../";
  write(
    hubFile,
    render(read("templates/layanan-hub.html"), {
      root: hubRoot,
      wa_url: waUrl("Halo ADAM XII PRINTING, saya ingin konsultasi dan minta penawaran harga."),
      tabs: tabs(hubRoot, null),
      cards: cats.map((c) => categoryCard(c, hubRoot, 6)).join("\n")
    }, hubFile)
  );
  generated.push(hubFile);

  cats.forEach((c) => {
    const file = `layanan/${c.slug}/index.html`;
    if (!pageByFile(file)) warnings.push(`${file} belum ada di seo.config.json → "pages".`);
    const root = "../../";
    write(
      file,
      render(read("templates/layanan-kategori.html"), {
        root,
        slug: c.slug,
        title: esc(c.title),
        lead: esc(c.lead),
        section_title: c.sectionTitle,
        section_lead: esc(c.sectionLead),
        cta_lead: esc(c.ctaLead),
        wa_url: waUrl(`Halo ADAM XII PRINTING, saya mau tanya layanan ${c.title}.`),
        tabs: tabs(root, c.id),
        items: c.items.map((i) => itemCard(c, i)).join("\n")
      }, file)
    );
    generated.push(file);
  });
})();

/* ---------- 2. Header & footer ke semua halaman ---------- */
const header = read("partials/header.html").trimEnd();
const footer = read("partials/footer.html").trimEnd();
seo.pages.forEach((p) => {
  let html = read(p.file);
  const v = layoutVars(p.file, p.nav);
  html = inject(html, "header", render(header, v, "partials/header.html"), p.file, "<!-- PARTIAL:header -->", "<!-- /PARTIAL:header -->");
  html = inject(html, "footer", render(footer, v, "partials/footer.html"), p.file, "<!-- PARTIAL:footer -->", "<!-- /PARTIAL:footer -->");
  write(p.file, html);
});

/* ---------- 3. Kartu kategori di beranda ---------- */
(function home() {
  let html = read("index.html");
  html = inject(
    html, "cards", cats.map((c) => categoryCard(c, "", 5)).join("\n"), "index.html",
    "<!-- GEN:category-cards -->", "<!-- /GEN:category-cards -->"
  );
  write("index.html", html);
})();

console.log("Halaman dibuat: " + generated.join(", "));
console.log("Header & footer diisi ke " + seo.pages.length + " halaman; kartu layanan diisi ke beranda.");
if (warnings.length) {
  console.log("\nCatatan:");
  warnings.forEach((w) => console.log("  - " + w));
}
