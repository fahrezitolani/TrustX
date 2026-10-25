"""Login sosial (OAuth 2.0) untuk Google dan X.

Alur: `start()` menyiapkan `state` + PKCE (S256), menyimpannya di session, lalu
redirect ke provider. `callback()` memeriksa ulang `state`, menukar `code` jadi
access token, mengambil identitas, lalu membuat/menautkan User dan menerbitkan
DRF Token. Token dikirim balik ke frontend lewat `login.html?oauth_token=...`.

HTTP memakai urllib dari stdlib — tidak ada dependency baru.
"""
import base64
import hashlib
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import User

TIMEOUT = 15


class OAuthError(Exception):
    """Kegagalan saat bicara dengan provider (jaringan / balasan error)."""


# ---------- util umum ----------

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _callback_url(provider):
    return f"{settings.OAUTH_CALLBACK_BASE}/api/akun/oauth/{provider}/callback/"


def _mulai(request, provider):
    """Simpan state + code_verifier di session; kembalikan (state, challenge S256)."""
    state = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(64)
    request.session["oauth_provider"] = provider
    request.session["oauth_state"] = state
    request.session["oauth_verifier"] = verifier
    return state, _b64url(hashlib.sha256(verifier.encode()).digest())


def _selesai(request, provider):
    """Ambil state/verifier dari session lalu hapus (sekali pakai).

    Balikan None kalau session tidak berasal dari alur provider ini.
    """
    if request.session.get("oauth_provider") != provider:
        return None
    state = request.session.pop("oauth_state", None)
    verifier = request.session.pop("oauth_verifier", None)
    request.session.pop("oauth_provider", None)
    return state, verifier


def _belum_dikonfigurasi(nama, variabel):
    return Response(
        {"detail": f"Login {nama} belum dikonfigurasi. Isi {variabel} di backend/.env."},
        status=501,
    )


def _ke_login(**params):
    """Kembalikan pengguna ke halaman login frontend, sertakan pesan/token."""
    return HttpResponseRedirect(
        f"{settings.FRONTEND_BASE}/login.html?{urllib.parse.urlencode(params)}"
    )


def _post_form(url, data, headers=None):
    req = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(data).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded", **(headers or {})},
    )
    return _baca_json(req)


def _get_json(url, headers):
    return _baca_json(urllib.request.Request(url, headers=headers))


def _baca_json(req):
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        pesan = e.read()[:200].decode(errors="replace")
        raise OAuthError(f"provider membalas {e.code}: {pesan}") from e
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        raise OAuthError(str(e)) from e


def _terbitkan(user):
    """Terbitkan DRF Token lalu kembalikan pengguna ke login.html dengan token."""
    token, _ = Token.objects.get_or_create(user=user)
    return _ke_login(oauth_token=token.key)


def _username_unik(dasar):
    """Username dari email/handle; tambah angka kalau sudah dipakai."""
    dasar = "".join(c for c in dasar if c.isalnum()) or "pengguna"
    dasar = dasar[:140]
    username, n = dasar, 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{dasar}{n}"
    return username


def _cari_atau_buat(field, uid, *, email="", nama="", dasar_username=""):
    """User untuk identitas provider: cari → tautkan lewat email → buat baru."""
    user = User.objects.filter(**{field: uid}).first()
    if user is not None:
        return user

    if email:
        user = User.objects.filter(email__iexact=email).first()
        if user is not None:  # akun lama dengan email sama: tautkan, jangan gandakan
            setattr(user, field, uid)
            user.terverifikasi = True
            user.save(update_fields=[field, "terverifikasi"])
            return user

    try:
        with transaction.atomic():
            user = User(
                username=_username_unik(dasar_username or email.split("@")[0]),
                email=email,
                first_name=(nama or "")[:150],
                terverifikasi=True,  # identitas sudah dipercaya provider
                **{field: uid},
            )
            user.set_unusable_password()  # login hanya lewat provider sampai sandi dibuat
            user.save()
            return user
    except IntegrityError as e:
        raise OAuthError(f"gagal menyimpan akun: {e}") from e


# ---------- Google ----------

@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def google_start(request):
    if not settings.GOOGLE_CLIENT_ID:
        return _belum_dikonfigurasi("Google", "GOOGLE_CLIENT_ID")

    state, challenge = _mulai(request, "google")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _callback_url("google"),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    }
    return HttpResponseRedirect(
        "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    )


@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def google_callback(request):
    if request.GET.get("error"):
        return _ke_login(oauth_error="Login Google dibatalkan.")

    sesi = _selesai(request, "google")
    if not sesi or not sesi[0] or request.GET.get("state") != sesi[0]:
        return _ke_login(oauth_error="Sesi login Google tidak valid. Coba lagi.")
    verifier = sesi[1]

    code = request.GET.get("code")
    if not code:
        return _ke_login(oauth_error="Kode dari Google tidak diterima.")

    try:
        token = _post_form("https://oauth2.googleapis.com/token", {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": _callback_url("google"),
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        })
        info = _get_json(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {"Authorization": "Bearer " + token["access_token"]},
        )
        sub = str(info["sub"])
        user = _cari_atau_buat(
            "google_id", sub,
            email=(info.get("email") or "").lower(),
            nama=info.get("name", ""),
            dasar_username=(info.get("email") or "").split("@")[0],
        )
    except (OAuthError, KeyError) as e:
        return _ke_login(oauth_error=f"Gagal masuk dengan Google: {e}")

    return _terbitkan(user)


# ---------- X ----------

@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def x_start(request):
    if not settings.X_CLIENT_ID:
        return _belum_dikonfigurasi("X", "X_CLIENT_ID")

    state, challenge = _mulai(request, "x")
    params = {
        "client_id": settings.X_CLIENT_ID,
        "redirect_uri": _callback_url("x"),
        "response_type": "code",
        "scope": "users.read tweet.read",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return HttpResponseRedirect(
        "https://x.com/i/oauth2/authorize?" + urllib.parse.urlencode(params)
    )


@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def x_callback(request):
    if request.GET.get("error"):
        return _ke_login(oauth_error="Login X dibatalkan.")

    sesi = _selesai(request, "x")
    if not sesi or not sesi[0] or request.GET.get("state") != sesi[0]:
        return _ke_login(oauth_error="Sesi login X tidak valid. Coba lagi.")
    verifier = sesi[1]

    code = request.GET.get("code")
    if not code:
        return _ke_login(oauth_error="Kode dari X tidak diterima.")

    # X memakai HTTP Basic (client id:secret) di token endpoint
    basic = base64.b64encode(
        f"{settings.X_CLIENT_ID}:{settings.X_CLIENT_SECRET}".encode()
    ).decode()

    try:
        token = _post_form(
            "https://api.x.com/2/oauth2/token",
            {
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": _callback_url("x"),
                "code_verifier": verifier,
            },
            headers={"Authorization": "Basic " + basic},
        )
        info = _get_json(
            "https://api.x.com/2/users/me",
            {"Authorization": "Bearer " + token["access_token"]},
        )
        data = info["data"]
        user = _cari_atau_buat(
            "x_id", str(data["id"]),
            nama=data.get("name", ""),
            dasar_username=data.get("username", ""),
        )
    except (OAuthError, KeyError) as e:
        return _ke_login(oauth_error=f"Gagal masuk dengan X: {e}")

    return _terbitkan(user)
