from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from sanggahan.views import csrf_token_view
from sanggahan.views import halaman_sanggahan

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('laporan.urls')),
    path('api/akun/', include('akun.urls')),
    path("api/",include("sanggahan.urls")),
    path("api/csrf/", csrf_token_view, name="csrf_token"),
    # Halaman HTML di luar folder backend
    path(
        "sanggahan/halaman/",
        halaman_sanggahan,
        name="halaman_sanggahan",
    ),
]

if settings.DEBUG:  # tampilkan file bukti saat development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
