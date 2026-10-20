# Checklist SEO — ADAM XII PRINTING

## Sebelum online
- [ ] `seo/seo.config.json` → `site.url` diganti domain asli (tanpa `/` di akhir)
- [ ] `indexing.allow` diubah ke `true`
- [ ] Nomor telepon, alamat lengkap, jam buka, dan koordinat diisi (untuk schema bisnis lokal)
- [ ] `js/config.js` → nomor WhatsApp asli
- [ ] Gambar `assets/images/og/og-cover.jpg` ukuran 1200×630 sudah ada
- [ ] `assets/favicon.png` (512×512) sudah ada
- [ ] Semua gambar sudah dikompres (idealnya WebP, tiap file < 200 KB; hero < 300 KB)
- [ ] Jalankan `node scripts/build-seo.js` dan baca catatan yang muncul
- [ ] Title ≤ 60 karakter, description ≤ 160 karakter

## Setelah online
- [ ] Daftarkan situs di Google Search Console, isi kode verifikasi di `seo.config.json`, build ulang
- [ ] Kirim `sitemap.xml` di Search Console
- [ ] Cek schema di https://search.google.com/test/rich-results
- [ ] Cek preview link WhatsApp/Facebook (kirim link ke diri sendiri)
- [ ] Cek kecepatan di https://pagespeed.web.dev (target skor HP ≥ 90)
- [ ] Buat / lengkapi **Google Business Profile** (nama, alamat, jam, foto, kategori "Percetakan") — untuk bisnis lokal di Sorong ini biasanya paling berpengaruh
- [ ] Minta pelanggan menulis ulasan di Google Business Profile

## Rutin
- [ ] Update galeri dengan hasil kerja terbaru (beri nama file & alt yang deskriptif)
- [ ] Jalankan ulang `node scripts/build-seo.js` setiap mengubah `seo.config.json`
