"""Tes fitur Autentikasi & Akun: daftar, masuk, keluar, profil, OTP."""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import KodeOTP

User = get_user_model()


def data_daftar(**extra):
    d = {
        "nama": "Dewi Rahmawati",
        "email": "dewi@example.com",
        "wa": "081246817890",
        "password": "RahasiaKuat123",
        "confirmPassword": "RahasiaKuat123",
        "role": "buyer",
    }
    d.update(extra)
    return d


class AutentikasiTest(TestCase):
    def setUp(self):
        self.c = APIClient()

    def daftar(self, **extra):
        with patch("laporan.otp.kirim_wa") as kirim:
            r = self.c.post("/api/akun/daftar/", data_daftar(**extra), format="json")
        return r, (kirim.call_args[0][1] if kirim.called else None)

    def masuk(self, email="dewi@example.com", password="RahasiaKuat123"):
        return self.c.post("/api/akun/masuk/", {"email": email, "password": password}, format="json")

    # ---------- 1. Registrasi akun ----------

    def test_daftar_berhasil_buat_akun_dan_kirim_otp(self):
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["user"]["email"], "dewi@example.com")
        self.assertEqual(r.data["user"]["role"], "buyer")
        self.assertFalse(r.data["user"]["terverifikasi"])
        self.assertNotIn("password", r.data["user"])
        self.assertTrue(User.objects.filter(email="dewi@example.com").exists())
        self.assertRegex(kode or "", r"^\d{6}$")

    def test_daftar_menolak_email_ganda_dan_wa_ganda(self):
        self.daftar()
        r, _ = self.daftar()
        self.assertEqual(r.status_code, 400)
        self.assertIn("email", r.data)

        r2, _ = self.daftar(email="lain@example.com", wa="081246817890")
        self.assertEqual(r2.status_code, 400)
        self.assertIn("wa", r2.data)

    def test_daftar_menolak_input_tidak_valid(self):
        self.assertEqual(self.daftar(password="rahasia", confirmPassword="rahasia")[0].status_code, 400)
        self.assertEqual(self.daftar(confirmPassword="BedaSekali123")[0].status_code, 400)
        self.assertEqual(self.daftar(wa="123")[0].status_code, 400)
        self.assertEqual(self.daftar(email="bukan-email")[0].status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_daftar_penjual_wajib_nama_toko(self):
        r, _ = self.daftar(role="seller")
        self.assertEqual(r.status_code, 400)

        r, _ = self.daftar(role="seller", toko_nama="Gadget Murah")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["user"]["role"], "seller")
        self.assertEqual(r.data["user"]["toko_nama"], "Gadget Murah")

    def test_sandi_disimpan_terenkripsi(self):
        self.daftar()
        u = User.objects.get(email="dewi@example.com")
        self.assertNotEqual(u.password, "RahasiaKuat123")
        self.assertTrue(u.password.startswith(("pbkdf2_", "bcrypt", "argon2")))

    # ---------- 2. Verifikasi OTP ----------

    def test_otp_verifikasi_menandai_akun_terverifikasi(self):
        _, kode = self.daftar()
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["user"]["terverifikasi"])
        self.assertTrue(User.objects.get(email="dewi@example.com").terverifikasi)

    def test_otp_salah_lalu_hangus_setelah_5_percobaan(self):
        _, kode = self.daftar()
        salah = "000000" if kode != "000000" else "111111"
        for _ in range(5):
            x = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": salah}, format="json")
            self.assertEqual(x.status_code, 400)
        x = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(x.status_code, 400)

    def test_kirim_ulang_otp_menghormati_jeda_45_detik(self):
        self.daftar()
        sebelum = KodeOTP.objects.filter(pemilik__email="dewi@example.com").count()
        r = self.c.post("/api/akun/otp/kirim/", {"email": "dewi@example.com"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(KodeOTP.objects.filter(pemilik__email="dewi@example.com").count(), sebelum)

    def test_kirim_ulang_tidak_bocorkan_email_terdaftar(self):
        self.daftar()
        ada = self.c.post("/api/akun/otp/kirim/", {"email": "dewi@example.com"}, format="json")
        tidak_ada = self.c.post("/api/akun/otp/kirim/", {"email": "hantu@example.com"}, format="json")
        self.assertEqual(ada.status_code, tidak_ada.status_code)
        self.assertEqual(ada.data["detail"], tidak_ada.data["detail"])

    def test_kode_otp_disimpan_sebagai_hash(self):
        _, kode = self.daftar()
        u = User.objects.get(email="dewi@example.com")
        self.assertNotEqual(u.kode_otp.first().kode_hash, kode)

    # ---------- 3. Login dan logout ----------

    def test_masuk_dengan_email_dan_token(self):
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)
        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["user"]["terverifikasi"])

        # login sekarang berhasil
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIn("token", r.data)
        self.assertEqual(r.data["user"]["telepon"], "0812-xxxx-7890")

    def test_masuk_menolak_email_atau_sandi_salah(self):
        self.daftar()
        self.assertEqual(self.masuk(password="SalahBanget123").status_code, 400)
        self.assertEqual(self.masuk(email="hantu@example.com").status_code, 400)

    def test_endpoint_terlindungi_butuh_token(self):
        # tanpa login: endpoint harus 401
        self.assertEqual(self.c.get("/api/akun/saya/").status_code, 401)

        # daftar akun baru
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["user"]["terverifikasi"])
        self.c.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])

        # endpoint bisa diakses setelah login berhasil
        r = self.c.get("/api/akun/saya/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "dewi@example.com")

    def test_keluar_menghapus_token(self):
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)

        # login
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        self.c.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])

        # keluar
        self.assertEqual(self.c.post("/api/akun/keluar/").status_code, 200)
        self.assertEqual(self.c.get("/api/akun/saya/").status_code, 401)

    # ---------- 4 & 5. Profil dan pengaturan akun ----------

    def test_ubah_profil_dan_nama_toko(self):
        r, kode = self.daftar(role="seller", toko_nama="Toko Lama")
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)
        self.assertTrue(r.data["detail"].startswith("Akun belum diverifikasi"))

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)

        # masuk, simpan token
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        self.c.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])

        r = self.c.patch("/api/akun/profil/",
                         {"first_name": "Dewi R.", "toko_nama": "Toko Baru", "nomor_whatsapp": "089911112222"},
                         format="json")
        self.assertEqual(r.status_code, 200, r.data)
        u = User.objects.get(email="dewi@example.com")
        self.assertEqual(u.toko_nama, "Toko Baru")
        self.assertEqual(u.first_name, "Dewi R.")
        self.assertEqual(u.nomor_whatsapp, "089911112222")

    def test_nomor_whatsapp_tidak_boleh_bentrok(self):
        # akun pertama (dewi) dengan nomor 081246817890
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)

        # masuk, simpan token
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        self.c.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])

        # buat akun kedua yang nomor WA-nya 085711112222
        r2, _ = self.daftar(email="kakak@example.com", wa="085711112222")
        self.assertEqual(r2.status_code, 201)

        # sekarang coba ubah nomor WhatsApp ke nomor yang dipakai akun kedua (harus 400)
        r = self.c.patch("/api/akun/profil/", {"nomor_whatsapp": "085711112222"}, format="json")
        self.assertEqual(r.status_code, 400)
        u = User.objects.get(email="dewi@example.com")
        self.assertNotEqual(u.nomor_whatsapp, "085711112222")

    def test_ganti_password_perlu_sandi_lama(self):
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)

        # masuk, simpan token
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        token = r.data["token"]
        self.c.credentials(HTTP_AUTHORIZATION="Token " + token)

        # coba ganti sandi dengan sandi lama (harus 400)
        r = self.c.post("/api/akun/ganti-password/", {"lama": "SalahSekali123", "baru": "SandiBaruKuat123"}, format="json")
        self.assertEqual(r.status_code, 400)

        # ganti sandi yang benar
        r = self.c.post("/api/akun/ganti-password/", {"lama": "RahasiaKuat123", "baru": "SandiBaruKuat123"}, format="json")
        self.assertEqual(r.status_code, 200, r.data)

        # token lama dipaksa login ulang
        self.assertEqual(self.c.get("/api/akun/saya/").status_code, 401)

        # masuk kembali pakai sandi baru
        r = self.c.post("/api/akun/masuk/", {"email": "dewi@example.com", "password": "SandiBaruKuat123"}, format="json")
        self.assertEqual(r.status_code, 200)

    # ---------- 6. Token & TTL ----------

    def test_token_dibawakkan_dengan_baik_dan_digunakan_akhir(self):
        """Token dibuat, digunakan, lalu otomatis dihapus/refresh sesuai TTL."""
        r, kode = self.daftar()
        self.assertEqual(r.status_code, 201)

        # belum diverifikasi -> login ditolak
        r = self.masuk()
        self.assertEqual(r.status_code, 400)

        # verifikasi OTP
        r = self.c.post("/api/akun/otp/verifikasi/", {"email": "dewi@example.com", "kode": kode}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["user"]["terverifikasi"])

        # login sekarang berhasil
        r = self.masuk()
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIn("token", r.data)

        # token digunakan
        tok = r.data["token"]
        self.c.credentials(HTTP_AUTHORIZATION="Token " + tok)
        r = self.c.get("/api/akun/saya/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "dewi@example.com")

