"""View fitur Autentikasi & Akun.

Semua endpoint mengembalikan JSON dengan bentuk konsisten:
`{"detail": "...", ...}` untuk pesan, dan objek user di key `user`.
Token autentikasi (DRF Token) dipakai karena frontend berupa HTML statis
yang dibuka dari origin berbeda (Live Server), bukan satu domain dengan API.
"""
import uuid
from django.contrib.auth import authenticate, update_session_auth_hash
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from laporan import otp
from .models import KodeOTP, User
from .serializers import (
    DaftarSerializer,
    GantiPasswordSerializer,
    PenggunaSerializer,
    ProfilSerializer,
)


class ThrottleOTP(AnonRateThrottle):
    """Batasi permintaan OTP: 6x per menit per IP (scope 'otp' di settings)."""

    scope = "otp"


def _hasil(user, detail, kode=status.HTTP_200_OK):
    """Bungkus respons sukses berisi user + token."""
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"detail": detail, "token": token.key, "user": PenggunaSerializer(user).data},
                    status=kode)


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # token kedaluwarsa tidak boleh menghalangi login
@throttle_classes([AnonRateThrottle])
def daftar(request):
    """POST /api/akun/daftar/ -> buat akun, langsung kirim OTP verifikasi."""
    ser = DaftarSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    with transaction.atomic():
        user = ser.save()
        try:
            otp.buat_dan_kirim(user, user.nomor_whatsapp)
        except otp.OTPError as e:
            # akun tetap dibuat; pengguna bisa minta kode lewat /otp/kirim/
            return Response({"detail": f"Akun dibuat, tetapi kode gagal dikirim: {e}",
                             "user": PenggunaSerializer(user).data},
                            status=status.HTTP_201_CREATED)

    return _hasil(user, "Pendaftaran berhasil. Kode OTP sudah dikirim ke WhatsApp Anda.",
                  status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # token kedaluwarsa tidak boleh menghalangi login
@throttle_classes([AnonRateThrottle])
def masuk(request):
    """POST /api/akun/masuk/ {email, password} -> tukar kredensial jadi token."""
    email = str(request.data.get("email", "")).strip().lower()
    password = str(request.data.get("password", ""))

    # login pakai email; fallback ke username kalau email tidak ketemu
    akun = User.objects.filter(email__iexact=email).first() if email else None
    if akun is None and email:
        akun = User.objects.filter(username__iexact=email).first()

    if akun is None:
        return Response({"detail": "Email atau kata sandi salah."},
                        status=status.HTTP_400_BAD_REQUEST)

    # akun belum terverifikasi OTP, blokir login
    if not akun.terverifikasi:
        return Response({"detail": "Akun belum diverifikasi. Silakan verifikasi OTP terlebih dahulu."},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=akun.username, password=password) if akun else None
    if user is None:
        return Response({"detail": "Email atau kata sandi salah."},
                        status=status.HTTP_400_BAD_REQUEST)

    return _hasil(user, "Login berhasil.")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def keluar(request):
    """POST /api/akun/keluar/ -> hapus token agar sesi berakhir."""
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "Berhasil keluar."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def saya(request):
    """GET /api/akun/saya/ -> data akun yang sedang login (profil.html)."""
    return Response(PenggunaSerializer(request.user).data)


@api_view(["PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def ubah_profil(request):
    """PATCH /api/akun/profil/ {first_name, nomor_whatsapp, toko_nama}."""
    ser = ProfilSerializer(request.user, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response({"detail": "Profil diperbarui.", "user": PenggunaSerializer(request.user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ganti_password(request):
    """POST /api/akun/ganti-password/ {lama, baru} -> ganti sandi (keamanan-akun.html)."""
    ser = GantiPasswordSerializer(data=request.data, context={"user": request.user})
    ser.is_valid(raise_exception=True)
    request.user.set_password(ser.validated_data["baru"])
    request.user.save()
    update_session_auth_hash(request, request.user)
    Token.objects.filter(user=request.user).delete()  # sesi lama dipaksa login ulang
    return Response({"detail": "Kata sandi diubah. Silakan masuk kembali dengan sandi baru."})


# ---------- Verifikasi OTP akun ----------

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def kirim_otp(request):
    """POST /api/akun/otp/kirim/ {email} -> kirim ulang kode verifikasi.

    Balasan sengaja seragam (200 + kalimat sama) untuk email terdaftar,
    tidak terdaftar, maupun saat masih dalam jeda 45 detik — supaya
    endpoint ini tidak bisa dipakai menebak email mana yang punya akun.
    """
    email = str(request.data.get("email", "")).strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    sama = "Kalau email terdaftar, kode sudah dikirim ke WhatsApp Anda."
    if user is None:
        return Response({"detail": sama})

    try:
        otp.buat_dan_kirim(user, user.nomor_whatsapp)
    except otp.OTPError:
        pass  # sedang dalam jeda kirim ulang; balasan tetap sama
    return Response({"detail": sama})


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def verifikasi_otp(request):
    """POST /api/akun/otp/verifikasi/ {email, kode} -> tandai akun terverifikasi.

    Respons diseragamkan supaya penyerang tidak bisa membedakan
    email terdaftar / tidak terdaftar dari pesan error.
    """
    email = str(request.data.get("email", "")).strip().lower()
    kode = str(request.data.get("kode", ""))
    user = User.objects.filter(email__iexact=email).first()
    if user is not None:
        try:
            otp.verifikasi(user, kode)
        except otp.OTPError:
            pass
        else:
            user.terverifikasi = True
            user.save(update_fields=["terverifikasi"])
            return _hasil(user, "Akun berhasil diverifikasi.")
    return Response({"detail": "Kode OTP tidak ditemukan. Minta kode baru."},
                    status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def toko_saya(request):
    """GET /api/akun/toko-saya/ -> data toko milik penjual yang sedang login."""
    user = request.user
    if user.role != "seller":
        return Response({"detail": "Hanya penjual yang dapat mengakses endpoint ini."},
                        status=status.HTTP_403_FORBIDDEN)
    return Response({
        "id": user.id,
        "username": user.username,
        "toko_nama": user.toko_nama,
        "nomor_whatsapp": user.nomor_whatsapp,
        "email": user.email,
        "role": user.role,
        "terverifikasi": user.terverifikasi,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([AnonRateThrottle])
def status_otp(request):
    """POST /api/akun/otp/status/ {email} -> cek apakah akun sudah diverifikasi.

    Respons diseragamkan supaya penyerang tidak bisa menebak email
    mana yang terdaftar dari beda struktur JSON.
    """
    email = str(request.data.get("email", "")).strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    if user is not None:
        aktif = KodeOTP.objects.filter(pemilik=user, terpakai=False).exists()
        return Response({"terverifikasi": user.terverifikasi, "ada_kode_aktif": aktif})
    return Response({"terverifikasi": False, "ada_kode_aktif": False})
