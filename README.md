
# TrustX

**Platform Reputasi Akun untuk Transaksi Jual-Beli di Media Sosial**

TrustX adalah aplikasi web yang membantu pengguna memeriksa reputasi akun sebelum melakukan transaksi jual-beli di media sosial, terutama transaksi yang dilakukan melalui Twitter/X dan WhatsApp. Melalui TrustX, pengguna dapat mencari akun berdasarkan username media sosial atau nomor WhatsApp, melihat informasi reputasi dan riwayat laporan yang tersedia, serta berbagi pengalaman transaksi untuk membantu komunitas lebih waspada terhadap potensi penipuan.

TrustX dikembangkan untuk memberikan akses informasi reputasi akun secara lebih terpusat sehingga pengguna dapat mempertimbangkan rekam jejak akun sebelum melakukan transaksi.

> **Disclaimer:** Informasi reputasi di TrustX tidak menjamin suatu akun atau transaksi pasti aman. Pengguna tetap perlu melakukan verifikasi mandiri sebelum bertransaksi.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
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
**Penanggung jawab: Siti Revalisa**

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
**Penanggung jawab: Dwi Fisnilla**

- Form pengajuan sanggahan.
- Input kronologi dan unggah bukti sanggahan.
- Daftar sanggahan.
- Status sanggahan.
- Tampilan tanggapan atau hasil peninjauan laporan.

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
