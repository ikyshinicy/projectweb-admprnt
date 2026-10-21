/* ==========================================================
   blog-data.js — SEMUA isi halaman Blog diatur di sini.

   Halaman Blog punya 2 bagian:
     ATAS   Video YouTube     → BLOG_VIDEOS
     BAWAH  Artikel dari web  → BLOG_ARTICLES (tautan ke situs lain)

   Cara menambah: salin satu blok { ... }, ubah isinya, simpan.
   Entri yang `url`-nya masih kosong tampil sebagai kotak "Segera hadir"
   (placeholder), jadi aman dibiarkan sampai linknya ada.

   ---------- VIDEO YouTube ----------
     title     judul video
     category  salah satu id di BLOG_CATEGORIES
     url       tempel link YouTube-nya. Diterima: youtu.be/..., youtube.com/watch?v=...,
               youtube.com/shorts/..., /embed/..., /live/...
               Mulai di detik tertentu: tambahkan ?t=90 di link.
     desc      (opsional) keterangan singkat
     thumb     (opsional) gambar sampul sendiri, mis. "assets/images/blog/video-1.webp";
               kalau kosong, sampul diambil otomatis dari YouTube (khusus YouTube)
     Video diputar langsung di halaman ini (tidak pindah ke YouTube).

     Instagram & TikTok juga bisa, tampil PORTRAIT (9:16) di baris sendiri di bawah video YouTube:
       Instagram  tempel link reel/post: instagram.com/reel/XXXX/ atau instagram.com/p/XXXX/
                  (akun harus publik; link profil @akun tidak bisa)
       TikTok     tempel link LENGKAP: tiktok.com/@akun/video/1234567890123456789
                  (link pendek vm.tiktok.com / vt.tiktok.com TIDAK bisa; buka dulu, lalu salin link lengkapnya)
       YouTube Shorts (youtube.com/shorts/...) otomatis ikut portrait.
     Instagram & TikTok tidak punya sampul otomatis: isi `thumb` sendiri
     (mis. "assets/images/blog/reel-1.webp"), kalau kosong tampil ikon placeholder.
     Catatan: setelah klik putar, pemutar Instagram/TikTok bisa minta klik putar sekali lagi.
     format    (opsional) paksa "portrait" atau "landscape", mis. untuk placeholder yang belum ada link.

   ---------- ARTIKEL dari web ----------
     title     judul artikel
     category  salah satu id di BLOG_CATEGORIES
     source    nama situs sumber, mis. "Kompas.com" (tampil di kartu)
     url       alamat artikel aslinya (dibuka di tab baru)
     excerpt   ringkasan 1-2 kalimat DENGAN KALIMAT SENDIRI (jangan salin teks aslinya)
     date      (opsional) tanggal terbit, mis. "12 Okt 2026"
     image     (opsional) sampul: file sendiri di assets/images/blog/ (disarankan)
               atau alamat https://... penuh. Kosong/gagal = placeholder.

   Mau kategori baru? Tambah satu baris di BLOG_CATEGORIES lalu pakai id-nya.
   Kategori jadi tombol filter di atas halaman (berlaku untuk video & artikel).
   ========================================================== */

window.BLOG_CATEGORIES = [
  { id: "tips-cetak",      label: "Tips Cetak" },
  { id: "reklame",         label: "Reklame" },
  { id: "event-organizer", label: "Event Organizer" }
];

window.BLOG_VIDEOS = [
  { title: "Festival Pesona Raja Ampat 2026", category: "event-organizer", url: "https://www.youtube.com/watch?v=K6zenWpcqUk", desc: "Festival Pesona Raja Ampat 2026: Ajang Promosi Wisata Bahari & Pelestarian Budaya" },
  { title: "Festival Pesona Raja Ampat & Gemarikan 2025", category: "event-organizer", url: "https://www.youtube.com/watch?v=ybjKaySWN_A", desc: "Festival Pesona Raja Ampat & Gemarikan 2025 hadir sebagai wujud kolaborasi budaya, pariwisata, dan edukasi gizi masyarakat. Melalui pertunjukan seni, kuliner lokal, dan kampanye makan ikan, festival ini mengangkat potensi Raja Ampat sebagai destinasi unggulan dan pusat ketahanan pangan laut." },
  { title: "AVC Raja Ampat 2026", category: "event-organizer", url: "https://www.instagram.com/reel/DWx-cFljh2z/?utm_source=ig_web_copy_link&cplk=NTc4MTIwNjQ2YQ==", desc: "Angel Clinic hadir langsung di AVC Beach Volleyball Raja Ampat." }

  /* Contoh isian jadi:
  { title: "Proses Pemasangan Neonbox", category: "reklame", url: "https://youtu.be/XXXXXXXXXXX", desc: "Tahap demi tahap pemasangan neonbox toko." },
  { title: "Reel Hasil Cetak Stiker", category: "tips-cetak", url: "https://www.instagram.com/reel/XXXXXXXXXXX/", thumb: "assets/images/blog/reel-1.webp", desc: "Reel singkat hasil cetak stiker." },
  { title: "TikTok Pemasangan Banner", category: "reklame", url: "https://www.tiktok.com/@akun/video/1234567890123456789", thumb: "assets/images/blog/tiktok-1.webp", desc: "Proses pemasangan banner." },
  */
];

window.BLOG_ARTICLES = [
  { title: "Judul Artikel 1", category: "tips-cetak",      source: "Nama Situs", url: "", date: "", image: "", excerpt: "Ringkasan artikel tampil di sini, cukup satu sampai dua kalimat dengan kalimat sendiri." },
  { title: "Judul Artikel 2", category: "reklame",         source: "Nama Situs", url: "", date: "", image: "", excerpt: "Ringkasan artikel tampil di sini, cukup satu sampai dua kalimat dengan kalimat sendiri." },
  { title: "Judul Artikel 3", category: "event-organizer", source: "Nama Situs", url: "", date: "", image: "", excerpt: "Ringkasan artikel tampil di sini, cukup satu sampai dua kalimat dengan kalimat sendiri." }

  /* Contoh isian jadi:
  { title: "Cara Memilih Bahan Banner", category: "tips-cetak", source: "Contoh.com", url: "https://contoh.com/artikel", date: "12 Okt 2026", image: "", excerpt: "Perbedaan bahan flexi dan albatros serta kapan dipakai." },
  */
];
