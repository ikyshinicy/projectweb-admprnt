# ADAM XII PRINTING — Landing Page

Landing page statis (HTML, CSS, JS biasa) untuk ADAM XII PRINTING — Percetakan & Reklame Sorong. Tanpa framework, bisa di-upload ke hosting apa pun.

## Struktur

```
index.html            beranda (3 kartu layanan + cuplikan galeri)
galeri/index.html     halaman galeri lengkap (filter + album)
layanan/              HASIL BUILD: /layanan/ + percetakan, reklame, event-organizer
content/layanan.json  isi semua halaman layanan (daftar layanan per kategori)
partials/             header & footer (ditulis sekali, dipasang ke semua halaman)
templates/            kerangka halaman layanan
css/                  base (warna), layout, components, sections, gallery, responsive
js/config.js          nomor WhatsApp, alamat, jam buka, Instagram
js/main.js            menu mobile, nav aktif, animasi, link WhatsApp
js/gallery-data.js    SEMUA isi galeri (album, kategori, foto)
js/gallery.js         kartu album + tampilan besar (geser foto)
seo/seo.config.json   SATU file kontrol SEO
scripts/build.js      jalankan SEMUA build (partials + SEO)
scripts/build-partials.js  buat halaman layanan, pasang header/footer
scripts/build-seo.js  isi <head>, robots.txt, sitemap.xml, webmanifest
assets/images/        semua gambar, dikelompokkan per section
```

## Yang paling sering diedit

| Mau ubah | Edit file |
|---|---|
| Nomor WhatsApp, alamat, jam buka | `js/config.js` |
| Warna | `css/base.css` (hanya di sini) |
| Daftar layanan (tambah/ubah/hapus) | `content/layanan.json` lalu `node scripts/build.js` |
| Menu atas / footer | `partials/header.html`, `partials/footer.html` lalu `node scripts/build.js` |
| Title, description, kata kunci, domain | `seo/seo.config.json` lalu `node scripts/build.js` |
| Tampilan HP | `css/responsive.css` |
| Gambar | timpa file di `assets/images/` dengan nama yang sama |

## Halaman layanan

Ada 3 kategori: Percetakan, Reklame, Event Organizer. Semua isinya ada di
`content/layanan.json` (judul, deskripsi, dan daftar layanan tiap kategori).
Setelah mengedit, jalankan `node scripts/build.js`. Jangan edit file di `layanan/`
langsung karena akan tertimpa. Gambar kartu kategori:
`assets/images/layanan/event-organizer.webp` (belum ada; sementara tampil ikon).

**Setiap kali mengubah menu/footer/daftar layanan, jalankan `node scripts/build.js`.**

## Galeri

Satu album = satu kartu. Klik kartu membuka tampilan besar berisi semua foto album itu
(geser / panah kiri-kanan). Semua diatur di `js/gallery-data.js`:

- tambah album: salin satu blok `{ ... }`, ubah `id`, `title`, `category`, dan daftar `photos`
- `featured: true` = ikut tampil di beranda (disarankan 6 saja)
- foto belum ada = otomatis tampil placeholder, tidak perlu ubah kode

## Daftar gambar yang dibutuhkan

```
assets/favicon.png                       512x512
assets/images/brand/logo.png
assets/images/hero/toko-hero.webp          (latar hero, dipakai lewat CSS)
assets/images/layanan/kartu-nama.webp
assets/images/layanan/brosur-flyer.webp
assets/images/layanan/banner-spanduk.webp
assets/images/layanan/stempel.webp
assets/images/layanan/stiker.webp
assets/images/layanan/huruf-timbul.webp
assets/images/layanan/neonbox.webp
assets/images/layanan/souvenir.webp
assets/images/layanan/event-organizer.webp
assets/images/tentang/tentang-toko.png
assets/images/galeri/<id-album>/1.webp, 2.webp, ...   (lihat js/gallery-data.js)
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
node scripts/build.js
```

Perintah ini (bagian SEO-nya) menulis ulang blok `<head>` di `index.html` (antara penanda `SEO:START` dan `SEO:END`), `robots.txt`, `sitemap.xml`, dan `site.webmanifest`.

**Penting:** `indexing.allow` di `seo.config.json` bawaannya `false` (situs dikunci dari Google). Ubah ke `true` dan build ulang saat situs resmi online. Lihat `seo/CHECKLIST.md`.

## Deploy

Upload seluruh isi folder ini (kecuali `scripts/` dan `seo/` kalau mau) ke hosting. Untuk GitHub Pages / Vercel / Netlify: arahkan ke root folder, tidak perlu build command.
