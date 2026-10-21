# Catatan migrasi kategori konten

Saat memindahkan data lama dari `js/blog-data.js` ke `content/blog.json`, satu kategori artikel tidak sesuai dengan daftar kategori blog yang tersedia.

| Konten | Kategori lama | Kategori baru | Alasan |
|---|---|---|---|
| Festival Pesona Raja Ampat 2026 (artikel dari sorongraya.inews.id) | `Festival` | `event-organizer` | Daftar kategori blog yang tersedia adalah `tips-cetak`, `reklame`, dan `event-organizer`. Isi artikel membahas festival/acara, sehingga dipetakan ke kategori acara yang tersedia. |

Tidak ada kategori lain yang diubah. Semua video, artikel, grup galeri, kategori galeri, album, item foto/video, dan pengaturan situs dipertahankan dari data sumber saat migrasi.
