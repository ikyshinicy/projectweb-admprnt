#!/usr/bin/env node
/* ==========================================================
   build.js — Jalankan semua langkah build secara berurutan:
     1. build-data.js      (JSON menjadi berkas data JavaScript)
     2. build-partials.js  (halaman layanan, header/footer, kartu beranda)
     3. build-seo.js       (SEO, robots.txt, sitemap.xml, webmanifest)

   Pakai: node scripts/build.js
   ========================================================== */
"use strict";

require("./build-data.js");
console.log("");
require("./build-partials.js");
console.log("");
require("./build-seo.js");
