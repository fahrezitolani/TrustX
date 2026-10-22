import io
import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from .models import Laporan


def gambar(nama='bukti.png', fmt='PNG'):
    buf = io.BytesIO()
    Image.new('RGB', (10, 10), 'white').save(buf, fmt)
    return SimpleUploadedFile(nama, buf.getvalue(), content_type='image/' + fmt.lower())


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())  # file tes tidak mengotori folder media asli
class AlurLaporanTest(TestCase):
    def setUp(self):
        self.c = APIClient()

    def data(self, **extra):
        d = {
            'akun_target': '@seller_gadget_murah', 'status_transaksi': 'scam',
            'kronologi': 'Barang tidak dikirim setelah transfer dilakukan kemarin sore.',
            'nomor_pelapor': '081246817890', 'pernyataan': 'true', 'bukti': [gambar()],
        }
        d.update(extra)
        return d

    def kirim(self, **extra):
        with patch('laporan.otp.kirim_wa') as kirim:
            r = self.c.post('/api/laporan/', self.data(**extra), format='multipart')
        return r, (kirim.call_args[0][1] if kirim.called else None)

    def test_alur_lengkap(self):
        r, kode = self.kirim()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['nomor_pelapor'], '0812-xxxx-7890')
        r2 = self.c.post('/api/otp/verifikasi/', {'laporan_id': r.data['laporan_id'], 'kode': kode}, format='json')
        self.assertEqual(r2.status_code, 200)
        tiket = r2.data['nomor_tiket']
        self.assertTrue(tiket.startswith('LP-'))
        r3 = self.c.get(f'/api/laporan/{tiket}/')
        self.assertEqual(r3.status_code, 200)
        self.assertEqual(r3.data['kategori'], 'Penipuan WTS / Scam Transfer')

    def test_laporan_belum_otp_tidak_bisa_dilihat(self):
        r, _ = self.kirim()
        self.assertEqual(Laporan.objects.get(pk=r.data['laporan_id']).status_laporan, 'menunggu_otp')
        self.assertEqual(self.c.get('/api/laporan/LP-2026-AAAA/').status_code, 404)

    def test_otp_salah_dan_batas_percobaan(self):
        r, kode = self.kirim()
        salah = '000000' if kode != '000000' else '111111'
        for _ in range(5):
            x = self.c.post('/api/otp/verifikasi/', {'laporan_id': r.data['laporan_id'], 'kode': salah}, format='json')
            self.assertEqual(x.status_code, 400)
        x = self.c.post('/api/otp/verifikasi/', {'laporan_id': r.data['laporan_id'], 'kode': kode}, format='json')
        self.assertEqual(x.status_code, 400)  # sudah diblokir walau kode benar

    def test_kirim_ulang_ada_jeda(self):
        r, _ = self.kirim()
        x = self.c.post('/api/otp/kirim/', {'laporan_id': r.data['laporan_id']}, format='json')
        self.assertEqual(x.status_code, 429)

    def test_validasi_input(self):
        self.assertEqual(self.kirim(bukti=[gambar(f'{i}.png') for i in range(4)])[0].status_code, 400)
        self.assertEqual(self.kirim(kronologi='kata ' * 501)[0].status_code, 400)
        self.assertEqual(self.kirim(pernyataan='false')[0].status_code, 400)
        self.assertEqual(self.kirim(bukti=[gambar('x.gif', 'GIF')])[0].status_code, 400)
        self.assertEqual(Laporan.objects.count(), 0)

    def test_cek_akun(self):
        r = self.c.get('/api/akun/?q=@baru')
        self.assertFalse(r.data['ditemukan'])
        for _ in range(3):
            Laporan.objects.create(
                akun_target='@Seller_X', whatsapp_target='0812', status_transaksi='scam', kronologi='x' * 30,
                nomor_pelapor='081200000000', status_laporan='terbit', diterbitkan=timezone.now())
        r = self.c.get('/api/akun/?q=@seller_x')
        self.assertTrue(r.data['scam'])
        self.assertEqual(r.data['jumlah_scam_7_hari'], 3)
