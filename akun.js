"use strict";
/* Fitur Autentikasi & Akun (daftar.html, login.html, verifikasi-otp.html, profil.html).
   Terhubung ke backend Django (folder backend/). Jalankan dulu: python manage.py runserver */
(() => {
  const API = "http://127.0.0.1:8000/api/akun";
  const TOKEN = "trustx_token", USER = "trustx_user";
  const PESAN_GAGAL = "Tidak dapat terhubung ke server. Pastikan backend berjalan, lalu coba lagi.";

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage diblokir */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage diblokir */ } }
  };

  /* Pembungkus fetch: selalu mengembalikan { ok, status, data }, tidak melempar error. */
  async function api(path, { method = "GET", json } = {}) {
    const opt = { method, headers: {} };
    const token = store.get(TOKEN);
    if (token) opt.headers.Authorization = "Token " + token;
    if (json) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(json); }
    try {
      const res = await fetch(API + path, opt);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { detail: PESAN_GAGAL } };
    }
  }

  /* Ubah {field: ["pesan"]} dari DRF jadi satu kalimat yang bisa dibaca. */
  function pesan(data) {
    if (!data || typeof data !== "object") return PESAN_GAGAL;
    if (data.detail) return data.detail;
    const bagian = [];
    Object.values(data).forEach((v) => {
      if (Array.isArray(v)) bagian.push(...v);
      else if (v && typeof v === "object") bagian.push(...Object.values(v).flat());
      else bagian.push(String(v));
    });
    return bagian.length ? bagian.join(" ") : PESAN_GAGAL;
  }

  function simpanSesi(d) {
    if (d.token) store.set(TOKEN, d.token);
    if (d.user) store.set(USER, d.user);
  }

  const Akun = {
    api,
    pesan,
    pengguna: () => store.get(USER),

    async daftar(data) {
      const r = await api("/daftar/", { method: "POST", json: data });
      if (r.ok) simpanSesi(r.data);
      return r;
    },

    async masuk(email, password) {
      const r = await api("/masuk/", { method: "POST", json: { email, password } });
      if (r.ok) simpanSesi(r.data);
      return r;
    },

    async keluar() {
      const r = await api("/keluar/", { method: "POST" });
      store.del(TOKEN);
      store.del(USER);
      return r;
    },

    async saya() {
      const r = await api("/saya/");
      if (r.ok) store.set(USER, r.data);
      return r;
    },

    async kirimOtp(email) {
      return api("/otp/kirim/", { method: "POST", json: { email } });
    },

    async verifikasiOtp(email, kode) {
      const r = await api("/otp/verifikasi/", { method: "POST", json: { email, kode } });
      if (r.ok) simpanSesi(r.data);
      return r;
    },

    /* Arahkan ke halaman masuk kalau belum punya token (dipakai profil.html). */
    wajibMasuk() {
      if (!store.get(TOKEN)) {
        const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
        location.replace("login.html?next=" + next);
        return false;
      }
      return true;
    },

    /* Alamat beranda sesuai peran akun. */
    beranda(user) {
      const peran = (user && user.role) || (store.get(USER) || {}).role || "buyer";
      return peran === "seller" ? "index-seller.html" : "index.html";
    }
  };

  // Kode OTP akun yang sedang menunggu verifikasi (dipakai verifikasi-otp.html)
  Akun.emailMenunggu = {
    set: (email) => store.set("trustx_otp_email", email),
    get: () => store.get("trustx_otp_email")
  };

  // Tangkap hasil login sosial: login.html?oauth_token=... atau ?oauth_error=...
  async function tangkapOAuth() {
    const q = new URLSearchParams(location.search);
    const out = document.getElementById("loginMessage");
    const err = q.get("oauth_error");
    if (err) {
      if (out) out.textContent = err;
      history.replaceState(null, "", location.pathname);
      return;
    }
    const token = q.get("oauth_token");
    if (!token) return;
    store.set(TOKEN, token);
    history.replaceState(null, "", location.pathname);
    const r = await api("/saya/");
    if (r.ok) store.set(USER, r.data);
    location.replace(Akun.beranda(r.ok ? r.data : null));
  }

  window.TrustXAkun = Akun;

  // Hanya login.html yang menerima ?oauth_token / ?oauth_error
  if (document.body.dataset.page === "login") tangkapOAuth();
})();
