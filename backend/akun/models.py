"""Model akun: `User` (AUTH_USER_MODEL) dan `KodeOTP` untuk verifikasi.

Relasi OTP dinamai `kode_otp` supaya helper di `laporan/otp.py` bisa dipakai
ulang apa adanya (duck-typing: cukup objek punya relasi bernama `kode_otp`).
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Pengguna aplikasi (pembeli / penjual)."""

    ROLES = [
        ("buyer", "Pembeli"),
        ("seller", "Penjual"),
    ]

    nomor_whatsapp = models.CharField(max_length=30, unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLES, default="buyer")
    toko_nama = models.CharField(max_length=120, blank=True)
    terverifikasi = models.BooleanField(default=False)  # true setelah OTP lolos
    # Identitas dari login sosial; NULL = akun dibuat lewat form biasa
    google_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    x_id = models.CharField(max_length=64, unique=True, null=True, blank=True)

    class Meta:
        verbose_name = "Pengguna"
        verbose_name_plural = "Pengguna"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class KodeOTP(models.Model):
    """Kode OTP yang dikirim ke nomor WhatsApp pengguna (disimpan sebagai hash)."""

    pemilik = models.ForeignKey(User, on_delete=models.CASCADE, related_name="kode_otp")
    kode_hash = models.CharField(max_length=128)
    dibuat = models.DateTimeField(auto_now_add=True)
    kedaluwarsa = models.DateTimeField()
    percobaan = models.PositiveSmallIntegerField(default=0)
    terpakai = models.BooleanField(default=False)

    class Meta:
        ordering = ["-dibuat"]

    def __str__(self):
        return f"OTP pengguna {self.pemilik_id}"
