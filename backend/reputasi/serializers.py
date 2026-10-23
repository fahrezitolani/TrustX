"""Serializer untuk fitur Pencarian Reputasi Akun."""
import re

from rest_framework import serializers

from .models import Akun, LaporanReputasi, TransaksiAman


def samarkan(nomor):
    """081246817890 -> 0812-xxxx-7890"""
    digit = re.sub(r'\D', '', nomor or '')
    return f'{digit[:4]}-xxxx-{digit[-4:]}' if len(digit) >= 8 else 'xxxx'


class LaporanReputasiSerializer(serializers.ModelSerializer):
    """Serializer untuk satu laporan (bentuk array di frontend)."""

    class Meta:
        model = LaporanReputasi
        fields = ['nomor_tiket', 'hari_lalu', 'kronologi', 'bukti_count', 'terverifikasi']

    def to_representation(self, instance):
        """Kembalikan dalam bentuk array [id, hariLalu, kronologi, bukti, terverifikasi]."""
        return [
            instance.nomor_tiket or f'LP-{instance.id}',
            instance.hari_lalu,
            instance.kronologi,
            f'Bukti_{instance.id}.jpg' if instance.bukti_count else '',
            instance.terverifikasi,
        ]


class TransaksiAmanSerializer(serializers.ModelSerializer):
    """Serializer untuk satu riwayat transaksi aman."""

    class Meta:
        model = TransaksiAman
        fields = ['deskripsi']

    def to_representation(self, instance):
        return instance.deskripsi


class StatusReputasiSerializer(serializers.Serializer):
    """Serializer untuk objek status (kode, label, badge)."""
    kode = serializers.CharField()
    label = serializers.CharField()
    badge = serializers.CharField()


class AkunDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk response detail akun (frontend detail-profile.html)."""

    class Meta:
        model = Akun
        fields = ['id', 'username', 'platform', 'nomor_wa', 'rating', 'transaksi_aman']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        laporans = instance.laporan_reputasi.all().order_by('-dibuat')
        transaksi = instance.transaksi_aman_detail.all().order_by('-dibuat')
        return {
            'id': data['id'],
            'nama': f'@{data["username"]}',
            'platform': data['platform'],
            'wa': samarkan(data['nomor_wa']),
            'rating': data['rating'],
            'aman': data['transaksi_aman'],
            'status': hitung_status(instance),
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
            'transaksi': [t.deskripsi for t in transaksi],
        }


class AkunCariSerializer(serializers.ModelSerializer):
    """Serializer untuk response pencarian (frontend buyer.js fungsi cari())."""

    ditemukan = serializers.BooleanField()
    id = serializers.IntegerField(allow_null=True)
    nama = serializers.CharField(allow_null=True)
    platform = serializers.CharField(allow_null=True)
    wa = serializers.CharField(allow_null=True)
    rating = serializers.FloatField(allow_null=True)
    aman = serializers.IntegerField(allow_null=True)
    status = StatusReputasiSerializer(allow_null=True)
    laporan = serializers.ListField(allow_null=True)
    transaksi = serializers.ListField(allow_null=True)

    class Meta:
        model = Akun
        fields = ['ditemukan', 'id', 'nama', 'platform', 'wa', 'rating',
                  'aman', 'status', 'laporan', 'transaksi']


class AkunListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar akun (feed komunitas)."""

    class Meta:
        model = Akun
        fields = ['id', 'username', 'platform', 'rating', 'transaksi_aman']

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'nama': f'@{instance.username}',
            'platform': instance.platform,
            'rating': instance.rating,
            'aman': instance.transaksi_aman,
        }


def hitung_status(akun):
    """Aturan status yang sama dengan frontend buyer.js hitungStatus()."""
    laporans = akun.laporan_reputasi.all()
    n = laporans.count()
    v = laporans.filter(terverifikasi=True).count()
    if n >= 5 or v >= 3:
        return {'kode': 'high', 'label': 'Berisiko Tinggi', 'badge': 'b-red'}
    if n >= 1:
        return {'kode': 'warn', 'label': 'Perlu Diwaspadai', 'badge': 'b-amber'}
    if akun.transaksi_aman > 0:
        return {'kode': 'safe', 'label': 'Memiliki Riwayat Transaksi Aman', 'badge': 'b-green'}
    return {'kode': 'none', 'label': 'Belum Ada Laporan', 'badge': 'b-gray'}