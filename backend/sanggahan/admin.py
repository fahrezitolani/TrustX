
from django.contrib import admin
from .models import Sanggahan, BuktiSanggahan


class BuktiSanggahanInline(admin.TabularInline):
    model = BuktiSanggahan
    extra = 0


@admin.register(Sanggahan)
class SanggahanAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "report_id",
        "store_name",
        "status",
        "created_at",
    )
    list_filter = ("status", "reason")
    search_fields = ("report_id", "store_name")
    inlines = [BuktiSanggahanInline]


@admin.register(BuktiSanggahan)
class BuktiSanggahanAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sanggahan",
        "nama_asli",
        "created_at",
    )
