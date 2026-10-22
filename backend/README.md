# Backend TrustX (Django)

Backend untuk fitur Pelaporan Transaksi: simpan laporan, unggah bukti, verifikasi OTP, dan tiket laporan.

## Menjalankan di komputer sendiri

Dari folder `backend/` (contoh untuk Windows PowerShell):

```bash
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Server jalan di `http://127.0.0.1:8000`. Halaman admin ada di `/admin/`.
Frontend dibuka lewat Live Server (atau `python -m http.server 5500` dari folder utama TrustX).

Database (`db.sqlite3`) dan folder `media/` tidak ikut di Git, jadi tiap orang punya data lokal sendiri.

## Menjalankan tes

```bash
python manage.py test
```

## Struktur

- `config/`: pengaturan project (`settings.py`, `urls.py`)
- `laporan/`: app fitur pelaporan
  - `models.py`: tabel `Laporan`, `BuktiLaporan`, `KodeOTP`
  - `serializers.py`: validasi data (kronologi maks. 500 kata, bukti 1-3 berkas PNG/JPG maks. 5MB)
  - `views.py` dan `urls.py`: endpoint API
  - `otp.py`: buat dan verifikasi OTP
  - `tests.py`: tes otomatis

## Endpoint

| Method | Alamat | Fungsi |
|---|---|---|
| GET | `/api/akun/?q=@username` | Data kartu identitas akun |
| POST | `/api/laporan/` | Simpan laporan (multipart) dan kirim OTP |
| POST | `/api/otp/kirim/` | Kirim ulang OTP |
| POST | `/api/otp/verifikasi/` | Verifikasi OTP dan terbitkan tiket |
| GET | `/api/laporan/<nomor_tiket>/` | Detail tiket untuk halaman sukses |

## Catatan

- **OTP masih simulasi.** Kode dicetak di terminal tempat `runserver` berjalan (`[OTP SIMULASI] ...`). Untuk kirim lewat WhatsApp sungguhan, ganti fungsi `kirim_wa()` di `laporan/otp.py`.
- Akun ditandai scam kalau ada minimal 3 laporan scam yang terbit dalam 7 hari (`AMBANG_SCAM` di `views.py`).
- Nomor pelapor di frontend masih tetap (`PELAPOR` di `lapor.js`). Ganti dengan nomor akun yang login setelah fitur login selesai.
- Kalau Live Server memuat ulang halaman saat form dikirim, pakai `.vscode/settings.json` di repo ini yang mengabaikan folder `backend/`.
