#!/usr/bin/env node
/* ==========================================================
   build-seo.js
   Membaca seo/seo.config.json lalu menulis, untuk SETIAP halaman
   di "pages":
     - blok <head> SEO (antara penanda SEO:START dan SEO:END)
   dan untuk seluruh situs:
     - robots.txt, sitemap.xml, site.webmanifest
     - seo/schema-local-business.json (salinan, untuk referensi)

   Jalankan:  node scripts/build.js   (atau hanya SEO: node scripts/build-seo.js)
   Tanpa dependensi. Hanya butuh Node.js 14+.

   Catatan GitHub Pages: kalau alamat situs berupa
   https://nama.github.io/nama-repo , tulis lengkap beserta
   "/nama-repo" di site.url (tanpa garis miring di akhir).
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);

const cfg = JSON.parse(read("seo/seo.config.json"));
const { site, pages, social, indexing, verification, analytics, business } = cfg;
site.url = site.url.replace(/\/+$/, "");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (p) => (/^https?:\/\//.test(p) ? p : site.url + (p.startsWith("/") ? p : "/" + p));
const isEmpty = (v) =>
  v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0);

/* ---------- Peringatan ---------- */
const warnings = [];
if (site.url.includes("example.com")) warnings.push("site.url masih example.com — ganti dengan alamat situs asli.");
if (!indexing.allow) warnings.push("indexing.allow = false → situs TIDAK akan muncul di Google (mode pengembangan).");
if (isEmpty(business.telephone)) warnings.push("business.telephone kosong — schema bisnis lokal kurang lengkap.");
if (isEmpty(business.address.streetAddress)) warnings.push("business.address.streetAddress kosong.");
pages.forEach((p) => {
  if (p.title.length > 60) warnings.push(`[${p.path}] Title ${p.title.length} karakter (disarankan ≤ 60).`);
  if (p.description.length > 160) warnings.push(`[${p.path}] Description ${p.description.length} karakter (disarankan ≤ 160).`);
});

/* ---------- Schema ---------- */
function prune(obj) {
  if (Array.isArray(obj)) return obj.map(prune).filter((v) => !isEmpty(v));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue;
      const pv = prune(v);
      if (!isEmpty(pv) && !(typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length === 0)) out[k] = pv;
    }
    return out;
  }
  return obj;
}

const businessSchema = prune({
  "@context": "https://schema.org",
  "@type": business.type || "LocalBusiness",
  name: business.name,
  description: business.description,
  url: site.url + "/",
  telephone: business.telephone,
  email: business.email,
  priceRange: business.priceRange,
  logo: business.logo && abs(business.logo),
  image: business.image && abs(business.image),
  address: { "@type": "PostalAddress", ...business.address },
  geo:
    business.geo && business.geo.latitude != null && business.geo.longitude != null
      ? { "@type": "GeoCoordinates", latitude: business.geo.latitude, longitude: business.geo.longitude }
      : undefined,
  openingHours: business.openingHours,
  sameAs: business.sameAs,
  areaServed: { "@type": "City", name: business.address.addressLocality }
});

const content = JSON.parse(read("content/layanan.json"));
const ctx = "https://schema.org";
const crumbList = (p) => ({
  "@type": "BreadcrumbList",
  itemListElement: (p.crumbs || [["Beranda", "/"], [p.title, p.path]]).map((c, i) => ({
    "@type": "ListItem", position: i + 1, name: c[0], item: site.url + c[1]
  }))
});

// Halaman kumpulan (galeri, daftar layanan)
function collectionSchema(p) {
  return {
    "@context": ctx,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: p.title,
        description: p.description,
        url: site.url + p.path,
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url + "/" }
      },
      crumbList(p)
    ]
  };
}

// Halaman satu kategori layanan: daftar isinya jadi katalog penawaran
function serviceSchema(p) {
  const c = content.categories.find((x) => x.id === p.category);
  if (!c) { warnings.push(`[${p.path}] kategori "${p.category}" tidak ada di content/layanan.json.`); return collectionSchema(p); }
  return {
    "@context": ctx,
    "@graph": [
      {
        "@type": "Service",
        name: "Layanan " + c.title,
        serviceType: c.title,
        description: p.description,
        url: site.url + p.path,
        provider: { "@type": business.type || "LocalBusiness", name: business.name, url: site.url + "/" },
        areaServed: { "@type": "City", name: business.address.addressLocality },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Layanan " + c.title,
          itemListElement: c.items.map((i) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: i.title, description: i.desc }
          }))
        }
      },
      crumbList(p)
    ]
  };
}

/* ---------- Blok <head> per halaman ---------- */
const robotsContent = indexing.allow ? "index, follow, max-image-preview:large" : "noindex, nofollow";

function headBlock(p) {
  const canonical = site.url + p.path;
  const L = [];
  L.push(`<title>${esc(p.title)}</title>`);
  L.push(`<meta name="description" content="${esc(p.description)}">`);
  if (p.keywords && p.keywords.length) L.push(`<meta name="keywords" content="${esc(p.keywords.join(", "))}">`);
  L.push(`<meta name="robots" content="${robotsContent}">`);
  L.push(`<link rel="canonical" href="${esc(canonical)}">`);
  if (verification.googleSearchConsole)
    L.push(`<meta name="google-site-verification" content="${esc(verification.googleSearchConsole)}">`);
  L.push("");
  L.push("<!-- Open Graph (WhatsApp, Facebook, Instagram) -->");
  L.push(`<meta property="og:type" content="website">`);
  L.push(`<meta property="og:site_name" content="${esc(site.name)}">`);
  L.push(`<meta property="og:locale" content="${esc(site.locale)}">`);
  L.push(`<meta property="og:title" content="${esc(p.title)}">`);
  L.push(`<meta property="og:description" content="${esc(p.description)}">`);
  L.push(`<meta property="og:url" content="${esc(canonical)}">`);
  L.push(`<meta property="og:image" content="${esc(abs(social.ogImage))}">`);
  L.push(`<meta property="og:image:width" content="${social.ogImageWidth}">`);
  L.push(`<meta property="og:image:height" content="${social.ogImageHeight}">`);
  L.push(`<meta property="og:image:alt" content="${esc(social.ogImageAlt)}">`);
  L.push("");
  L.push("<!-- Twitter Card -->");
  L.push(`<meta name="twitter:card" content="${esc(social.twitterCard)}">`);
  L.push(`<meta name="twitter:title" content="${esc(p.title)}">`);
  L.push(`<meta name="twitter:description" content="${esc(p.description)}">`);
  L.push(`<meta name="twitter:image" content="${esc(abs(social.ogImage))}">`);
  L.push("");
  const schema = p.schema === "service" ? serviceSchema(p) : p.schema === "business" ? businessSchema : collectionSchema(p);
  L.push(p.schema === "business" ? "<!-- Schema.org: bisnis lokal -->" : "<!-- Schema.org: halaman layanan/galeri -->");
  L.push(`<script type="application/ld+json">`);
  L.push(JSON.stringify(schema, null, 2));
  L.push(`</script>`);
  if (analytics.googleAnalyticsId) {
    const id = esc(analytics.googleAnalyticsId);
    L.push("");
    L.push("<!-- Google Analytics -->");
    L.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    L.push(
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>`
    );
  }
  return L.join("\n");
}

const START = "<!-- SEO:START";
const END = "<!-- SEO:END -->";

pages.forEach((p) => {
  let html = read(p.file);
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s === -1 || e === -1) {
    console.error(`Penanda SEO:START / SEO:END tidak ditemukan di ${p.file}`);
    process.exit(1);
  }
  const startLineEnd = html.indexOf("-->", s) + 3;
  html = html.slice(0, startLineEnd) + "\n" + headBlock(p) + "\n" + html.slice(e);
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${site.language}"`);
  write(p.file, html);
});

/* ---------- robots.txt ---------- */
write(
  "robots.txt",
  indexing.allow
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`
);

/* ---------- sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages
      .map(
        (p) =>
          `  <url>\n    <loc>${site.url + p.path}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>monthly</changefreq>\n    <priority>${p.priority || "0.5"}</priority>\n  </url>\n`
      )
      .join("") +
    `</urlset>\n`
);

/* ---------- site.webmanifest (path relatif → aman di subfolder GitHub Pages) ---------- */
write(
  "site.webmanifest",
  JSON.stringify(
    {
      name: site.name,
      short_name: "ADAM XII",
      description: pages[0].description,
      start_url: "./",
      scope: "./",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: site.themeColor,
      lang: site.language,
      icons: [
        { src: "assets/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "assets/favicon.png", sizes: "512x512", type: "image/png" }
      ]
    },
    null,
    2
  ) + "\n"
);

/* ---------- Salinan schema ---------- */
write("seo/schema-local-business.json", JSON.stringify(businessSchema, null, 2) + "\n");

console.log("SEO selesai dibuat untuk " + pages.length + " halaman: " + pages.map((p) => p.path).join(", "));
console.log("  + robots.txt, sitemap.xml, site.webmanifest, seo/schema-local-business.json");
if (warnings.length) {
  console.log("\nCatatan:");
  warnings.forEach((w) => console.log("  - " + w));
}
