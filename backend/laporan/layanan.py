"""Logika bersama untuk menerbitkan laporan.

Dipakai oleh:
- views.buat_laporan  -> saat OTP laporan dimatikan (laporan langsung terbit)
- views.verifikasi_otp -> saat OTP laporan dinyalakan (terbit setelah kode benar)
- perintah seed_testing -> membuat contoh laporan untuk usability testing
"""
from django.db import transaction

from .models import Laporan


@transaction.atomic
def terbitkan_dan_sinkron(laporan):
    """Terbitkan laporan lalu salin ke data reputasi agar tampil di halaman detail & feed."""
    from reputasi.models import Akun, LaporanReputasi, TransaksiAman

    laporan.terbitkan()

    username = laporan.akun_target.lstrip('@').lower()
    platform = 'X (Twitter)' if laporan.akun_target.startswith('@') else 'WhatsApp'
    akun, _ = Akun.objects.get_or_create(
        username=username,
        defaults={
            'nomor_wa': laporan.whatsapp_target or '',
            'platform': platform,
            'rating': None,
            'transaksi_aman': 0,
            'deskripsi': '',
        },
    )
    LaporanReputasi.objects.create(
        akun=akun,
        nomor_tiket=laporan.nomor_tiket,
        status_trans=laporan.status_transaksi,
        kronologi=laporan.kronologi,
        hari_lalu=0,
        bukti_count=laporan.bukti.count(),
        terverifikasi=True,
    )

    # Laporan transaksi aman menambah riwayat & penghitung transaksi aman.
    if laporan.status_transaksi == Laporan.StatusTransaksi.AMAN:
        TransaksiAman.objects.create(
            akun=akun,
            deskripsi=laporan.kronologi,
            dilaporkan_oleh=laporan.nomor_pelapor,
        )
        akun.transaksi_aman = (akun.transaksi_aman or 0) + 1
        akun.save()

    return laporan
