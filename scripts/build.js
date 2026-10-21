#!/usr/bin/env node
/* ==========================================================
   build.js — jalankan SEMUA langkah build, berurutan:
     1. build-partials.js  (halaman layanan, header/footer, kartu beranda)
     2. build-seo.js       (<head> SEO, robots.txt, sitemap.xml, webmanifest)

   Pakai:  node scripts/build.js
   ========================================================== */
"use strict";

require("./build-partials.js");
console.log("");
require("./build-seo.js");
