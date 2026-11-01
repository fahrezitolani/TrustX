"""View: satu fungsi = satu endpoint API."""
from datetime import timedelta

from django.conf import settings
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import otp
from .layanan import terbitkan_dan_sinkron
from .models import Laporan
from .serializers import LaporanBaruSerializer, TiketSerializer, samarkan

AMBANG_SCAM = 3  # jumlah laporan scam dalam 7 hari agar akun ditandai scam


@api_view(['GET'])
def cek_akun(request):
    """GET /api/akun/?q=@username -> data kartu identitas di lapor.html"""
    q = request.query_params.get('q', '').strip()
    if len(q) < 3:
        return Response({'detail': 'Isi username minimal 3 karakter.'}, status=400)

    terbit = Laporan.objects.filter(akun_target__iexact=q, status_laporan=Laporan.StatusLaporan.TERBIT)
    terbaru = terbit.first()  # urutan default: paling baru dulu
    batas = timezone.now() - timedelta(days=7)
    jumlah = terbit.filter(status_transaksi=Laporan.StatusTransaksi.SCAM, diterbitkan__gte=batas).count()
    return Response({
        'akun': q,
        'ditemukan': terbaru is not None,
        'whatsapp': terbaru.whatsapp_target if terbaru else '',
        'bank': terbaru.bank_target if terbaru else '',
        'rekening': terbaru.rekening_target if terbaru else '',
        'jumlah_scam_7_hari': jumlah,
        'scam': jumlah >= AMBANG_SCAM,
    })


@api_view(['POST'])
def buat_laporan(request):
    """POST /api/laporan/ (multipart) -> simpan laporan.

    - LAPORAN_PERLU_OTP mati (default): laporan langsung terbit, respons berisi nomor_tiket.
    - LAPORAN_PERLU_OTP nyala: kirim OTP, laporan terbit setelah /api/otp/verifikasi/.
    """
    serializer = LaporanBaruSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    laporan = serializer.save()
    data = {'laporan_id': laporan.id, 'nomor_pelapor': samarkan(laporan.nomor_pelapor)}

    if not getattr(settings, 'LAPORAN_PERLU_OTP', False):
        terbitkan_dan_sinkron(laporan)
        data.update({'perlu_otp': False, 'nomor_tiket': laporan.nomor_tiket})
        return Response(data, status=status.HTTP_201_CREATED)

    otp.buat_dan_kirim(laporan, laporan.nomor_pelapor)
    data['perlu_otp'] = True
    return Response(data, status=status.HTTP_201_CREATED)


def _laporan_menunggu(raw_id):
    try:
        pk = int(raw_id)
    except (TypeError, ValueError):
        raise Http404
    return get_object_or_404(Laporan, pk=pk, status_laporan=Laporan.StatusLaporan.MENUNGGU_OTP)


@api_view(['POST'])
def kirim_otp(request):
    """POST /api/otp/kirim/ {laporan_id} -> kirim ulang kode"""
    laporan = _laporan_menunggu(request.data.get('laporan_id'))
    try:
        otp.buat_dan_kirim(laporan, laporan.nomor_pelapor)
    except otp.OTPError as e:
        return Response({'detail': str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    return Response({'detail': 'Kode baru dikirim ke WhatsApp Anda.'})


@api_view(['POST'])
def verifikasi_otp(request):
    """POST /api/otp/verifikasi/ {laporan_id, kode} -> terbitkan laporan"""
    laporan = _laporan_menunggu(request.data.get('laporan_id'))
    try:
        otp.verifikasi(laporan, str(request.data.get('kode', '')))
    except otp.OTPError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    terbitkan_dan_sinkron(laporan)
    return Response(TiketSerializer(laporan).data)


@api_view(['GET'])
def detail_tiket(request, nomor_tiket):
    """GET /api/laporan/<nomor_tiket>/ -> data untuk success.html"""
    laporan = get_object_or_404(Laporan, nomor_tiket=nomor_tiket, status_laporan=Laporan.StatusLaporan.TERBIT)
    return Response(TiketSerializer(laporan).data)


def _jumlah_bukti(laporan):
    """Hitung bukti terlampir. Sesuaikan nama relasi dengan models.py kamu."""
    for nama in ("bukti", "bukti_set"):
        rel = getattr(laporan, nama, None)
        if rel is not None and hasattr(rel, "count"):
            return rel.count()
    return 0


@api_view(['GET'])
def laporan_akun(request):
    """GET /api/laporan-akun/ (?akun=@nama) -> daftar laporan terbit untuk laporanpage.html"""
    terbit = Laporan.objects.filter(status_laporan=Laporan.StatusLaporan.TERBIT)
    akun = request.query_params.get('akun', '').strip()
    if akun:
        terbit = terbit.filter(akun_target__iexact=akun)
    terbit = terbit.order_by('-diterbitkan')

    return Response({'laporan': [{
        'nomor_tiket': l.nomor_tiket,
        'akun': l.akun_target,
        'whatsapp': samarkan(l.whatsapp_target) if l.whatsapp_target else '',
        'statusTransaksi': l.status_transaksi,
        'kronologi': l.kronologi,
        'jumlahBukti': _jumlah_bukti(l),
        'diterbitkan': l.diterbitkan.isoformat() if l.diterbitkan else None,
    } for l in terbit]})