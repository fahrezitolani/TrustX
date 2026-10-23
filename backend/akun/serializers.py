"""Serializer: validasi input dari form daftar/login dan bentuk JSON respons."""
import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

PESAN_NOMOR = "Nomor WhatsApp tidak valid (minimal 8 angka)."


def validasi_nomor(value):
    if len(re.sub(r"\D", "", value or "")) < 8:
        raise serializers.ValidationError(PESAN_NOMOR)
    return value


def samarkan_nomor(nomor):
    """081246817890 -> 0812-xxxx-7890"""
    digit = re.sub(r"\D", "", nomor or "")
    return f"{digit[:4]}-xxxx-{digit[-4:]}" if len(digit) >= 8 else "xxxx"


def _username_unik(email):
    """Username dari awal email; tambah angka kalau sudah dipakai akun lain."""
    dasar = re.sub(r"\W", "", email.split("@")[0])[:140] or "pengguna"
    username, n = dasar, 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{dasar}{n}"
    return username


class DaftarSerializer(serializers.Serializer):
    """Isi form `daftar.html`: nama, WhatsApp, email, sandi, peran."""

    nama = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    wa = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["buyer", "seller"], default="buyer")
    toko_nama = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_wa(self, value):
        return validasi_nomor(value.strip())

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email sudah terdaftar.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        confirm = data.get("confirmPassword") or ""
        if confirm and confirm != data["password"]:
            raise serializers.ValidationError({"confirmPassword": "Konfirmasi kata sandi tidak sama."})
        if User.objects.filter(nomor_whatsapp=data["wa"]).exists():
            raise serializers.ValidationError({"wa": "Nomor WhatsApp sudah terdaftar."})
        if data.get("role") == "seller" and not data.get("toko_nama"):
            raise serializers.ValidationError({"toko_nama": "Nama toko wajib diisi untuk penjual."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirmPassword", None)
        nama = validated_data.pop("nama").strip()
        email = validated_data.pop("email")
        nomor = validated_data.pop("wa")
        return User.objects.create_user(
            username=_username_unik(email),
            email=email,
            first_name=nama,
            password=validated_data.pop("password"),
            nomor_whatsapp=nomor,
            **validated_data,
        )


class PenggunaSerializer(serializers.ModelSerializer):
    """Data pengguna yang aman dikirim ke frontend (tanpa sandi)."""

    telepon = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "email", "nomor_whatsapp", "telepon",
                  "role", "toko_nama", "terverifikasi", "date_joined"]

    def get_telepon(self, obj):
        return samarkan_nomor(obj.nomor_whatsapp)


class ProfilSerializer(serializers.ModelSerializer):
    """Isi form profil.html + pengaturan akun toko."""

    class Meta:
        model = User
        fields = ["first_name", "nomor_whatsapp", "toko_nama"]

    def validate_nomor_whatsapp(self, value):
        value = value.strip()
        if User.objects.filter(nomor_whatsapp=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Nomor WhatsApp sudah dipakai akun lain.")
        return validasi_nomor(value)


class GantiPasswordSerializer(serializers.Serializer):
    lama = serializers.CharField(write_only=True)
    baru = serializers.CharField(write_only=True)

    def validate_lama(self, value):
        if not self.context["user"].check_password(value):
            raise serializers.ValidationError("Kata sandi lama salah.")
        return value

    def validate_baru(self, value):
        validate_password(value, self.context["user"])
        return value
