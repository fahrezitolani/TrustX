from django.urls import path
from . import views, oauth_views
from reputasi.views import cari_akun

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
    path("cari/", cari_akun),
    # OAuth sosial login (placeholder, aktif setelah kredensial diisi)
    path("oauth/google/start/", oauth_views.google_start),
    path("oauth/google/callback/", oauth_views.google_callback),
    path("oauth/x/start/", oauth_views.x_start),
    path("oauth/x/callback/", oauth_views.x_callback),
]
