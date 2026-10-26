
from django.conf import settings
from django.db import models


class Sanggahan(models.Model):
    STATUS_CHOICES = [
        ("pending", "Menunggu ditinjau"),
        ("reviewing", "Sedang ditinjau"),
        ("accepted", "Diterima"),
        ("rejected", "Ditolak"),
    ]

    ALASAN_CHOICES = [
        ("informasi-tidak-sesuai", "Informasi laporan tidak sesuai"),
        ("bukti-tambahan", "Memiliki bukti tambahan"),
        ("masalah-sudah-selesai", "Masalah telah diselesaikan"),
        ("kesalahan-identitas", "Kesalahan identitas akun"),
        ("lainnya", "Alasan lainnya"),
    ]

    pemilik = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sanggahan",
    )
    report_id = models.CharField(max_length=40, db_index=True)
    store_name = models.CharField(max_length=150)
    reason = models.CharField(max_length=50, choices=ALASAN_CHOICES)
    story = models.TextField(max_length=3000)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    admin_response = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.report_id} - {self.store_name}"


class BuktiSanggahan(models.Model):
    sanggahan = models.ForeignKey(
        Sanggahan,
        on_delete=models.CASCADE,
        related_name="bukti",
    )
    file = models.FileField(upload_to="sanggahan/%Y/%m/")
    nama_asli = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nama_asli
