"""Logika OTP: buat kode, kirim (simulasi), dan verifikasi."""
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .models import KodeOTP

MASA_BERLAKU = timedelta(minutes=5)      # kode hangus setelah 5 menit
JEDA_KIRIM_ULANG = timedelta(seconds=45)  # sama dengan hitungan mundur di frontend
MAKS_PERCOBAAN = 5


class OTPError(Exception):
    """Dipakai untuk pesan error OTP yang aman ditampilkan ke pengguna."""


def kirim_wa(nomor, kode):
    # TODO: ganti dengan API WhatsApp sungguhan (mis. Fonnte / Twilio).
    # Untuk sekarang kode hanya dicetak di terminal tempat `runserver` berjalan.
    print(f'[OTP SIMULASI] kirim ke {nomor}: {kode}')


def buat_dan_kirim(laporan):
    sekarang = timezone.now()
    terakhir = laporan.kode_otp.order_by('-dibuat').first()
    if terakhir and sekarang - terakhir.dibuat < JEDA_KIRIM_ULANG:
        sisa = int((JEDA_KIRIM_ULANG - (sekarang - terakhir.dibuat)).total_seconds()) + 1
        raise OTPError(f'Tunggu {sisa} detik sebelum meminta kode baru.')

    kode = f'{secrets.randbelow(10 ** 6):06d}'
    laporan.kode_otp.update(terpakai=True)  # kode lama otomatis tidak berlaku
    KodeOTP.objects.create(
        laporan=laporan, kode_hash=make_password(kode), kedaluwarsa=sekarang + MASA_BERLAKU
    )
    kirim_wa(laporan.nomor_pelapor, kode)


def verifikasi(laporan, kode):
    otp = laporan.kode_otp.filter(terpakai=False).order_by('-dibuat').first()
    if not otp:
        raise OTPError('Kode OTP tidak ditemukan. Minta kode baru.')
    if timezone.now() > otp.kedaluwarsa:
        raise OTPError('Kode OTP kedaluwarsa. Minta kode baru.')
    if otp.percobaan >= MAKS_PERCOBAAN:
        raise OTPError('Terlalu banyak percobaan. Minta kode baru.')

    otp.percobaan += 1
    if not check_password(kode, otp.kode_hash):
        otp.save(update_fields=['percobaan'])
        raise OTPError('Kode OTP salah. Periksa kembali.')
    otp.terpakai = True
    otp.save(update_fields=['percobaan', 'terpakai'])
