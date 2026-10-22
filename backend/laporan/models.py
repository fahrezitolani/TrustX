import secrets
from django.db import models
from django.utils import timezone


class Laporan(models.Model):
    class StatusTransaksi(models.TextChoices):
        SCAM = 'scam', 'Tertipu/Scam'
        AMAN = 'aman', 'Aman/Rekomendasi'

    class StatusLaporan(models.TextChoices):
        MENUNGGU_OTP = 'menunggu_otp', 'Menunggu OTP'
        TERBIT = 'terbit', 'Terbit'
        DITOLAK = 'ditolak', 'Ditolak'

    nomor_tiket = models.CharField(max_length=20, unique=True, null=True, blank=True)
    akun_target = models.CharField(max_length=100, db_index=True)
    whatsapp_target = models.CharField(max_length=30, blank=True)
    bank_target = models.CharField(max_length=30, blank=True)
    rekening_target = models.CharField(max_length=60, blank=True)
    status_transaksi = models.CharField(max_length=10, choices=StatusTransaksi.choices)
    kronologi = models.TextField()
    nomor_pelapor = models.CharField(max_length=30)
    status_laporan = models.CharField(
        max_length=15, choices=StatusLaporan.choices, default=StatusLaporan.MENUNGGU_OTP
    )
    dibuat = models.DateTimeField(auto_now_add=True)
    diterbitkan = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-dibuat']
        verbose_name_plural = 'laporan'

    def __str__(self):
        return f'{self.nomor_tiket or "(belum terbit)"} - {self.akun_target}'

    def terbitkan(self):
        """Dipanggil setelah OTP benar: buat nomor tiket dan ubah status."""
        while True:
            tiket = f'LP-{timezone.now().year}-{secrets.token_hex(2).upper()}'
            if not Laporan.objects.filter(nomor_tiket=tiket).exists():
                break
        self.nomor_tiket = tiket
        self.status_laporan = self.StatusLaporan.TERBIT
        self.diterbitkan = timezone.now()
        self.save()


class BuktiLaporan(models.Model):
    laporan = models.ForeignKey(Laporan, on_delete=models.CASCADE, related_name='bukti')
    berkas = models.ImageField(upload_to='bukti/%Y/%m/')
    ukuran = models.PositiveIntegerField(help_text='ukuran dalam byte')
    dibuat = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Bukti {self.pk} untuk laporan {self.laporan_id}'


class KodeOTP(models.Model):
    laporan = models.ForeignKey(Laporan, on_delete=models.CASCADE, related_name='kode_otp')
    kode_hash = models.CharField(max_length=128)  # kode disimpan dalam bentuk hash, bukan teks asli
    dibuat = models.DateTimeField(auto_now_add=True)
    kedaluwarsa = models.DateTimeField()
    percobaan = models.PositiveSmallIntegerField(default=0)
    terpakai = models.BooleanField(default=False)

    def __str__(self):
        return f'OTP laporan {self.laporan_id}'