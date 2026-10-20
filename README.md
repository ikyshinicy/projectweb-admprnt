# ADAM XII PRINTING — Landing Page

Landing page statis (HTML, CSS, JS biasa) untuk ADAM XII PRINTING — Percetakan & Reklame Sorong. Tanpa framework, bisa di-upload ke hosting apa pun.

## Struktur

```
index.html            halaman utama
css/                  base (warna), layout, components, sections, responsive
js/config.js          nomor WhatsApp, alamat, jam buka, Instagram
js/main.js            menu mobile, nav aktif, animasi, link WhatsApp
seo/seo.config.json   SATU file kontrol SEO
scripts/build-seo.js  isi <head>, robots.txt, sitemap.xml, webmanifest
assets/images/        semua gambar, dikelompokkan per section
```

## Yang paling sering diedit

| Mau ubah | Edit file |
|---|---|
| Nomor WhatsApp, alamat, jam buka | `js/config.js` |
| Warna | `css/base.css` (hanya di sini) |
| Title, description, kata kunci, domain | `seo/seo.config.json` lalu `node scripts/build-seo.js` |
| Tampilan HP | `css/responsive.css` |
| Gambar | timpa file di `assets/images/` dengan nama yang sama |

## Daftar gambar yang dibutuhkan

```
assets/favicon.png                       512x512
assets/images/brand/logo.png
assets/images/hero/toko-hero.png
assets/images/layanan/kartu-nama.png
assets/images/layanan/brosur-flyer.png
assets/images/layanan/banner-spanduk.png
assets/images/layanan/stempel.png
assets/images/layanan/stiker.png
assets/images/layanan/huruf-timbul.png
assets/images/layanan/neonbox.png
assets/images/layanan/souvenir.png
assets/images/tentang/tentang-toko.png
assets/images/galeri/galeri-01.png ... galeri-06.png
assets/images/og/og-cover.jpg            1200x630 (preview link)
```

Kalau sebuah gambar belum ada, kotaknya tampil sebagai gradasi lembut, bukan ikon rusak.
Kalau ukuran asli gambar berbeda dari atribut `width`/`height` di `index.html`, sesuaikan angkanya (rasio yang benar mencegah layout bergeser saat memuat).

## Menjalankan di komputer

```bash
# server lokal sederhana
python3 -m http.server 8080
# buka http://localhost:8080
```

## SEO

```bash
node scripts/build-seo.js
```

Perintah ini menulis ulang blok `<head>` di `index.html` (antara penanda `SEO:START` dan `SEO:END`), `robots.txt`, `sitemap.xml`, dan `site.webmanifest`.

**Penting:** `indexing.allow` di `seo.config.json` bawaannya `false` (situs dikunci dari Google). Ubah ke `true` dan build ulang saat situs resmi online. Lihat `seo/CHECKLIST.md`.

## Deploy

Upload seluruh isi folder ini (kecuali `scripts/` dan `seo/` kalau mau) ke hosting. Untuk GitHub Pages / Vercel / Netlify: arahkan ke root folder, tidak perlu build command.
