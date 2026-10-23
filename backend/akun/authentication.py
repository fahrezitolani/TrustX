from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication


class TokenAuthentication(TokenAuthentication):
    """Token autentikasi dengan batas TTL.

    Token yang sudah lewat ``AKTUN_API_TOKEN_TTL_HARI`` (default 30 hari)
    tidak bisa dipakai lagi.
    """

    keyword = "Token"

    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related("user").get(key=key)
        except model.DoesNotExist:
            raise exceptions.AuthenticationFailed("Token tidak valid.")

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed("Pengguna tidak aktif atau telah dihapus.")

        ttl = getattr(settings, "AKTUN_API_TOKEN_TTL_HARI", 30)
        if token.created < timezone.now() - timedelta(days=ttl):
            raise exceptions.AuthenticationFailed("Token kedaluwarsa. Silakan login ulang.")

        return token.user, token
