from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import KodeOTP, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "nomor_whatsapp", "terverifikasi", "is_staff")
    list_filter = ("role", "terverifikasi", "is_staff")
    search_fields = ("username", "email", "nomor_whatsapp")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("TrustX", {"fields": ("role", "toko_nama", "nomor_whatsapp", "terverifikasi")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("TrustX", {"fields": ("role", "toko_nama", "nomor_whatsapp")}),
    )


@admin.register(KodeOTP)
class KodeOTPAdmin(admin.ModelAdmin):
    list_display = ("pemilik", "dibuat", "kedaluwarsa", "percobaan", "terpakai")
    list_filter = ("terpakai",)
    search_fields = ("pemilik__email", "pemilik__username")
