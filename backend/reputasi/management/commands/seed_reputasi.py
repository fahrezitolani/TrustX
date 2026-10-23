"""Seed data awal untuk app reputasi (sama dengan buyer-data.js di frontend)."""
from django.core.management.base import BaseCommand

from ...models import Akun, LaporanReputasi, TransaksiAman


class Command(BaseCommand):
    help = 'Menambahkan data awal akun reputasi (sinkron dengan buyer-data.js).'

    def handle(self, *args, **options):
        self.stdout.write('Menambahkan data seed reputasi...')

        # 1. seller_gadget_murah: 5 laporan (3 terverifikasi), rating 1.8, aman=1
        a1, _ = Akun.objects.get_or_create(
            username='seller_gadget_murah',
            defaults={
                'platform': 'X (Twitter)',
                'nomor_wa': '081234567890',
                'rating': 1.8,
                'transaksi_aman': 1,
                'deskripsi': 'Akun bekas penjual gadget murah.',
            },
        )
        if not a1.laporan_reputasi.exists():
            data_lap = [
                ('LP-8821', 1, 'Beli lightstick BTS seharga 650rb, setelah transfer langsung di-block WhatsApp dan akun Twitter ganti handle.', True),
                ('LP-8790', 3, 'Mengaku punya proof video card, ternyata video curian dari seller lain di Carousell.', False),
                ('LP-8744', 4, 'Resi yang dikirim fiktif, barang tidak pernah sampai.', True),
                ('LP-8702', 6, 'DP 50% sudah ditransfer, penjual menghilang.', True),
                ('LP-8655', 12, 'Diminta transfer ke rekening atas nama berbeda lalu diblokir.', False),
            ]
            for tiket, hari, kronologi, verif in data_lap:
                LaporanReputasi.objects.create(
                    akun=a1, nomor_tiket=tiket, status_trans='scam',
                    kronologi=kronologi, hari_lalu=hari, bukti_count=1,
                    terverifikasi=verif,
                )
            TransaksiAman.objects.create(
                akun=a1,
                deskripsi='Pembelian album sealed tiba aman, packing bubble wrap + kardus double wall.',
            )

        # 2. wts_photoc***: 2 laporan (1 terverifikasi), aman=0
        a2, _ = Akun.objects.get_or_create(
            username='wts_photoc***',
            defaults={
                'platform': 'X (Twitter)',
                'nomor_wa': '081398217788',
                'rating': None,
                'transaksi_aman': 0,
            },
        )
        if not a2.laporan_reputasi.exists():
            data_lap = [
                ('LP-8830', 0, 'DP tiket konser ditransfer tapi tiket fisik tidak dikirim & kontak langsung diblokir.', True),
                ('LP-8801', 2, 'Tiket tidak dikirim setelah pelunasan.', False),
            ]
            for tiket, hari, kronologi, verif in data_lap:
                LaporanReputasi.objects.create(
                    akun=a2, nomor_tiket=tiket, status_trans='scam',
                    kronologi=kronologi, hari_lalu=hari, bukti_count=1,
                    terverifikasi=verif,
                )

        # 3. trustedseller_id: 0 laporan, rating 4.9, aman=78
        a3, _ = Akun.objects.get_or_create(
            username='trustedseller_id',
            defaults={
                'platform': 'X (Twitter)',
                'rating': 4.9,
                'transaksi_aman': 78,
            },
        )
        if not a3.transaksi_aman_detail.exists():
            for desk in [
                'Pembelian album sealed tiba aman, packing bubble wrap + kardus double wall.',
                'Respon cepat, barang sesuai deskripsi.',
                'COD di tempat ramai, tanpa kendala.',
            ]:
                TransaksiAman.objects.create(akun=a3, deskripsi=desk)

        # 4. toko_jersey_ori: 0 laporan, aman=0
        Akun.objects.get_or_create(
            username='toko_jersey_ori',
            defaults={'platform': 'X (Twitter)', 'transaksi_aman': 0},
        )

        self.stdout.write(self.style.SUCCESS('Seed reputasi selesai.'))