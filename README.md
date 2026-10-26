
# TrustX

**Platform Reputasi Akun untuk Transaksi Jual-Beli di Media Sosial**

TrustX adalah aplikasi web yang membantu pengguna memeriksa reputasi akun sebelum melakukan transaksi jual-beli di media sosial, terutama transaksi yang dilakukan melalui Twitter/X dan WhatsApp. Melalui TrustX, pengguna dapat mencari akun berdasarkan username media sosial atau nomor WhatsApp, melihat informasi reputasi dan riwayat laporan yang tersedia, serta berbagi pengalaman transaksi untuk membantu komunitas lebih waspada terhadap potensi penipuan.

TrustX dikembangkan untuk memberikan akses informasi reputasi akun secara lebih terpusat sehingga pengguna dapat mempertimbangkan rekam jejak akun sebelum melakukan transaksi.

> **Disclaimer:** Informasi reputasi di TrustX tidak menjamin suatu akun atau transaksi pasti aman. Pengguna tetap perlu melakukan verifikasi mandiri sebelum bertransaksi.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Panduan Halaman & Form untuk Mentor](#panduan-halaman--form-untuk-mentor)
- [Sumber Data & Layanan Form](#sumber-data--layanan-form)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
- [Desain UI/UX](#desain-uiux)
- [Struktur Proyek](#struktur-proyek)
- [Pembagian Kontribusi Anggota](#pembagian-kontribusi-anggota)
- [Log Prompt AI dan Perbaikan](#log-prompt-ai-dan-perbaikan)
- [Status Pengembangan](#status-pengembangan)
- [Catatan Pengembangan](#catatan-pengembangan)
- [Tim Pengembang](#tim-pengembang)

---

## Fitur Utama

### 1. Autentikasi dan Akun
**Penanggung jawab: Dwi Fisnilla**

- Registrasi akun.
- Login dan logout.
- Verifikasi OTP.
- Profil pengguna.
- Pengaturan akun toko/penjual.

### 2. Pencarian Reputasi Akun
**Penanggung jawab: Samuel Sebastian Sibarani**

- Landing page dan kolom pencarian.
- Pencarian akun berdasarkan username media sosial atau nomor WhatsApp.
- Halaman hasil pencarian.
- Detail profil dan reputasi akun.
- Status reputasi berdasarkan laporan dan riwayat transaksi aman.
- Homepage untuk Role Seller
- Detail Profile untuk Role Seller

### 3. Pelaporan Transaksi
**Penanggung jawab: Muhammad Febriyanto**

- Form laporan dugaan penipuan.
- Form laporan transaksi aman.
- Input kronologi dan informasi akun.
- Unggah bukti transaksi.
- Konfirmasi pengiriman laporan.
- Penyimpanan dan validasi laporan.

### 4. Dashboard Laporan
**Penanggung jawab: Muh. Fahrezi Tolani**

- Dashboard laporan pengguna.
- Daftar riwayat laporan.
- Filter laporan berdasarkan status.
- Detail laporan.
- Pelacakan status laporan.

### 5. Sanggahan
**Penanggung jawab: Siti Revalisa**

- Form pengajuan sanggahan.
- Input kronologi dan unggah bukti sanggahan.
- Daftar sanggahan.
- Status sanggahan.
- Tampilan tanggapan atau hasil peninjauan laporan.

---

## Panduan Halaman & Form untuk Mentor

Berikut adalah daftar halaman dan form yang dapat dicoba oleh mentor untuk mengevaluasi fitur TrustX:

| No | Halaman / File | Fungsi | Form yang Tersedia |
|----|----------------|--------|-------------------|
| 1 | [`index.html`](index.html) | Landing page & pencarian reputasi | Form pencarian akun (Nomor WA atau Username X) |
| 2 | [`Landing-pages.html`](Landing-pages.html) | Halaman landing alternatif | Navigasi ke fitur utama |
| 3 | [`daftar.html`](daftar.html) | Registrasi akun baru | Form pendaftaran (nama, WA, email, kata sandi, peran pembeli/penjual, nama toko) |
| 4 | [`login.html`](login.html) | Masuk ke akun | Form login (email, kata sandi), tombol OAuth (X, Google) |
| 5 | [`confirm-otp.html`](confirm-otp.html) / [`verifikasi-otp.html`](verifikasi-otp.html) | Verifikasi OTP | Form input kode OTP yang dikirim via WhatsApp |
| 6 | [`lapor.html`](lapor.html) | Pelaporan transaksi | Form laporan (identitas lawan transaksi, status transaksi, kronologi, unggah bukti, pernyataan kebenaran) |
| 7 | [`hasil.html`](hasil.html) | Hasil pencarian reputasi | Tampilan hasil pencarian akun |
| 8 | [`detail-profile.html`](detail-profile.html) | Detail reputasi akun | Informasi detail akun, riwayat laporan, transaksi aman |
| 9 | [`dashboard-laporan.html`](dashboard-laporan.html) | Dashboard laporan pembeli | Daftar laporan komunitas, filter status, statistik |
| 10 | [`dashboard-laporanseller.html`](dashboard-laporanseller.html) | Dashboard laporan penjual | Daftar laporan terkait toko penjual |
| 11 | [`sanggahan.html`](sanggahan.html) | Form klarifikasi penjual | Form sanggahan (ID laporan, nama toko, alasan, kronologi, bukti pendukung) |
| 12 | [`profil.html`](profil.html) | Profil pengguna | Tampilan profil dan pengaturan akun |
| 13 | [`pengaturan-toko.html`](pengaturan-toko.html) | Pengaturan toko | Form pengaturan profil toko penjual |
| 14 | [`keamanan-akun.html`](keamanan-akun.html) | Keamanan akun | Pengaturan keamanan dan verifikasi akun |
| 15 | [`bantuan.html`](bantuan.html) | Halaman bantuan | Informasi panduan penggunaan |
| 16 | [`success.html`](success.html) | Halaman sukses | Konfirmasi tindakan berhasil |
| 17 | [`index-seller.html`](index-seller.html) | Beranda penjual | Halaman utama untuk role penjual |

### Cara Mencoba Setiap Form

1. **Pencarian Reputasi** — Buka [`index.html`](index.html), masukkan nomor WhatsApp atau username X, lalu klik "CEK REPUTASI".
2. **Registrasi** — Buka [`daftar.html`](daftar.html), isi formulir pendaftaran, pilih peran (pembeli/penjual), lalu daftar.
3. **Login** — Buka [`login.html`](login.html), masukkan email dan kata sandi, atau gunakan tombol OAuth (X/Google).
4. **Laporan Transaksi** — Buka [`lapor.html`](lapor.html), isi identitas lawan transaksi, pilih status (scam/aman), tulis kronologi, unggah bukti, centang pernyataan, lalu lanjutkan ke verifikasi OTP.
5. **Sanggahan Penjual** — Buka [`sanggahan.html`](sanggahan.html), isi ID laporan, nama toko, pilih alasan sanggahan, tulis kronologi, dan unggah bukti pendukung.
6. **Dashboard Laporan** — Buka [`dashboard-laporan.html`](dashboard-laporan.html) untuk melihat daftar laporan komunitas dan filter berdasarkan status.

---

## Sumber Data & Layanan Form

### Sumber Data (Backend & Database)

TrustX menggunakan backend **Django** dengan **Django REST Framework** dan basis data **SQLite** (default Django). Data disimpan dalam beberapa aplikasi Django:

| Aplikasi | Model | Deskripsi |
|----------|-------|-----------|
| [`akun`](backend/akun/models.py) | `User` | Data pengguna (pembeli/penjual), nomor WhatsApp, role, verifikasi status, identitas sosial (Google/X). |
| [`akun`](backend/akun/models.py) | `KodeOTP` | Kode OTP untuk verifikasi pengguna (disimpan sebagai hash). |
| [`laporan`](backend/laporan/models.py) | `Laporan` | Data laporan transaksi (target akun, WA, bank, rekening, status transaksi, kronologi, nomor pelapor, status laporan). |
| [`laporan`](backend/laporan/models.py) | `BuktiLaporan` | Berkas bukti transaksi yang diunggah pelapor. |
| [`laporan`](backend/laporan/models.py) | `KodeOTP` | Kode OTP untuk verifikasi laporan sebelum diterbitkan. |
| [`reputasi`](backend/reputasi/models.py) | `Akun` | Data akun media sosial (username X, nomor WA, platform, rating, transaksi aman, deskripsi). |
| [`reputasi`](backend/reputasi/models.py) | `LaporanReputasi` | Riwayat laporan terkait satu akun (nomor tiket, status, kronologi, bukti, verifikasi). |
| [`reputasi`](backend/reputasi/models.py) | `TransaksiAman` | Riwayat transaksi aman yang dilaporkan komunitas. |
| [`sanggahan`](backend/sanggahan/models.py) | `Sanggahan` | Data pengajuan sanggahan penjual (ID laporan, nama toko, alasan, kronologi, status, tanggapan admin). |
| [`sanggahan`](backend/sanggahan/models.py) | `BuktiSanggahan` | Berkas bukti pendukung sanggahan. |

### Endpoint API Utama

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/akun/daftar/` | POST | Registrasi akun baru + pengiriman OTP verifikasi. |
| `/api/akun/masuk/` | POST | Login dengan email & kata sandi, menghasilkan token autentikasi. |
| `/api/akun/?q=` | GET | Pencarian akun reputasi berdasarkan username X atau nomor WA. |
| `/api/laporan/` | POST | Buat laporan transaksi baru (multipart/form-data untuk bukti). |
| `/api/otp/kirim/` | POST | Kirim ulang kode OTP untuk laporan yang menunggu verifikasi. |
| `/api/otp/verifikasi/` | POST | Verifikasi kode OTP dan terbitkan laporan. |
| `/api/akun/oauth/x/start/` | GET | OAuth login melalui X (Twitter). |
| `/api/akun/oauth/google/start/` | GET | OAuth login melalui Google. |

### Layanan Form yang Digunakan

1. **Form Pencarian Reputasi** (`index.html`)
   - Input: Nomor WhatsApp atau Username X
   - Layanan: API pencarian akun (`/api/akun/?q=`)
   - Frontend: Vanilla JavaScript (`buyer.js`, `buyer-data.js`)

2. **Form Pendaftaran** (`daftar.html`)
   - Input: Nama lengkap, nomor WhatsApp, email, kata sandi, peran, nama toko (opsional)
   - Layanan: API registrasi (`/api/akun/daftar/`) + OTP via WhatsApp
   - Frontend: `akun.js`, `script.js`

3. **Form Login** (`login.html`)
   - Input: Email, kata sandi; tombol OAuth (X, Google)
   - Layanan: API login (`/api/akun/masuk/`), OAuth X & Google
   - Frontend: `akun.js`, `script.js`

4. **Form Laporan Transaksi** (`lapor.html`)
   - Input: Identitas lawan transaksi, status transaksi, kronologi, berkas bukti (maks. 3 file, PNG/JPG hingga 5MB), pernyataan kebenaran
   - Layanan: API buat laporan (`/api/laporan/`), OTP verifikasi (`/api/otp/kirim/`, `/api/otp/verifikasi/`)
   - Frontend: `lapor.js`

5. **Form Sanggahan Penjual** (`sanggahan.html`)
   - Input: ID laporan, nama toko, alasan sanggahan, kronologi, bukti pendukung
   - Layanan: API sanggahan (backend `sanggahan`)
   - Frontend: `reports.js`

6. **Verifikasi OTP** (`confirm-otp.html`, `verifikasi-otp.html`)
   - Input: Kode OTP 6 digit
   - Layanan: API verifikasi OTP (`/api/otp/verifikasi/`)
   - Frontend: `akun.js`

### Catatan Pengembangan

- Saat ini proyek berfokus pada implementasi frontend (HTML5, CSS3, JavaScript) dengan backend Django yang tersedia sebagai API.
- Fitur autentikasi, verifikasi OTP, dan penyimpanan data laporan menggunakan backend Django dengan Django REST Framework.
- Data sampel untuk reputasi akun dapat di-seed menggunakan perintah `seed_reputasi` di aplikasi `reputasi`.
- Semua form menggunakan validasi sisi klien (HTML5 `required`, `novalidate` dengan JS) dan validasi sisi server (Django serializers).

---

## Teknologi yang Digunakan

TrustX saat ini dikembangkan menggunakan teknologi frontend:

- **HTML5** — menyusun struktur halaman web.
- **CSS3** — mengatur tampilan, layout, dan responsivitas antarmuka.
- **JavaScript** — menangani interaksi dan perilaku antarmuka pengguna.
- **Git dan GitHub** — version control dan kolaborasi pengembangan.
- **Figma** — referensi desain UI/UX.

### Arsitektur Saat Ini

Pada tahap pengembangan ini, TrustX berfokus pada implementasi frontend menggunakan HTML, CSS, dan JavaScript. Backend dan database belum digunakan.

Fitur yang memerlukan autentikasi, verifikasi OTP, penyimpanan data permanen, dan pengelolaan laporan lintas pengguna dapat masih berupa simulasi atau menggunakan data sementara, sesuai implementasi yang tersedia.

---

## Cara Menjalankan Aplikasi

### Prasyarat

- Browser modern, seperti Google Chrome, Mozilla Firefox, atau Microsoft Edge.
- Code editor, seperti Visual Studio Code (opsional).
- Git, jika ingin mengunduh repository melalui terminal.

### Langkah 1 — Clone Repository

```bash
git clone <URL_REPOSITORY>
```

Ganti `<URL_REPOSITORY>` dengan URL repository GitHub TrustX.

### Langkah 2 — Masuk ke Folder Proyek

```bash
cd <NAMA_FOLDER_REPOSITORY>
```

Ganti `<NAMA_FOLDER_REPOSITORY>` dengan nama folder hasil clone.

### Langkah 3 — Buka Aplikasi

1. Buka folder proyek menggunakan code editor.
2. Temukan file `index.html`.
3. Buka file tersebut melalui browser.

Alternatifnya, jika menggunakan Visual Studio Code, jalankan aplikasi melalui ekstensi **Live Server** untuk memudahkan proses pengembangan dan melihat perubahan halaman.

> Catatan: Sesuaikan file HTML yang dibuka dengan struktur repository aktual. Jika halaman utama tidak bernama `index.html`, gunakan file entry point yang tersedia.

---

## Desain UI/UX

Desain antarmuka TrustX dibuat menggunakan Figma sebagai acuan implementasi frontend.

- **Figma Wireframe:** [TrustX — VINIX7 Wireframe](https://www.figma.com/design/NGYfGPXtTjBEGQEcs3IkUN/VINIX7_Wireframe_TrustX?node-id=0-1)
- **Figma Hi-Fi / Prototype:** https://www.figma.com/proto/NGYfGPXtTjBEGQEcs3IkUN/VINIX7_TrustX?node-id=49-296&p=f&t=l7x3GNwXvs7CBrbK-1&scaling=scale-down&content-scaling=fixed&page-id=47%3A3&starting-point-node-id=49%3A296

Implementasi antarmuka mengacu pada rancangan UI/UX yang telah disusun oleh tim, dengan memperhatikan konsistensi komponen, kemudahan navigasi, dan pengalaman pengguna.

---

Keterangan:

- `index.html` — halaman utama aplikasi.
- `css/` — stylesheet untuk tampilan antarmuka.
- `js/` — JavaScript untuk interaksi dan logika frontend.
- `assets/` — aset visual seperti gambar dan ikon.
- `README.md` — dokumentasi proyek.
- `.gitignore` — daftar file atau folder yang tidak perlu dimasukkan ke repository.

Nama file dan struktur direktori dapat berbeda sesuai implementasi aktual.

---

## Pembagian Kontribusi Anggota

| No. | Nama Anggota | Fitur/Bagian | Kontribusi |
|---|---|---|---|
| 1 | Dwi Fisnilla | Autentikasi dan Akun | Mengembangkan fitur registrasi, login dan logout, verifikasi OTP, profil pengguna, serta pengaturan akun toko/penjual. |
| 2 | Samuel Sebastian Sibarani | Pencarian Reputasi Akun, PRD, dan README | Mengembangkan landing page, kolom pencarian, pencarian berdasarkan username media sosial atau nomor WhatsApp, halaman hasil pencarian, detail profil dan reputasi akun. Selain itu, menyusun Product Requirements Document (PRD) dan dokumentasi README proyek. |
| 3 | Muhammad Febriyanto | Pelaporan Transaksi | Mengembangkan form laporan dugaan penipuan dan transaksi aman, input kronologi dan informasi akun, unggah bukti transaksi, konfirmasi pengiriman laporan, serta validasi laporan pada sisi frontend. |
| 4 | Muh. Fahrezi Tolani | Dashboard Laporan | Mengembangkan dashboard laporan pengguna, daftar riwayat laporan, filter berdasarkan status, detail laporan, dan tampilan pelacakan status laporan. |
| 5 | Siti Revalisa | Sanggahan | Mengembangkan form pengajuan sanggahan, input kronologi, unggah bukti pendukung, daftar sanggahan, status sanggahan, serta tampilan tanggapan atau hasil peninjauan laporan. |

Pembagian tersebut menunjukkan fokus kontribusi utama setiap anggota. Fitur yang saling terhubung tetap perlu diintegrasikan dan diuji bersama agar alur penggunaan aplikasi konsisten.

---

## Prompt AI dan Perbaikan

"Buat kode frontend menggunakan html modern based on rancangan HiFi yang dilampirkan"
-> Iterasi satu-satu perbaikan dari hasil AI

---




## Tim Pengembang

**VINIX7 Batch 5 — Kelompok 14**

1. Siti Revalisa
2. Samuel Sebastian Sibarani
3. Dwi Fisnilla
4. Muhammad Febriyanto
5. Muh. Fahrezi Tolani
