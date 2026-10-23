"""URL routing untuk app reputasi."""
from django.urls import path

from . import views

app_name = 'reputasi'

urlpatterns = [
    path('cari/', views.cari_akun, name='cari_akun'),
    path('<int:pk>/', views.detail_akun, name='detail_akun'),
    path('', views.daftar_akun, name='daftar_akun'),
]