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
               kalau kosong, sampul diambil otomatis dari YouTube
     Video diputar langsung di halaman ini (tidak pindah ke YouTube).

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
  { title: "Judul Video 1", category: "tips-cetak",      url: "", desc: "Keterangan singkat video tampil di sini." },
  { title: "Judul Video 2", category: "reklame",         url: "", desc: "Keterangan singkat video tampil di sini." },
  { title: "Judul Video 3", category: "event-organizer", url: "", desc: "Keterangan singkat video tampil di sini." }

  /* Contoh isian jadi:
  { title: "Proses Pemasangan Neonbox", category: "reklame", url: "https://youtu.be/XXXXXXXXXXX", desc: "Tahap demi tahap pemasangan neonbox toko." },
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
