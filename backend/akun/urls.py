from django.urls import path

from . import views

urlpatterns = [
    path("daftar/", views.daftar),
    path("masuk/", views.masuk),
    path("keluar/", views.keluar),
    path("saya/", views.saya),
    path("profil/", views.ubah_profil),
    path("ganti-password/", views.ganti_password),
    path("toko-saya/", views.toko_saya),
    path("otp/kirim/", views.kirim_otp),
    path("otp/verifikasi/", views.verifikasi_otp),
    path("otp/status/", views.status_otp),
]
