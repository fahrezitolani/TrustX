# Persiapan Usability Testing (Modul 9)

## Akun testing (sesuai Template Laporan Usability Testing)

| | Akun Pembeli | Akun Penjual |
|---|---|---|
| Nama | Buyer | Seller |
| Email | buyer@trustx.com | seller@trustx.com |
| Kata sandi | buyer123 | seller123 |

Peserta memakai akun **Pembeli**. Kedua akun sudah terverifikasi, jadi tidak perlu OTP.
Akun toko Seller di TrustX: `@seller`.

Akun target Task 1–3, `@trustedseller_id`, otomatis dipastikan ada di database
(rating 4.9, 78 transaksi aman, belum ada laporan).

## Langkah di server backend (PythonAnywhere)

1. Upload file backend yang berubah (lihat daftar di bawah).
2. Buka **Bash console**, masuk ke folder `backend`, lalu jalankan:
   ```
   python manage.py seed_testing
   ```
   Perintah ini aman dijalankan berulang kali: kata sandi kedua akun dikembalikan
   ke nilai awal dan data contoh tidak dobel.
3. **Di antara peserta**, jalankan:
   ```
   python manage.py seed_testing --reset
   ```
   Ini menghapus laporan yang dikirim peserta sebelumnya untuk `@trustedseller_id`
   (Task 3), supaya peserta berikutnya melihat status dan riwayat yang sama di Task 1–2.
4. Klik **Reload** di tab Web PythonAnywhere (cukup sekali, setelah upload file).

Setelah itu, upload/deploy ulang frontend ke Netlify.

## OTP laporan

- OTP saat **membuat laporan** dimatikan secara default: laporan langsung terbit.
- OTP saat **daftar akun** tetap aktif.
- Untuk menyalakan OTP laporan lagi, tambahkan `LAPORAN_PERLU_OTP=1` di `backend/.env`
  lalu reload server.

## Microsoft Clarity

Project ID `z5u4zp3oz8` terpasang di semua halaman HTML. Setiap rekaman diberi label
email akun (Custom ID) dan tag `peran` (pembeli/penjual). Karena semua peserta memakai
akun Buyer yang sama, pisahkan rekaman per peserta berdasarkan jam sesi; di dashboard
Clarity rekaman tiap peserta bisa difilter untuk menghitung waktu pengerjaan.

## File yang berubah

Backend:
- `backend/config/settings.py` — setting `LAPORAN_PERLU_OTP`
- `backend/laporan/layanan.py` (baru) — logika terbitkan laporan
- `backend/laporan/views.py` — laporan langsung terbit; feed menyertakan nomor WA tersamar
- `backend/akun/management/` (baru) — perintah `seed_testing`
- `backend/.env.example`

Frontend:
- `index.html`, `buyer.js`, `buyer-data.js` — feed, hasil pencarian & detail dari database
- `index-seller.html` via `seller.js` — feed dari database, tautan "Akun Toko" ke toko sendiri
- `lapor.js`, `lapor.html`, `success.html` — kirim laporan langsung ke halaman sukses
- `akun.js` + semua `*.html` — label Clarity per penguji
