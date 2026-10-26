from django.urls import path

from . import views

urlpatterns = [
    path('akun/', views.cek_akun),
    path('laporan/', views.buat_laporan),
    path('laporan/<str:nomor_tiket>/', views.detail_tiket),
    path('otp/kirim/', views.kirim_otp),
    path('otp/verifikasi/', views.verifikasi_otp),
    path('laporan-akun/', views.laporan_akun),
]
