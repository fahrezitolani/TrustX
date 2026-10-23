"""Tes otomatis untuk app reputasi."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Akun, LaporanReputasi, TransaksiAman


class ModelTest(TestCase):
    def test_akun_str(self):
        a = Akun.objects.create(username='seller_test', platform='X (Twitter)')
        self.assertEqual(str(a), '@seller_test')

    def test_akun_unique_username(self):
        Akun.objects.create(username='uniq_user', platform='X')
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Akun.objects.create(username='uniq_user', platform='X')


class NormalisasiTest(APITestCase):
    def test_normalisasi_x(self):
        from .views import normalisasi
        self.assertEqual(normalisasi('x', '@Seller_Gadget_Murah'), 'seller_gadget_murah')

    def test_normalisasi_wa_spasi(self):
        from .views import normalisasi
        self.assertEqual(normalisasi('wa', '0812-3456-7890'), '081234567890')

    def test_normalisasi_wa_plus62(self):
        from .views import normalisasi
        self.assertEqual(normalisasi('wa', '+6281234567890'), '081234567890')


class CariAkunTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.akun = Akun.objects.create(
            username='seller_gadget_murah',
            platform='X (Twitter)',
            rating=1.8,
            transaksi_aman=1,
        )
        LaporanReputasi.objects.create(
            akun=cls.akun,
            status_trans='scam',
            kronologi='Barang tidak pernah sampai setelah transfer.',
            hari_lalu=1,
            bukti_count=1,
            terverifikasi=True,
        )

    def test_cari_username_ditemukan(self):
        url = reverse('reputasi:cari_akun')
        response = self.client.get(url, {'m': 'x', 'q': '@seller_gadget_murah'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['ditemukan'])
        self.assertEqual(response.data['nama'], '@seller_gadget_murah')

    def test_cari_username_tidak_ditemukan(self):
        url = reverse('reputasi:cari_akun')
        response = self.client.get(url, {'m': 'x', 'q': '@tidak_ada'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['ditemukan'])

    def test_cari_wa_ditemukan(self):
        self.akun.nomor_wa = '081234567890'
        self.akun.save()
        url = reverse('reputasi:cari_akun')
        response = self.client.get(url, {'m': 'wa', 'q': '0812-3456-7890'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['ditemukan'])

    def test_cari_kurang_dari_3_karakter(self):
        url = reverse('reputasi:cari_akun')
        response = self.client.get(url, {'m': 'x', 'q': 'ab'})
        self.assertEqual(response.status_code, 400)


class DetailAkunTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.akun = Akun.objects.create(
            username='detail_test', platform='X (Twitter)', rating=4.5, transaksi_aman=3,
        )
        TransaksiAman.objects.create(
            akun=cls.akun,
            deskripsi='Barang tiba aman, packing tebal.',
        )

    def test_detail_akun(self):
        url = reverse('reputasi:detail_akun', kwargs={'pk': self.akun.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['nama'], '@detail_test')
        self.assertEqual(response.data['aman'], 3)
        self.assertEqual(len(response.data['transaksi']), 1)


class HitungStatusTest(TestCase):
    def test_status_none(self):
        a = Akun.objects.create(username='none_test', platform='X')
        from .serializers import hitung_status
        s = hitung_status(a)
        self.assertEqual(s['kode'], 'none')

    def test_status_safe(self):
        a = Akun.objects.create(username='safe_test', platform='X', transaksi_aman=5)
        from .serializers import hitung_status
        s = hitung_status(a)
        self.assertEqual(s['kode'], 'safe')

    def test_status_warn(self):
        a = Akun.objects.create(username='warn_test', platform='X')
        LaporanReputasi.objects.create(
            akun=a, status_trans='scam', kronologi='Tidak sampai.', hari_lalu=2,
        )
        from .serializers import hitung_status
        s = hitung_status(a)
        self.assertEqual(s['kode'], 'warn')

    def test_status_high(self):
        a = Akun.objects.create(username='high_test', platform='X')
        for i in range(5):
            LaporanReputasi.objects.create(
                akun=a, status_trans='scam', kronologi=f'Laporan {i}.', hari_lalu=i,
            )
        from .serializers import hitung_status
        s = hitung_status(a)
        self.assertEqual(s['kode'], 'high')