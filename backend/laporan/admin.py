from django.contrib import admin
from .models import Laporan, BuktiLaporan


class BuktiInline(admin.TabularInline):
    model = BuktiLaporan
    extra = 0
    readonly_fields = ('ukuran', 'dibuat')


@admin.register(Laporan)
class LaporanAdmin(admin.ModelAdmin):
    list_display = ('nomor_tiket', 'akun_target', 'status_transaksi', 'status_laporan', 'dibuat')
    list_filter = ('status_transaksi', 'status_laporan')
    search_fields = ('nomor_tiket', 'akun_target', 'nomor_pelapor')
    readonly_fields = ('nomor_tiket', 'dibuat', 'diterbitkan')
    inlines = [BuktiInline]