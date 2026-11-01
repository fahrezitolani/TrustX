"""Akun & data contoh untuk usability testing (Modul 9), sesuai Template Laporan Usability Testing.

Jalankan:  python manage.py seed_testing

- Membuat/memperbarui akun Buyer & Seller yang SUDAH terverifikasi (tanpa OTP):
    buyer@trustx.com  / buyer123
    seller@trustx.com / seller123
- Memastikan akun @trustedseller_id (dipakai Task 1-3) ada di database.
- Menambah beberapa laporan contoh supaya Feed Laporan Komunitas tidak kosong.
- Aman dijalankan berulang kali: kata sandi di-reset ke nilai awal dan data
  contoh tidak dobel.

Antar peserta:  python manage.py seed_testing --reset
  Menghapus laporan yang dikirim peserta untuk @trustedseller_id (Task 3), supaya
  peserta berikutnya melihat status & riwayat yang sama di Task 1-2.
"""
import re
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from akun.models import User
from laporan.layanan import terbitkan_dan_sinkron
from laporan.models import Laporan
from reputasi.models import Akun, TransaksiAman

PENGGUNA = [
    # username, nama, email, password, role, nama toko, nomor WA (dipakai kalau akun belum punya)
    ("buyer", "Buyer", "buyer@trustx.com", "buyer123", "buyer", "", "081100000101"),
    ("seller", "Seller", "seller@trustx.com", "seller123", "seller", "Seller", "081100000201"),
]

# Akun target Task 1-3. Sama dengan seed_reputasi & data contoh frontend.
TRUSTEDSELLER = {
    "username": "trustedseller_id",
    "rating": 4.9,
    "transaksi_aman": 78,
    "testimoni": [
        "Pembelian album sealed tiba aman, packing bubble wrap + kardus double wall.",
        "Respon cepat, barang sesuai deskripsi.",
        "COD di tempat ramai, tanpa kendala.",
    ],
}

# Laporan contoh di Feed Laporan Komunitas: (akun_target, wa_target, status, kronologi, menit lalu).
# Pelapornya akun Buyer. Sengaja tidak ada laporan untuk @trustedseller_id supaya
# kondisi awal Task 1-2 sama untuk tiap peserta.
LAPORAN = [
    ("@gadget_murah88", "081399990001", "scam",
     "Transfer DP Rp500.000 untuk HP second, setelah itu nomor WhatsApp saya langsung diblokir penjual.", 45),
    ("@{toko}", "{wa_toko}", "aman",
     "Beli earphone TWS Rp350.000, barang dikirim sehari setelah transfer. Original dan berfungsi normal.", 120),
]


def slug_toko(nama):
    """Sama dengan frontend (seller.js): huruf kecil, tanpa spasi/simbol."""
    return re.sub(r"[^a-z0-9_]", "", (nama or "").lower())


class Command(BaseCommand):
    help = "Membuat akun Buyer & Seller untuk usability testing + data contoh."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset", action="store_true",
            help="Hapus laporan peserta untuk @trustedseller_id (jalankan di antara sesi peserta).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        akun = {}
        for username, nama, email, password, role, toko, wa in PENGGUNA:
            user = User.objects.filter(email__iexact=email).first()
            if user is None:
                if User.objects.filter(username=username).exists():
                    username = f"{username}_test"
                user = User(email=email, username=username)
            if not user.nomor_whatsapp:
                if User.objects.filter(nomor_whatsapp=wa).exclude(pk=user.pk).exists():
                    wa = None  # nomor contoh sudah dipakai akun lain; biarkan kosong
                user.nomor_whatsapp = wa
            user.first_name = nama
            user.role = role
            if role == "seller" and not user.toko_nama:
                user.toko_nama = toko
            user.terverifikasi = True  # lewati OTP pendaftaran
            user.is_active = True
            user.set_password(password)
            user.save()
            akun[role] = user
            self.stdout.write(f"  akun {role:<6} {email:<20} sandi: {password}")

        # Akun toko milik Seller di data reputasi (dipakai halaman "Akun Toko").
        seller = akun["seller"]
        toko = slug_toko(seller.toko_nama) or "seller"
        Akun.objects.update_or_create(
            username=toko,
            defaults={
                "nomor_wa": seller.nomor_whatsapp or "",
                "platform": "X (Twitter)",
                "rating": 4.5,
                "deskripsi": f"Akun toko {seller.toko_nama}.",
            },
        )

        if options.get("reset"):
            target = TRUSTEDSELLER["username"]
            hapus = Laporan.objects.filter(akun_target__iregex=rf"^@?{target}$")
            jumlah = hapus.count()
            hapus.delete()
            ada = Akun.objects.filter(username=target).first()
            if ada:
                ada.laporan_reputasi.all().delete()
                ada.transaksi_aman_detail.exclude(deskripsi__in=TRUSTEDSELLER["testimoni"]).delete()
                ada.transaksi_aman = TRUSTEDSELLER["transaksi_aman"]
                ada.save()
            self.stdout.write(f"  reset: {jumlah} laporan peserta untuk @{target} dihapus")

        # Akun @trustedseller_id untuk Task 1-3.
        ts, _ = Akun.objects.get_or_create(
            username=TRUSTEDSELLER["username"],
            defaults={
                "platform": "X (Twitter)",
                "rating": TRUSTEDSELLER["rating"],
                "transaksi_aman": TRUSTEDSELLER["transaksi_aman"],
            },
        )
        for teks in TRUSTEDSELLER["testimoni"]:
            if not ts.transaksi_aman_detail.filter(deskripsi=teks).exists():
                TransaksiAman.objects.create(akun=ts, deskripsi=teks)
        if ts.rating is None:
            ts.rating = TRUSTEDSELLER["rating"]
        ts.transaksi_aman = max(ts.transaksi_aman or 0, ts.transaksi_aman_detail.count())
        ts.save()

        # Laporan contoh untuk feed.
        sekarang = timezone.now()
        pelapor = akun["buyer"].nomor_whatsapp or "081100000101"
        baru = 0
        for target, wa, status_trans, kronologi, menit in LAPORAN:
            target = target.format(toko=toko)
            wa = wa.format(wa_toko=seller.nomor_whatsapp or "")
            if Laporan.objects.filter(akun_target=target, kronologi=kronologi).exists():
                continue
            laporan = Laporan.objects.create(
                akun_target=target,
                whatsapp_target=wa,
                status_transaksi=status_trans,
                kronologi=kronologi,
                nomor_pelapor=pelapor,
            )
            terbitkan_dan_sinkron(laporan)
            Laporan.objects.filter(pk=laporan.pk).update(diterbitkan=sekarang - timedelta(minutes=menit))
            baru += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seed usability testing selesai. Akun toko Seller: @{toko}. "
            f"{baru} laporan contoh baru ditambahkan."
        ))
