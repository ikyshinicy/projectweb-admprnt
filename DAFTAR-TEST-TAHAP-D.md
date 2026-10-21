# Daftar Tes Pra-Peluncuran — ADAM XII PRINTING

Catat hasil tiap tes sebagai **Lulus**, **Gagal**, atau **Belum diuji**.

| No. | Pengujian | Hasil yang diharapkan | Status |
|---:|---|---|---|
| 1 | Login dengan kata sandi salah | HTTP 401; panel tidak terbuka | Belum diuji |
| 2 | Login dengan kata sandi benar | HTTP 200 dan cookie sesi HttpOnly/Secure/SameSite=Strict | Belum diuji |
| 3 | Akses `GET /api/content` tanpa cookie | HTTP 401 | Belum diuji |
| 4 | Akses `GET /api/session` sesudah logout | HTTP 401 | Belum diuji |
| 5 | Login gagal berulang | Permintaan dibatasi pada instance yang sama; HTTP 429 setelah batas tercapai | Belum diuji |
| 6 | Unggah WebP/JPEG/PNG valid | URL publik R2 dikembalikan dan gambar bisa dibuka | Belum diuji |
| 7 | Unggah file palsu/non-gambar | Ditolak server | Belum diuji |
| 8 | Unggah lebih dari 2 MB | Ditolak server | Belum diuji |
| 9 | Unggah dengan folder di luar daftar putih | Ditolak server | Belum diuji |
| 10 | Tautan video yang didukung | Platform dikenali dan data lolos validasi | Belum diuji |
| 11 | Tautan video tidak didukung | Ditolak dengan pesan jelas | Belum diuji |
| 12 | Konten wajib kosong / ID ganda | Ditolak validasi server | Belum diuji |
| 13 | Terbitkan perubahan beberapa file | Satu commit berisi file konten yang berubah dan build Vercel berjalan | Belum diuji |
| 14 | Konflik versi dari dua panel | Permintaan kedua mendapat HTTP 409 dan tidak menimpa perubahan | Belum diuji |
| 15 | Origin berbeda pada permintaan perubahan | Ditolak HTTP 403 | Belum diuji |
| 16 | Build lokal | `node scripts/build.js` selesai tanpa error | Belum diuji |
| 17 | Kompatibilitas data hasil build | Nama global dan bentuk objek tetap kompatibel dengan JS frontend | Belum diuji |
| 18 | Header `/admin` dan `/api` | `X-Robots-Tag: noindex`, `Cache-Control: no-store`, `X-Frame-Options: DENY` | Belum diuji |
| 19 | SEO halaman publik | `robots.txt` tidak memblokir seluruh situs bila siap diindeks; `/admin` dan `/api` tetap dikecualikan | Belum diuji |
| 20 | Perubahan tampil di situs publik | Konten baru tampil setelah build deployment selesai | Belum diuji |

Tes integrasi dengan GitHub, Vercel, dan R2 memerlukan environment variables asli yang dikonfigurasi di akun pemilik. Tes tersebut tidak dapat dianggap lulus hanya dari pemeriksaan lokal.
