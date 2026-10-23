from django.contrib import admin

from .models import Akun, LaporanReputasi, TransaksiAman


@admin.register(Akun)
class AkunAdmin(admin.ModelAdmin):
    list_display = ['username', 'platform', 'rating', 'transaksi_aman', 'dibuat']
    list_filter = ['platform']
    search_fields = ['username', 'nomor_wa']
    ordering = ['-dibuat']


@admin.register(LaporanReputasi)
class LaporanReputasiAdmin(admin.ModelAdmin):
    list_display = ['nomor_tiket', 'akun', 'status_trans', 'hari_lalu',
                    'bukti_count', 'terverifikasi', 'dibuat']
    list_filter = ['status_trans', 'terverifikasi']
    search_fields = ['kronologi', 'nomor_tiket']
    ordering = ['-dibuat']


@admin.register(TransaksiAman)
class TransaksiAmanAdmin(admin.ModelAdmin):
    list_display = ['akun', 'deskripsi', 'dibuat']
    search_fields = ['deskripsi']
    ordering = ['-dibuat']