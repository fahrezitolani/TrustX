"""View: satu fungsi = satu endpoint API."""
import re

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Akun, LaporanReputasi, TransaksiAman
from .serializers import (
    AkunDetailSerializer,
    AkunListSerializer,
    hitung_status,
)


def normalisasi(m, q):
    """Normalisasi kata kunci pencarian sesuai mode."""
    q = q.strip()
    if m == 'x':
        return q.replace('@', '').lower()
    # mode wa: hapus spasi, dash, prefix +
    d = re.sub(r'[\s-]', '', q).lstrip('+')
    if d.startswith('62'):
        return '0' + d[2:]
    return d


def cari_akun_obj(m, q):
    """Cari akun di database. Kembalikan objek Akun atau None."""
    k = normalisasi(m, q)
    if m == 'wa':
        return Akun.objects.filter(nomor_wa=k).first()
    return Akun.objects.filter(username__iexact=k).first()


def _samarkan_wa(nomor):
    """Samarkan nomor WA: 081234567890 -> 0812-xxxx-7890."""
    if not nomor:
        return ''
    digit = re.sub(r'\D', '', nomor)
    return f'{digit[:4]}-xxxx-{digit[-4:]}' if len(digit) >= 8 else 'xxxx'


def _bangun_response(akun):
    """Bangun response sesuai frontend buyer.js fungsi cari()."""
    laporans = akun.laporan_reputasi.all().order_by('-dibuat')
    return {
        'ditemukan': True,
        'id': akun.id,
        'nama': f'@{akun.username}',
        'platform': akun.platform,
        'wa': _samarkan_wa(akun.nomor_wa),
        'rating': akun.rating,
        'aman': akun.transaksi_aman,
        'status': hitung_status(akun),
        'laporan': [
            [
                l.nomor_tiket or f'LP-{l.id}',
                l.hari_lalu,
                l.kronologi,
                f'Bukti_{l.id}.jpg' if l.bukti_count else '',
                l.terverifikasi,
            ]
            for l in laporans
        ],
        'transaksi': [t.deskripsi for t in akun.transaksi_aman_detail.all()],
    }


def response_tidak_ditemukan():
    """Response standar ketika akun tidak ditemukan."""
    return {
        'ditemukan': False,
        'id': None,
        'nama': None,
        'platform': None,
        'wa': None,
        'rating': None,
        'aman': None,
        'status': None,
        'laporan': None,
        'transaksi': None,
    }


# ─── Endpoint API ────────────────────────────────────────────────

@api_view(['GET'])
def cari_akun(request):
    """GET /api/akun/cari/?m=x&q=@username  OR  ?m=wa&q=081234567890"""
    m = request.query_params.get('m', 'x')
    q = request.query_params.get('q', '').strip()

    if len(q) < 3:
        return Response(
            {'detail': 'Isi username minimal 3 karakter.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    akun = cari_akun_obj(m, q)
    if not akun:
        return Response(response_tidak_ditemukan())

    return Response(_bangun_response(akun))


@api_view(['GET'])
def detail_akun(request, pk):
    """GET /api/akun/<id>/ -> data lengkap untuk halaman detail."""
    akun = get_object_or_404(Akun, pk=pk)
    serializer = AkunDetailSerializer(akun)
    return Response(serializer.data)


@api_view(['GET'])
def daftar_akun(request):
    """GET /api/akun/ -> daftar semua akun ( untuk feed komunitas)."""
    qs = Akun.objects.filter(
        Q(laporan_reputasi__isnull=False) |
        Q(transaksi_aman_detail__isnull=False)
    ).distinct().order_by('-dibuat')
    serializer = AkunListSerializer(qs, many=True)
    return Response(serializer.data)