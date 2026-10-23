from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Akun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(db_index=True, help_text='Username X tanpa prefix @, lowercase.', max_length=100, unique=True)),
                ('nomor_wa', models.CharField(blank=True, help_text='Nomor WhatsApp dalam format 08xx (tanpa spasi/dash).', max_length=30)),
                ('platform', models.CharField(help_text='Contoh: X (Twitter), Instagram, WhatsApp.', max_length=50)),
                ('rating', models.FloatField(blank=True, help_text='Rating 0.0 - 5.0.', null=True)),
                ('transaksi_aman', models.PositiveIntegerField(default=0, help_text='Jumlah transaksi aman yang dilaporkan oleh komunitas.')),
                ('deskripsi', models.TextField(blank=True, help_text='Deskripsi singkat akun (opsional).')),
                ('dibuat', models.DateTimeField(auto_now_add=True)),
                ('diperbarui', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-dibuat'],
                'verbose_name': 'Akun',
                'verbose_name_plural': 'Akun',
            },
        ),
        migrations.CreateModel(
            name='LaporanReputasi',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nomor_tiket', models.CharField(blank=True, help_text='Nomor tiket laporan (LP-YYYY-XXXXX).', max_length=20)),
                ('status_trans', models.CharField(choices=[('scam', 'Tertipu/Scam'), ('aman', 'Aman/Rekomendasi')], max_length=10)),
                ('kronologi', models.TextField(help_text='Kronologi kejadian (maksimal 500 kata).')),
                ('hari_lalu', models.PositiveSmallIntegerField(default=0, help_text='0 = hari ini, 1 = kemarin, dst.')),
                ('bukti_count', models.PositiveSmallIntegerField(default=0, help_text='Jumlah berkas bukti yang diunggah.')),
                ('terverifikasi', models.BooleanField(default=False, help_text='True jika laporan sudah diverifikasi oleh admin.')),
                ('dibuat', models.DateTimeField(auto_now_add=True)),
                ('akun', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='laporan_reputasi', to='reputasi.akun')),
            ],
            options={
                'ordering': ['-dibuat'],
                'verbose_name': 'Laporan Reputasi',
                'verbose_name_plural': 'Laporan Reputasi',
            },
        ),
        migrations.CreateModel(
            name='TransaksiAman',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deskripsi', models.TextField(help_text='Deskripsi transaksi aman (contoh: "Barang tiba aman, packing tebal").')),
                ('dilaporkan_oleh', models.CharField(blank=True, help_text='Nomor WA pelapor (samarkan: 0812-xxxx-7890).', max_length=30)),
                ('dibuat', models.DateTimeField(auto_now_add=True)),
                ('akun', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='transaksi_aman_detail', to='reputasi.akun')),
            ],
            options={
                'ordering': ['-dibuat'],
                'verbose_name': 'Transaksi Aman',
                'verbose_name_plural': 'Transaksi Aman',
            },
        ),
    ]