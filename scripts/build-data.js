#!/usr/bin/env node
/* ==========================================================
   build-data.js — Membuat berkas data JavaScript dari sumber JSON.
   Ubah konten melalui sumber JSON; berkas js/*-data.js dibuat otomatis.
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function bacaJson(relPath) {
  const fullPath = path.join(ROOT, relPath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (err) {
    throw new Error("Gagal membaca " + relPath + ": " + err.message);
  }
}

function tulis(relPath, isi) {
  fs.writeFileSync(path.join(ROOT, relPath), isi, "utf8");
  console.log("Dibuat: " + relPath);
}

function dataGlobal(namaFile, komentar, pasangan) {
  let hasil = "/* FILE INI DIBUAT OTOMATIS, ubah lewat /admin. Jangan edit langsung. */\n";
  hasil += "/* " + komentar + " */\n\n";
  for (const [namaGlobal, nilai] of pasangan) {
    hasil += "window." + namaGlobal + " = " + JSON.stringify(nilai, null, 2) + ";\n\n";
  }
  tulis(namaFile, hasil);
}

function validasiDasar(blog, galeri, situs, layanan) {
  if (!blog || !Array.isArray(blog.categories) || !Array.isArray(blog.videos) || !Array.isArray(blog.articles)) {
    throw new Error("content/blog.json harus memiliki categories, videos, dan articles berbentuk daftar.");
  }
  if (!galeri || !Array.isArray(galeri.groups) || !Array.isArray(galeri.categories) || !Array.isArray(galeri.albums)) {
    throw new Error("content/gallery.json harus memiliki groups, categories, dan albums berbentuk daftar.");
  }
  if (!situs || typeof situs !== "object" || Array.isArray(situs)) {
    throw new Error("content/site.json harus berupa objek pengaturan situs.");
  }
  if (!layanan || !Array.isArray(layanan.categories)) {
    throw new Error("content/layanan.json harus memiliki categories berbentuk daftar.");
  }

  const kategoriBlog = new Set(blog.categories.map((x) => x.id));
  for (const [jenis, daftar] of [["video blog", blog.videos], ["artikel blog", blog.articles]]) {
    for (const item of daftar) {
      if (!kategoriBlog.has(item.category)) {
        throw new Error("Kategori tidak terdaftar pada " + jenis + ": " + String(item.title || "(tanpa judul)") + " — " + String(item.category));
      }
    }
  }

  const kategoriGaleri = new Set(galeri.categories.map((x) => x.id));
  const grupGaleri = new Set(galeri.groups.map((x) => x.id));
  for (const kategori of galeri.categories) {
    if (!grupGaleri.has(kategori.group)) {
      throw new Error("Grup galeri tidak terdaftar untuk kategori: " + String(kategori.id));
    }
  }
  for (const album of galeri.albums) {
    if (!kategoriGaleri.has(album.category)) {
      throw new Error("Kategori tidak terdaftar pada album galeri: " + String(album.title || album.id));
    }
  }
}

function main() {
  const blog = bacaJson("content/blog.json");
  const galeri = bacaJson("content/gallery.json");
  const situs = bacaJson("content/site.json");
  const layanan = bacaJson("content/layanan.json");
  validasiDasar(blog, galeri, situs, layanan);

  dataGlobal("js/blog-data.js", "Data blog berasal dari content/blog.json.", [
    ["BLOG_CATEGORIES", blog.categories],
    ["BLOG_VIDEOS", blog.videos],
    ["BLOG_ARTICLES", blog.articles]
  ]);
  dataGlobal("js/gallery-data.js", "Data galeri berasal dari content/gallery.json.", [
    ["GALLERY_GROUPS", galeri.groups],
    ["GALLERY_CATEGORIES", galeri.categories],
    ["GALLERY", galeri.albums]
  ]);
  dataGlobal("js/config.js", "Pengaturan situs berasal dari content/site.json.", [
    ["SITE_CONFIG", situs]
  ]);
  console.log("Build data selesai.");
}

try {
  main();
} catch (err) {
  console.error("Build data gagal: " + err.message);
  process.exitCode = 1;
}
