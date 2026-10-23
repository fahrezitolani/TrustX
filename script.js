/* Interaksi front-end TrustX — masuk, daftar, dan pemilihan peran.
   Belum terhubung ke database/backend. */
"use strict";
// use strict adalah praktik yang baik untuk menulis JavaScript modern. Ini membantu mencegah beberapa kesalahan umum dan membuat kode lebih aman.

document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // 1. Menu navigasi mobile
    // =========================
    const menu = document.getElementById("menuToggle");
    const nav = document.getElementById("mainNav");

    if (menu && nav) {
        menu.addEventListener("click", () => {
            const open = nav.classList.toggle("is-open");

            menu.setAttribute("aria-expanded", String(open));
            menu.textContent = open ? "\u25C2" : "\u25B2";
            menu.setAttribute(
                "aria-label",
                open ? "Tutup menu" : "Buka menu"
            );
        });
    }

    // =========================
    // 2. Cek reputasi akun
    // =========================
    let mode = "wa";

    const wa = document.getElementById("waTab");
    const xt = document.getElementById("xTab");
    const input = document.getElementById("accountInput");
    const msg = document.getElementById("checkMessage");

    function setMode(next) {
        mode = next;

        if (!wa || !xt || !input || !msg) {
            return;
        }

        wa.classList.toggle("active", mode === "wa");
        xt.classList.toggle("active", mode === "x");

        wa.setAttribute("aria-pressed", String(mode === "wa"));
        xt.setAttribute("aria-pressed", String(mode === "x"));

        input.value = "";
        msg.textContent = "";

        input.placeholder = mode === "wa"
            ? "Masukkan nomor WhatsApp..."
            : "Masukkan username X...";

        input.focus();
    }

    if (wa) {
        wa.addEventListener("click", () => setMode("wa"));
    }

    if (xt) {
        xt.addEventListener("click", () => setMode("x"));
    }

    const check = document.getElementById("checkForm");

    if (check) {
        check.addEventListener("submit", (e) => {
            e.preventDefault();

            const value = input.value.trim();

            if (!value) {
                msg.textContent =
                    "Silakan masukkan data akun terlebih dahulu.";
                input.focus();
                return;
            }

            if (
                mode === "wa" &&
                !/^\+?[0-9][0-9\s-]{7,17}$/.test(value)
            ) {
                msg.textContent =
                    "Format nomor WhatsApp belum valid.";
                input.focus();
                return;
            }

            if (
                mode === "x" &&
                !/^@?[A-Za-z0-9_]{1,15}$/.test(value)
            ) {
                msg.textContent =
                    "Username X hanya boleh berisi huruf, angka, " +
                    "atau garis bawah (maksimal 15 karakter).";
                input.focus();
                return;
            }

            msg.textContent =
                "Format data valid. Hasil reputasi belum tersedia " +
                "karena aplikasi belum terhubung ke database.";
        });
    }

    // =========================
    // 3. Tampilkan/sembunyikan kata sandi
    // =========================
    document
        .querySelectorAll("[data-toggle-password]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const field = document.getElementById(
                    button.dataset.togglePassword
                );

                if (!field) {
                    return;
                }

                const show = field.type === "password";

                field.type = show ? "text" : "password";
                button.textContent = show
                    ? "Sembunyikan"
                    : "Lihat";
            });
        });

    // =========================
    // 4. Pilih peran (Pembeli / Penjual)
    // =========================
    const roleTabs = document.querySelectorAll(".role-btn");

    if (roleTabs.length) {
        roleTabs.forEach((button) => {
            button.addEventListener("click", () => {
                roleTabs.forEach((item) => {
                    item.setAttribute(
                        "aria-pressed",
                        String(item === button)
                    );
                });
            });
        });
    }

    function pilihPeran() {
        const aktif = document.querySelector(
            '.role-btn[aria-pressed="true"]'
        );

        return aktif && /penjual/i.test(aktif.textContent)
            ? "seller"
            : "buyer";
    }

    // Beranda tujuan sesuai peran yang dipilih.
    function beranda(peran) {
        return peran === "seller" ? "index-seller.html" : "index.html";
    }

    // =========================
    // 5. Form login
    // =========================
    const login = document.getElementById("loginForm");

    if (login) {
        login.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail");
            const pass = document.getElementById("loginPassword");
            const out = document.getElementById("loginMessage");
            const btn = login.querySelector('button[type="submit"]');

            if (!email.value.trim() || !email.validity.valid) {
                out.textContent = "Masukkan alamat email yang valid.";
                email.focus();
                return;
            }

            if (!pass.value) {
                out.textContent = "Masukkan kata sandi.";
                pass.focus();
                return;
            }

            if (!window.TrustXAkun) {
                out.textContent = "Halaman ini perlu dijalankan lewat Live Server.";
                return;
            }

            btn.disabled = true;
            const r = await window.TrustXAkun.masuk(email.value.trim(), pass.value);
            btn.disabled = false;

            if (!r.ok) {
                out.textContent = window.TrustXAkun.pesan(r.data);
                pass.focus();
                return;
            }

            const peran = r.data.user.role || localStorage.getItem("trustx_peran") || "buyer";
            localStorage.setItem("trustx_peran", peran);
            out.textContent = "Login berhasil. Mengarah ke halaman beranda...";
            setTimeout(() => {
                window.location.href = peran === "seller" ? "index-seller.html" : "index.html";
            }, 500);
        });
    }

    // =========================
    // 6. Form registrasi
    // =========================
    const register = document.getElementById("registerForm");

    if (register) {
        const namaToko = document.getElementById("tokoField");

        // Nama toko hanya relevan untuk penjual
        function aturToko() {
            if (!namaToko) return;
            const penjual = pilihPeran() === "seller";
            namaToko.hidden = !penjual;
            const inp = document.getElementById("tokoNama");
            if (inp) {
                inp.required = penjual;
                if (!penjual) inp.value = "";
            }
        }

        document.querySelectorAll(".role-btn").forEach((b) => b.addEventListener("click", aturToko));
        aturToko();

        register.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("registerName");
            const wa = document.getElementById("registerWa");
            const email = document.getElementById("registerEmail");
            const pass = document.getElementById("registerPassword");
            const confirm = document.getElementById("confirmPassword");
            const terms = document.getElementById("terms");
            const toko = document.getElementById("tokoNama");
            const out = document.getElementById("registerMessage");
            const btn = register.querySelector('button[type="submit"]');

            if (!name.value.trim()) {
                out.textContent = "Masukkan nama lengkap.";
                name.focus();
                return;
            }

            if (!/^\+?[0-9][0-9\s-]{7,17}$/.test(wa.value.trim())) {
                out.textContent = "Masukkan nomor WhatsApp yang valid.";
                wa.focus();
                return;
            }

            if (!email.value.trim() || !email.validity.valid) {
                out.textContent = "Masukkan alamat email yang valid.";
                email.focus();
                return;
            }

            if (pass.value.length < 8) {
                out.textContent = "Kata sandi harus minimal 8 karakter.";
                pass.focus();
                return;
            }

            if (pass.value !== confirm.value) {
                out.textContent = "Konfirmasi kata sandi tidak sama.";
                confirm.focus();
                return;
            }

            if (terms && !terms.checked) {
                out.textContent = "Setujui syarat dan ketentuan untuk melanjutkan.";
                terms.focus();
                return;
            }

            if (!window.TrustXAkun) {
                out.textContent = "Halaman ini perlu dijalankan lewat Live Server.";
                return;
            }

            const peran = pilihPeran();
            btn.disabled = true;
            const r = await window.TrustXAkun.daftar({
                nama: name.value.trim(),
                email: email.value.trim(),
                wa: wa.value.trim(),
                password: pass.value,
                confirmPassword: confirm.value,
                role: peran,
                toko_nama: toko ? toko.value.trim() : ""
            });
            btn.disabled = false;

            if (!r.ok) {
                out.textContent = window.TrustXAkun.pesan(r.data);
                return;
            }

            // Simpan peran + email agar halaman OTP tahu akun mana yang diverifikasi
            localStorage.setItem("trustx_peran", peran);
            window.TrustXAkun.emailMenunggu.set(email.value.trim());
            out.textContent = "Pendaftaran berhasil. Mengarah ke verifikasi OTP...";
            setTimeout(() => {
                window.location.href = "verifikasi-otp.html";
            }, 600);
        });
    }
});
