"""Serializer: validasi data dari frontend dan bentuk JSON untuk jawaban."""
import re

from django.db import transaction
from rest_framework import serializers

from .models import BuktiLaporan, Laporan

MAKS_KATA = 500
MAKS_BERKAS = 3
MAKS_UKURAN = 5 * 1024 * 1024  # 5MB


def samarkan(nomor):
    """081246817890 -> 0812-xxxx-7890"""
    digit = re.sub(r'\D', '', nomor or '')
    return f'{digit[:4]}-xxxx-{digit[-4:]}' if len(digit) >= 8 else 'xxxx'


class LaporanBaruSerializer(serializers.ModelSerializer):
    bukti = serializers.ListField(child=serializers.ImageField(), write_only=True)
    pernyataan = serializers.BooleanField(write_only=True)

    class Meta:
        model = Laporan
        fields = ['akun_target', 'whatsapp_target', 'bank_target', 'rekening_target',
                  'status_transaksi', 'kronologi', 'nomor_pelapor', 'bukti', 'pernyataan']

    def validate_akun_target(self, nilai):
        nilai = nilai.strip()
        if len(nilai) < 3:
            raise serializers.ValidationError('Isi username lawan transaksi.')
        return nilai

    def validate_kronologi(self, nilai):
        nilai = nilai.strip()
        if len(nilai) < 20:
            raise serializers.ValidationError('Tulis kronologi minimal 20 karakter.')
        if len(nilai.split()) > MAKS_KATA:
            raise serializers.ValidationError(f'Kronologi maksimal {MAKS_KATA} kata.')
        return nilai

    def validate_nomor_pelapor(self, nilai):
        if len(re.sub(r'\D', '', nilai)) < 8:
            raise serializers.ValidationError('Nomor WhatsApp pelapor tidak valid.')
        return nilai

    def validate_bukti(self, berkas):
        if not 1 <= len(berkas) <= MAKS_BERKAS:
            raise serializers.ValidationError(f'Unggah 1 sampai {MAKS_BERKAS} bukti.')
        for f in berkas:
            if f.size > MAKS_UKURAN:
                raise serializers.ValidationError(f'{f.name}: ukuran melebihi 5MB.')
            if f.image.format not in ('PNG', 'JPEG'):  # f.image diisi oleh ImageField
                raise serializers.ValidationError(f'{f.name}: hanya PNG atau JPG.')
        return berkas

    def validate_pernyataan(self, nilai):
        if not nilai:
            raise serializers.ValidationError('Pernyataan kebenaran data harus disetujui.')
        return nilai

    @transaction.atomic
    def create(self, data):
        berkas = data.pop('bukti')
        data.pop('pernyataan')
        laporan = Laporan.objects.create(**data)
        for f in berkas:
            BuktiLaporan.objects.create(laporan=laporan, berkas=f, ukuran=f.size)
        return laporan


class TiketSerializer(serializers.ModelSerializer):
    kategori = serializers.SerializerMethodField()
    pelapor = serializers.SerializerMethodField()

    class Meta:
        model = Laporan
        fields = ['nomor_tiket', 'akun_target', 'status_transaksi', 'kategori',
                  'diterbitkan', 'pelapor']

    def get_kategori(self, obj):
        if obj.status_transaksi == Laporan.StatusTransaksi.SCAM:
            return 'Penipuan WTS / Scam Transfer'
        return 'Transaksi Aman / Rekomendasi'

    def get_pelapor(self, obj):
        return samarkan(obj.nomor_pelapor)
