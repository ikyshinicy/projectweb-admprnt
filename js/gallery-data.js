/* ==========================================================
   gallery-data.js — SEMUA isi galeri diatur di sini.

   Satu entri = satu ALBUM (satu kartu). Klik kartu membuka
   tampilan besar berisi semua FOTO dan VIDEO di album itu.

   Cara menambah album: salin satu blok { ... } lalu ubah isinya.
     id        nama unik tanpa spasi
     title     judul karya (tampil di kartu & tampilan besar)
     category  harus salah satu id di GALLERY_CATEGORIES
               (bidangnya — Percetakan/Reklame/EO — ikut dari kategori)
     featured  true = ikut tampil di beranda (disarankan 6 saja)
     items     daftar foto/video; item pertama jadi sampul
               (atau tulis `cover` sendiri)
               (nama lama `photos` masih dikenali)

   Isi `items` — dua jenis, boleh dicampur dalam satu album:

     FOTO
       { type: "photo", src: "assets/images/galeri/xxx/1.webp", alt: "..." }
       (tanpa `type` pun dianggap foto; `src` boleh https://... penuh)

     VIDEO YouTube (cukup tempel link-nya)
       { type: "video", url: "https://youtu.be/XXXXXXXXXXX", title: "..." }
       Link yang diterima: youtu.be/..., youtube.com/watch?v=...,
       youtube.com/shorts/..., /embed/..., /live/...
       Mulai di detik tertentu: tambahkan ?t=90 di link.
       Thumbnail diambil otomatis dari YouTube. Mau gambar sendiri?
       Tambahkan  thumb: "assets/images/galeri/xxx/video.webp"
       Video diputar langsung di situs (tidak pindah ke YouTube).

   Foto belum ada? Tidak masalah — otomatis tampil placeholder.
   Saat file aslinya Anda taruh dengan nama yang sama, langsung
   muncul tanpa mengubah kode. Saran: WebP, lebar ~1600px.
   ========================================================== */

/* Bidang usaha = tab di halaman /galeri/ (id sama dengan halaman /layanan/).
   Tab bisa dibuka langsung lewat  galeri/#percetakan  galeri/#reklame  galeri/#event-organizer */
window.GALLERY_GROUPS = [
  { id: "percetakan",      label: "Percetakan" },
  { id: "reklame",         label: "Reklame" },
  { id: "event-organizer", label: "Event Organizer" }
];

/* Kategori = chip di dalam tab. `group` harus salah satu id di GALLERY_GROUPS.
   Chip hanya muncul kalau bidang itu punya 2 kategori atau lebih yang sudah berisi album. */
window.GALLERY_CATEGORIES = [
  { id: "kartu-nama",   label: "Kartu Nama",       group: "percetakan" },
  { id: "brosur-flyer", label: "Brosur & Flyer",   group: "percetakan" },
  { id: "stiker",       label: "Stiker",           group: "percetakan" },
  { id: "stempel",      label: "Stempel",          group: "percetakan" },
  { id: "souvenir",     label: "Souvenir",         group: "percetakan" },
  { id: "banner",       label: "Banner & Spanduk", group: "reklame" },
  { id: "neonbox",      label: "Neonbox",          group: "reklame" },
  { id: "huruf-timbul", label: "Huruf Timbul",     group: "reklame" },
  { id: "pernikahan",   label: "Pernikahan & Keluarga",      group: "event-organizer" },
  { id: "seminar",      label: "Seminar & Launching",        group: "event-organizer" },
  { id: "gathering",    label: "Gathering & Acara Instansi", group: "event-organizer" }
];

window.GALLERY = [
  {
    id: "kartu-nama-01",
    title: "Kartu Nama Premium",
    category: "kartu-nama",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/kartu-nama-01/1.webp", alt: "Tumpukan kartu nama premium hasil cetak ADAM XII PRINTING" },
      { type: "photo", src: "assets/images/galeri/kartu-nama-01/2.webp", alt: "Kartu nama dua sisi dengan finishing laminasi" },
      { type: "photo", src: "assets/images/galeri/kartu-nama-01/3.webp", alt: "Kartu nama dalam tempat kartu" }
    ]
  },
  {
    id: "brosur-flyer-01",
    title: "Brosur Promosi Usaha",
    category: "brosur-flyer",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/brosur-flyer-01/1.webp", alt: "Brosur lipat tiga untuk promosi usaha" },
      { type: "photo", src: "assets/images/galeri/brosur-flyer-01/2.webp", alt: "Flyer A5 full color" },
      { type: "photo", src: "assets/images/galeri/brosur-flyer-01/3.webp", alt: "Brosur sisi dalam" }
    ]
  },
  {
    id: "banner-acara-01",
    title: "Backdrop & Banner Acara",
    category: "banner",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/banner-acara-01/1.webp", alt: "Backdrop acara dengan cetak banner besar" },
      { type: "photo", src: "assets/images/galeri/banner-acara-01/2.webp", alt: "Spanduk outdoor terpasang" },
      { type: "photo", src: "assets/images/galeri/banner-acara-01/3.webp", alt: "X-banner dan roll-up banner" },
      { type: "photo", src: "assets/images/galeri/banner-acara-01/4.webp", alt: "Detail hasil cetak banner" }
    ]
  },
  {
    id: "stiker-01",
    title: "Stiker Label Produk",
    category: "stiker",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/stiker-01/1.webp", alt: "Gulungan stiker label produk" },
      { type: "photo", src: "assets/images/galeri/stiker-01/2.webp", alt: "Stiker vinyl potong kontur" },
      { type: "photo", src: "assets/images/galeri/stiker-01/3.webp", alt: "Stiker transparan pada kemasan" }
    ]
  },
  {
    id: "neonbox-01",
    title: "Neonbox Toko",
    category: "neonbox",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/neonbox-01/1.webp", alt: "Neonbox bulat outdoor menyala" },
      { type: "photo", src: "assets/images/galeri/neonbox-01/2.webp", alt: "Neonbox tampak siang hari" },
      { type: "photo", src: "assets/images/galeri/neonbox-01/3.webp", alt: "Neonbox saat malam" },
      { type: "photo", src: "assets/images/galeri/neonbox-01/4.webp", alt: "Proses pemasangan neonbox" }
    ]
  },
  {
    id: "huruf-timbul-01",
    title: "Huruf Timbul Akrilik",
    category: "huruf-timbul",
    featured: true,
    items: [
      { type: "photo", src: "assets/images/galeri/huruf-timbul-01/1.webp", alt: "Huruf timbul akrilik warna oranye" },
      { type: "photo", src: "assets/images/galeri/huruf-timbul-01/2.webp", alt: "Huruf timbul stainless untuk papan nama" },
      { type: "photo", src: "assets/images/galeri/huruf-timbul-01/3.webp", alt: "Huruf timbul terpasang di dinding" }
    ]
  },
  {
    id: "stempel-01",
    title: "Stempel Otomatis",
    category: "stempel",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/stempel-01/1.webp", alt: "Stempel otomatis warna merah" },
      { type: "photo", src: "assets/images/galeri/stempel-01/2.webp", alt: "Hasil cap stempel instansi" },
      { type: "photo", src: "assets/images/galeri/stempel-01/3.webp", alt: "Stempel manual dan otomatis" }
    ]
  },
  {
    id: "souvenir-01",
    title: "Souvenir Custom",
    category: "souvenir",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/souvenir-01/1.webp", alt: "Mug custom dengan logo" },
      { type: "photo", src: "assets/images/galeri/souvenir-01/2.webp", alt: "Topi dan kaos custom" },
      { type: "photo", src: "assets/images/galeri/souvenir-01/3.webp", alt: "Tumbler custom" }
    ]
  },
  {
    id: "pernikahan-01",
    title: "Dekorasi Pelaminan & Resepsi",
    category: "pernikahan",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/pernikahan-01/1.webp", alt: "Pelaminan dengan dekorasi bunga dan lampu" },
      { type: "photo", src: "assets/images/galeri/pernikahan-01/2.webp", alt: "Meja tamu dan dekorasi pintu masuk resepsi" },
      { type: "photo", src: "assets/images/galeri/pernikahan-01/3.webp", alt: "Tenda dan kursi tamu resepsi pernikahan" }
    ]
  },
  {
    id: "syukuran-01",
    title: "Syukuran & Ulang Tahun",
    category: "pernikahan",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/syukuran-01/1.webp", alt: "Dekorasi backdrop ulang tahun keluarga" },
      { type: "photo", src: "assets/images/galeri/syukuran-01/2.webp", alt: "Tata meja dan kursi acara syukuran" },
      { type: "photo", src: "assets/images/galeri/syukuran-01/3.webp", alt: "Dokumentasi acara keluarga" }
    ]
  },
  {
    id: "seminar-01",
    title: "Seminar & Workshop",
    category: "seminar",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/seminar-01/1.webp", alt: "Panggung seminar dengan backdrop dan podium" },
      { type: "photo", src: "assets/images/galeri/seminar-01/2.webp", alt: "Peserta seminar duduk rapi dalam ruangan" },
      { type: "photo", src: "assets/images/galeri/seminar-01/3.webp", alt: "Sound system dan layar presentasi" }
    ]
  },
  {
    id: "launching-01",
    title: "Peluncuran Produk",
    category: "seminar",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/launching-01/1.webp", alt: "Panggung peluncuran dengan lighting" },
      { type: "photo", src: "assets/images/galeri/launching-01/2.webp", alt: "Backdrop peluncuran produk" },
      { type: "photo", src: "assets/images/galeri/launching-01/3.webp", alt: "MC membuka acara launching" }
    ]
  },
  {
    id: "gathering-01",
    title: "Gathering Perusahaan",
    category: "gathering",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/gathering-01/1.webp", alt: "Tenda dan area gathering outdoor" },
      { type: "photo", src: "assets/images/galeri/gathering-01/2.webp", alt: "Hiburan dan MC di acara gathering" },
      { type: "photo", src: "assets/images/galeri/gathering-01/3.webp", alt: "Konsumsi dan catering untuk peserta" }
    ]
  },
  {
    id: "acara-instansi-01",
    title: "Acara Instansi & Pemerintahan",
    category: "gathering",
    featured: false,
    items: [
      { type: "photo", src: "assets/images/galeri/acara-instansi-01/1.webp", alt: "Panggung acara resmi instansi" },
      { type: "photo", src: "assets/images/galeri/acara-instansi-01/2.webp", alt: "Tenda dan kursi tamu undangan" },
      { type: "photo", src: "assets/images/galeri/acara-instansi-01/3.webp", alt: "Dokumentasi foto acara instansi" }
    ]
  }
];
