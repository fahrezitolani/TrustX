"""View: satu fungsi = satu endpoint API."""
from datetime import timedelta

from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import otp
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
    """POST /api/laporan/ (multipart) -> simpan laporan, lalu kirim OTP"""
    serializer = LaporanBaruSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    laporan = serializer.save()
    otp.buat_dan_kirim(laporan, laporan.nomor_pelapor)
    return Response(
        {'laporan_id': laporan.id, 'nomor_pelapor': samarkan(laporan.nomor_pelapor)},
        status=status.HTTP_201_CREATED,
    )


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
    laporan.terbitkan()
    return Response(TiketSerializer(laporan).data)


@api_view(['GET'])
def detail_tiket(request, nomor_tiket):
    """GET /api/laporan/<nomor_tiket>/ -> data untuk success.html"""
    laporan = get_object_or_404(Laporan, nomor_tiket=nomor_tiket, status_laporan=Laporan.StatusLaporan.TERBIT)
    return Response(TiketSerializer(laporan).data)
