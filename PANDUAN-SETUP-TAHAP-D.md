# Panduan Setup Tahap D — ADAM XII PRINTING

Panduan ini untuk menyiapkan panel admin di Vercel, GitHub, dan Cloudflare R2. Lakukan berurutan. Jangan masukkan token, kata sandi, atau kunci rahasia ke file frontend atau ke GitHub.

## 0. Siapkan repository

1. Unduh ZIP Tahap C/Tahap D, lalu ekstrak di komputer.
2. Buka folder `projectweb-admprnt-main`. **Isi folder ini** yang harus berada di root repository GitHub, sehingga `index.html`, `api/`, `admin/`, `content/`, `lib/`, dan `scripts/` terlihat langsung di root repo. Jangan sampai website berada satu folder terlalu dalam.
3. Commit dan push semua file ke repository GitHub pribadi untuk situs ini, branch `main` (atau branch yang memang akan digunakan).
4. Pastikan folder `node_modules` tidak ada. Project ini tidak memerlukan `npm install`; build dijalankan dengan Node.js melalui `node scripts/build.js`.

## 1. Buat GitHub fine-grained personal access token

1. Masuk GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Beri nama yang jelas, misalnya `adam-xii-vercel-admin`. Pilih masa berlaku sesingkat yang masih praktis untuk pengelolaan situs.
3. **Resource owner**: akun/organisasi pemilik repository. **Repository access**: pilih **Only select repositories**, lalu pilih repository ADAM XII PRINTING saja.
4. **Repository permissions**: beri **Contents: Read and write**. Tidak perlu memberi izin administrasi repository, Actions, Issues, atau permission lain.
5. Buat token dan salin sekali ke pengelola rahasia. Jangan kirim token lewat chat, jangan taruh di `admin.js`, dan jangan commit token ke repo.
6. Catat nama akun/organisasi sebagai `GITHUB_OWNER`, nama repository sebagai `GITHUB_REPO`, dan nama branch sebagai `GITHUB_BRANCH`.

## 2. Buat bucket Cloudflare R2

1. Masuk Cloudflare Dashboard → **R2 Object Storage** → buat bucket baru, misalnya `adam-xii-media`. Nama bucket bebas selama sama persis dengan nilai yang nanti dimasukkan ke Vercel.
2. Buka pengaturan bucket dan siapkan akses publik untuk objek gambar. Untuk produksi, lebih baik hubungkan **custom domain** milikmu ke bucket daripada mengandalkan URL sementara. URL publik harus bisa membuka objek gambar melalui HTTPS.
3. Di R2, buat **S3 API token / R2 access keys** dengan izin **Object Read & Write** yang dibatasi ke bucket ADAM XII PRINTING ini saja. Jangan berikan akses ke semua bucket jika tidak diperlukan.
4. Simpan **Access Key ID** dan **Secret Access Key** saat dibuat; secret biasanya hanya ditampilkan sekali. Ambil **Account ID** Cloudflare dari dashboard.
5. Nilai untuk Vercel:
   - `R2_ACCOUNT_ID`: Account ID Cloudflare.
   - `R2_ACCESS_KEY_ID`: Access Key ID dari R2.
   - `R2_SECRET_ACCESS_KEY`: Secret Access Key dari R2.
   - `R2_BUCKET`: nama bucket persis.
   - `R2_PUBLIC_URL`: URL dasar publik HTTPS tanpa garis miring di akhir, misalnya `https://media.domainmu.id` (gunakan domain yang benar-benar sudah dikonfigurasi, bukan contoh ini).
6. Uji URL publik dengan membuka satu gambar contoh di browser. Jika objek tidak bisa dibaca publik, panel mungkin berhasil mengunggah tetapi gambar tidak akan tampil di website.

## 3. Buat hash kata sandi admin

1. Pasang Node.js versi LTS di komputer jika belum ada.
2. Buka terminal/Command Prompt di root project.
3. Jalankan:

   ```bash
   node scripts/make-password-hash.js
   ```

4. Masukkan kata sandi admin saat diminta. Gunakan kata sandi unik minimal 12 karakter. Kata sandi tidak ditulis ke file oleh skrip.
5. Salin hasil satu baris berformat `scrypt$16384$...$...` untuk dipasang sebagai `ADMIN_PASSWORD_HASH` di Vercel. **Jangan** pasang kata sandi asli sebagai environment variable.

## 4. Buat SESSION_SECRET

Buat rahasia acak minimal 32 byte. Contoh perintah lokal:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Salin hasilnya langsung ke environment variable Vercel `SESSION_SECRET`. Jangan memasukkan hasil rahasia ini ke file project atau commit GitHub.

## 5. Hubungkan repository ke Vercel

1. Vercel Dashboard → **Add New → Project** → import repository GitHub situs ini.
2. **Root Directory** harus menunjuk ke folder yang berisi `index.html`, `api/`, `admin/`, `lib/`, dan `scripts/`. Jika isi project sudah ada langsung di root repo, gunakan `./`.
3. Framework preset: pilih **Other** bila Vercel meminta pilihan framework.
4. Build Command: `node scripts/build.js`.
5. Output Directory: biarkan kosong/default untuk situs statis dengan fungsi `/api` Vercel. Jangan arahkan output ke folder yang tidak ada.
6. Production Branch: `main` atau branch yang dipakai project.
7. Deploy pertama boleh gagal pada endpoint admin bila environment variables belum lengkap. Lengkapi variabel lalu redeploy.

## 6. Isi Environment Variables di Vercel

Buka **Project → Settings → Environment Variables**. Tambahkan variabel berikut satu per satu. Aktifkan untuk Production dan Preview hanya jika Preview memang perlu mengakses repository/R2 yang sama; untuk keamanan, lebih baik batasi secret produksi ke Production.

| Nama | Nilai yang harus diisi |
|---|---|
| `ADMIN_PASSWORD_HASH` | Hasil skrip hash pada langkah 3 |
| `SESSION_SECRET` | Rahasia acak dari langkah 4 |
| `GITHUB_TOKEN` | Fine-grained token dari langkah 1 |
| `GITHUB_OWNER` | Username atau organisasi pemilik repo |
| `GITHUB_REPO` | Nama repository situs |
| `GITHUB_BRANCH` | `main` atau branch yang dipakai |
| `R2_ACCOUNT_ID` | Account ID Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key R2 |
| `R2_BUCKET` | Nama bucket R2 |
| `R2_PUBLIC_URL` | URL dasar publik HTTPS untuk gambar |

Simpan perubahan, lalu lakukan **Redeploy** agar variabel tersedia di deployment. `.env.example` hanya contoh nama variabel dan placeholder; jangan menaruh nilai rahasia ke file itu.

## 7. Tes panel sebelum digunakan

Gunakan URL deployment HTTPS Vercel atau domain produksi. Buka `/admin`.

- [ ] Halaman admin terbuka dan tampil baik di desktop serta HP.
- [ ] Kata sandi salah ditolak; kata sandi benar membuka panel.
- [ ] Setelah login, muat ulang halaman: sesi masih berlaku.
- [ ] Buka `/api/content` tanpa login di jendela privat: harus ditolak dengan HTTP 401.
- [ ] Logout, lalu pastikan endpoint yang memerlukan sesi kembali ditolak.
- [ ] Coba mengunggah gambar JPEG/PNG/WebP. Pastikan diperkecil di browser, proses unggah selesai, dan URL gambar dapat dibuka secara publik.
- [ ] Coba file non-gambar atau file lebih dari batas 2 MB setelah konversi: harus ditolak.
- [ ] Coba tautan video valid dari YouTube, Instagram Reel/Post, TikTok video, dan Facebook Reel/Video. Pastikan platform dikenali.
- [ ] Coba tautan video yang tidak didukung atau URL yang tidak lengkap: penerbitan harus ditolak dengan pesan yang jelas.
- [ ] Ubah konten kecil, tekan **Terbitkan**, lalu cek bahwa satu commit muncul di GitHub dan deployment Vercel berjalan.
- [ ] Tunggu build selesai, lalu cek perubahan pada halaman publik.
- [ ] Tes konflik 409: buka panel di dua jendela, muat data di keduanya, terbitkan perubahan dari jendela pertama, lalu coba terbitkan data lama dari jendela kedua. Jendela kedua harus mendapat konflik dan tidak boleh menimpa perubahan pertama.
- [ ] Jalankan `node scripts/build.js` secara lokal; pastikan build selesai tanpa error.
- [ ] Periksa bahwa bentuk data global hasil build tetap sama: `window.BLOG_CATEGORIES`, `window.BLOG_VIDEOS`, `window.BLOG_ARTICLES`, `window.GALLERY_GROUPS`, `window.GALLERY_CATEGORIES`, `window.GALLERY`, dan `window.SITE_CONFIG`. Nama variabel dan struktur objek harus tetap kompatibel dengan file JS situs yang ada.

## 8. Periksa SEO sebelum peluncuran

Situs saat ini dikonfigurasi dalam mode pengembangan pada konfigurasi SEO. Build dapat menghasilkan `robots.txt` yang memblokir seluruh situs (`Disallow: /`) dan metadata `noindex`. Sebelum ingin situs muncul di Google, buka `seo/seo.config.json`, isi URL situs yang benar, dan aktifkan opsi indexing sesuai struktur konfigurasi tersebut. Setelah itu jalankan `node scripts/build.js`, periksa `robots.txt` dan `sitemap.xml`, lalu commit hasilnya. Jangan menghapus larangan indeks khusus `/admin` dan `/api`.

## 9. Catatan keamanan dan operasional

- Pembatasan percobaan login saat ini memakai memori instance serverless. Ini membantu menghambat percobaan berulang pada instance yang sama, tetapi bukan rate limiter global yang dibagi antar-instance. Jika panel terekspos publik dan membutuhkan perlindungan lebih kuat, tambahkan rate limiting di lapisan edge/WAF.
- Jangan pernah mengirim token, secret, hash password, atau file `.env` melalui chat atau commit ke repository.
- Batasi token GitHub hanya pada repository ini dengan izin Contents read/write. Rotasi token segera jika pernah terungkap.
- Setelah mengganti password, buat hash baru dengan skrip dan perbarui `ADMIN_PASSWORD_HASH` di Vercel, lalu redeploy.
- Jika unggah berhasil tetapi gambar tidak terlihat, cek `R2_PUBLIC_URL`, custom domain/pengaturan akses publik bucket, dan apakah URL yang dikembalikan bisa dibuka langsung.
- Konten teks tersimpan di GitHub; perubahan baru tampil setelah commit dan build Vercel selesai. Gambar tersimpan di R2.
