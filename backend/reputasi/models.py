"""Model untuk fitur Pencarian Reputasi Akun."""
from django.db import models


class Akun(models.Model):
    """Akun yang tercatat di database TrustX (X/Twitter atau WhatsApp)."""

    username = models.CharField(
        max_length=100, unique=True, db_index=True,
        help_text='Username X tanpa prefix @, lowercase.',
    )
    nomor_wa = models.CharField(
        max_length=30, blank=True,
        help_text='Nomor WhatsApp dalam format 08xx (tanpa spasi/dash).',
    )
    platform = models.CharField(
        max_length=50,
        help_text='Contoh: X (Twitter), Instagram, WhatsApp.',
    )
    rating = models.FloatField(
        null=True, blank=True,
        help_text='Rating 0.0 - 5.0.',
    )
    transaksi_aman = models.PositiveIntegerField(
        default=0,
        help_text='Jumlah transaksi aman yang dilaporkan oleh komunitas.',
    )
    deskripsi = models.TextField(
        blank=True,
        help_text='Deskripsi singkat akun (opsional).',
    )
    dibuat = models.DateTimeField(auto_now_add=True)
    diperbarui = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-dibuat']
        verbose_name = 'Akun'
        verbose_name_plural = 'Akun'

    def __str__(self):
        return f'@{self.username}'


class LaporanReputasi(models.Model):
    """Riwayat laporan yang terkait dengan satu akun."""

    class StatusTransaksi(models.TextChoices):
        SCAM = 'scam', 'Tertipu/Scam'
        AMAN = 'aman', 'Aman/Rekomendasi'

    akun = models.ForeignKey(
        Akun, on_delete=models.CASCADE,
        related_name='laporan_reputasi',
    )
    nomor_tiket = models.CharField(
        max_length=20, blank=True,
        help_text='Nomor tiket laporan (LP-YYYY-XXXXX).',
    )
    status_trans = models.CharField(
        max_length=10, choices=StatusTransaksi.choices,
    )
    kronologi = models.TextField(
        help_text='Kronologi kejadian (maksimal 500 kata).',
    )
    hari_lalu = models.PositiveSmallIntegerField(
        default=0,
        help_text='0 = hari ini, 1 = kemarin, dst.',
    )
    bukti_count = models.PositiveSmallIntegerField(
        default=0,
        help_text='Jumlah berkas bukti yang diunggah.',
    )
    terverifikasi = models.BooleanField(
        default=False,
        help_text='True jika laporan sudah diverifikasi oleh admin.',
    )
    dibuat = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-dibuat']
        verbose_name = 'Laporan Reputasi'
        verbose_name_plural = 'Laporan Reputasi'

    def __str__(self):
        return f'{self.nomor_tiket or "(tanpa tiket)"} - @{self.akun.username}'


class TransaksiAman(models.Model):
    """Riwayat transaksi aman yang dilaporkan oleh komunitas."""

    akun = models.ForeignKey(
        Akun, on_delete=models.CASCADE,
        related_name='transaksi_aman_detail',
    )
    deskripsi = models.TextField(
        help_text='Deskripsi transaksi aman (contoh: "Barang tiba aman, packing tebal").',
    )
    dilaporkan_oleh = models.CharField(
        max_length=30, blank=True,
        help_text='Nomor WA pelapor (samarkan: 0812-xxxx-7890).',
    )
    dibuat = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-dibuat']
        verbose_name = 'Transaksi Aman'
        verbose_name_plural = 'Transaksi Aman'

    def __str__(self):
        return f'Transaksi aman @{self.akun.username}'