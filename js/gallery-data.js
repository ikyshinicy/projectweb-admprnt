/* ==========================================================
   gallery-data.js — SEMUA isi galeri diatur di sini.

   Satu entri = satu ALBUM (satu kartu). Klik kartu membuka
   tampilan besar berisi semua foto di album itu.

   Cara menambah album: salin satu blok { ... } lalu ubah isinya.
     id        nama unik tanpa spasi
     title     judul karya (tampil di kartu & tampilan besar)
     category  harus salah satu id di GALLERY_CATEGORIES
     featured  true = ikut tampil di beranda (disarankan 6 saja)
     photos    daftar foto; foto pertama jadi sampul
               (atau tulis `cover` sendiri)

   Foto belum ada? Tidak masalah — otomatis tampil placeholder.
   Saat file aslinya Anda taruh dengan nama yang sama, langsung
   muncul tanpa mengubah kode. Saran: WebP, lebar ~1600px.
   ========================================================== */

window.GALLERY_CATEGORIES = [
  { id: "kartu-nama",   label: "Kartu Nama" },
  { id: "brosur-flyer", label: "Brosur & Flyer" },
  { id: "banner",       label: "Banner & Spanduk" },
  { id: "stiker",       label: "Stiker" },
  { id: "neonbox",      label: "Neonbox" },
  { id: "huruf-timbul", label: "Huruf Timbul" },
  { id: "stempel",      label: "Stempel" },
  { id: "souvenir",     label: "Souvenir" }
];

window.GALLERY = [
  {
    id: "kartu-nama-01",
    title: "Kartu Nama Premium",
    category: "kartu-nama",
    featured: true,
    photos: [
      { src: "assets/images/galeri/kartu-nama-01/1.webp", alt: "Tumpukan kartu nama premium hasil cetak ADAM XII PRINTING" },
      { src: "assets/images/galeri/kartu-nama-01/2.webp", alt: "Kartu nama dua sisi dengan finishing laminasi" },
      { src: "assets/images/galeri/kartu-nama-01/3.webp", alt: "Kartu nama dalam tempat kartu" }
    ]
  },
  {
    id: "brosur-flyer-01",
    title: "Brosur Promosi Usaha",
    category: "brosur-flyer",
    featured: true,
    photos: [
      { src: "assets/images/galeri/brosur-flyer-01/1.webp", alt: "Brosur lipat tiga untuk promosi usaha" },
      { src: "assets/images/galeri/brosur-flyer-01/2.webp", alt: "Flyer A5 full color" },
      { src: "assets/images/galeri/brosur-flyer-01/3.webp", alt: "Brosur sisi dalam" }
    ]
  },
  {
    id: "banner-acara-01",
    title: "Backdrop & Banner Acara",
    category: "banner",
    featured: true,
    photos: [
      { src: "assets/images/galeri/banner-acara-01/1.webp", alt: "Backdrop acara dengan cetak banner besar" },
      { src: "assets/images/galeri/banner-acara-01/2.webp", alt: "Spanduk outdoor terpasang" },
      { src: "assets/images/galeri/banner-acara-01/3.webp", alt: "X-banner dan roll-up banner" },
      { src: "assets/images/galeri/banner-acara-01/4.webp", alt: "Detail hasil cetak banner" }
    ]
  },
  {
    id: "stiker-01",
    title: "Stiker Label Produk",
    category: "stiker",
    featured: true,
    photos: [
      { src: "assets/images/galeri/stiker-01/1.webp", alt: "Gulungan stiker label produk" },
      { src: "assets/images/galeri/stiker-01/2.webp", alt: "Stiker vinyl potong kontur" },
      { src: "assets/images/galeri/stiker-01/3.webp", alt: "Stiker transparan pada kemasan" }
    ]
  },
  {
    id: "neonbox-01",
    title: "Neonbox Toko",
    category: "neonbox",
    featured: true,
    photos: [
      { src: "assets/images/galeri/neonbox-01/1.webp", alt: "Neonbox bulat outdoor menyala" },
      { src: "assets/images/galeri/neonbox-01/2.webp", alt: "Neonbox tampak siang hari" },
      { src: "assets/images/galeri/neonbox-01/3.webp", alt: "Neonbox saat malam" },
      { src: "assets/images/galeri/neonbox-01/4.webp", alt: "Proses pemasangan neonbox" }
    ]
  },
  {
    id: "huruf-timbul-01",
    title: "Huruf Timbul Akrilik",
    category: "huruf-timbul",
    featured: true,
    photos: [
      { src: "assets/images/galeri/huruf-timbul-01/1.webp", alt: "Huruf timbul akrilik warna oranye" },
      { src: "assets/images/galeri/huruf-timbul-01/2.webp", alt: "Huruf timbul stainless untuk papan nama" },
      { src: "assets/images/galeri/huruf-timbul-01/3.webp", alt: "Huruf timbul terpasang di dinding" }
    ]
  },
  {
    id: "stempel-01",
    title: "Stempel Otomatis",
    category: "stempel",
    featured: false,
    photos: [
      { src: "assets/images/galeri/stempel-01/1.webp", alt: "Stempel otomatis warna merah" },
      { src: "assets/images/galeri/stempel-01/2.webp", alt: "Hasil cap stempel instansi" },
      { src: "assets/images/galeri/stempel-01/3.webp", alt: "Stempel manual dan otomatis" }
    ]
  },
  {
    id: "souvenir-01",
    title: "Souvenir Custom",
    category: "souvenir",
    featured: false,
    photos: [
      { src: "assets/images/galeri/souvenir-01/1.webp", alt: "Mug custom dengan logo" },
      { src: "assets/images/galeri/souvenir-01/2.webp", alt: "Topi dan kaos custom" },
      { src: "assets/images/galeri/souvenir-01/3.webp", alt: "Tumbler custom" }
    ]
  }
];
