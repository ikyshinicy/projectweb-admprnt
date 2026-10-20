#!/usr/bin/env node
/* ==========================================================
   build-seo.js
   Membaca seo/seo.config.json lalu menulis:
     - blok <head> SEO di index.html (antara SEO:START dan SEO:END)
     - seo/schema-local-business.json (salinan schema, untuk referensi)
     - robots.txt
     - sitemap.xml
     - site.webmanifest
   Jalankan:  node scripts/build-seo.js
   Tanpa dependensi. Hanya butuh Node.js 14+.
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);

const cfg = JSON.parse(read("seo/seo.config.json"));
const { site, page, social, indexing, verification, analytics, business } = cfg;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (p) => (/^https?:\/\//.test(p) ? p : site.url + (p.startsWith("/") ? p : "/" + p));
const isEmpty = (v) =>
  v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0);

/* ---------- Peringatan ---------- */
const warnings = [];
if (site.url.includes("example.com")) warnings.push("site.url masih example.com — ganti dengan domain asli.");
if (page.title.length > 60) warnings.push(`Title ${page.title.length} karakter (disarankan ≤ 60).`);
if (page.description.length > 160) warnings.push(`Description ${page.description.length} karakter (disarankan ≤ 160).`);
if (!indexing.allow) warnings.push("indexing.allow = false → situs TIDAK akan muncul di Google (mode pengembangan).");
if (isEmpty(business.telephone)) warnings.push("business.telephone kosong — schema bisnis lokal kurang lengkap.");
if (isEmpty(business.address.streetAddress)) warnings.push("business.address.streetAddress kosong.");

/* ---------- Schema LocalBusiness (field kosong dibuang) ---------- */
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

const schema = prune({
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

/* ---------- Blok <head> ---------- */
const canonical = site.url + page.path;
const robotsContent = indexing.allow
  ? "index, follow, max-image-preview:large"
  : "noindex, nofollow";

const lines = [];
lines.push(`<title>${esc(page.title)}</title>`);
lines.push(`<meta name="description" content="${esc(page.description)}">`);
if (page.keywords.length) lines.push(`<meta name="keywords" content="${esc(page.keywords.join(", "))}">`);
lines.push(`<meta name="robots" content="${robotsContent}">`);
lines.push(`<link rel="canonical" href="${esc(canonical)}">`);
if (verification.googleSearchConsole)
  lines.push(`<meta name="google-site-verification" content="${esc(verification.googleSearchConsole)}">`);
lines.push("");
lines.push("<!-- Open Graph (WhatsApp, Facebook, Instagram) -->");
lines.push(`<meta property="og:type" content="website">`);
lines.push(`<meta property="og:site_name" content="${esc(site.name)}">`);
lines.push(`<meta property="og:locale" content="${esc(site.locale)}">`);
lines.push(`<meta property="og:title" content="${esc(page.title)}">`);
lines.push(`<meta property="og:description" content="${esc(page.description)}">`);
lines.push(`<meta property="og:url" content="${esc(canonical)}">`);
lines.push(`<meta property="og:image" content="${esc(abs(social.ogImage))}">`);
lines.push(`<meta property="og:image:width" content="${social.ogImageWidth}">`);
lines.push(`<meta property="og:image:height" content="${social.ogImageHeight}">`);
lines.push(`<meta property="og:image:alt" content="${esc(social.ogImageAlt)}">`);
lines.push("");
lines.push("<!-- Twitter Card -->");
lines.push(`<meta name="twitter:card" content="${esc(social.twitterCard)}">`);
lines.push(`<meta name="twitter:title" content="${esc(page.title)}">`);
lines.push(`<meta name="twitter:description" content="${esc(page.description)}">`);
lines.push(`<meta name="twitter:image" content="${esc(abs(social.ogImage))}">`);
lines.push("");
lines.push("<!-- Schema.org: bisnis lokal -->");
lines.push(`<script type="application/ld+json">`);
lines.push(JSON.stringify(schema, null, 2));
lines.push(`</script>`);
if (analytics.googleAnalyticsId) {
  const id = esc(analytics.googleAnalyticsId);
  lines.push("");
  lines.push("<!-- Google Analytics -->");
  lines.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
  lines.push(
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>`
  );
}

const START = "<!-- SEO:START";
const END = "<!-- SEO:END -->";
let html = read("index.html");
const s = html.indexOf(START);
const e = html.indexOf(END);
if (s === -1 || e === -1) {
  console.error("Penanda SEO:START / SEO:END tidak ditemukan di index.html");
  process.exit(1);
}
const startLineEnd = html.indexOf("-->", s) + 3;
html =
  html.slice(0, startLineEnd) +
  "\n" +
  lines.join("\n") +
  "\n" +
  html.slice(e);
html = html.replace(/<html lang="[^"]*"/, `<html lang="${site.language}"`);
write("index.html", html);

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
    `  <url>\n    <loc>${canonical}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n` +
    `</urlset>\n`
);

/* ---------- site.webmanifest ---------- */
write(
  "site.webmanifest",
  JSON.stringify(
    {
      name: site.name,
      short_name: "ADAM XII",
      description: page.description,
      start_url: "/",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: site.themeColor,
      lang: site.language,
      icons: [{ src: "/assets/favicon.png", sizes: "512x512", type: "image/png" }]
    },
    null,
    2
  ) + "\n"
);

/* ---------- Salinan schema ---------- */
write("seo/schema-local-business.json", JSON.stringify(schema, null, 2) + "\n");

console.log("SEO selesai dibuat:");
console.log("  index.html (<head>), robots.txt, sitemap.xml, site.webmanifest, seo/schema-local-business.json");
if (warnings.length) {
  console.log("\nCatatan:");
  warnings.forEach((w) => console.log("  - " + w));
}
