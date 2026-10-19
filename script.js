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
        login.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail");
            const pass = document.getElementById("loginPassword");
            const out = document.getElementById("loginMessage");

            if (!email.value.trim() || !email.validity.valid) {
                out.textContent =
                    "Masukkan alamat email yang valid.";
                email.focus();
                return;
            }

            if (!pass.value) {
                out.textContent = "Masukkan kata sandi.";
                pass.focus();
                return;
            }

            const peran = localStorage.getItem("trustx_peran") || "buyer";

            // Login front-end (masa uji) — tanpa backend.
            out.textContent =
                "Login berhasil. Mengarah ke halaman beranda...";
            setTimeout(() => {
                window.location.href = beranda(peran);
            }, 600);
        });
    }

    // =========================
    // 6. Form registrasi
    // =========================
    const register = document.getElementById("registerForm");

    if (register) {
        register.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("registerName");
            const wa = document.getElementById("registerWa");
            const pass = document.getElementById("registerPassword");
            const confirm = document.getElementById("confirmPassword");
            const terms = document.getElementById("terms");
            const out = document.getElementById("registerMessage");

            if (!name.value.trim()) {
                out.textContent = "Masukkan nama lengkap.";
                name.focus();
                return;
            }

            if (!/^\+?[0-9][0-9\s-]{7,17}$/.test(wa.value.trim())) {
                out.textContent =
                    "Masukkan nomor WhatsApp yang valid.";
                wa.focus();
                return;
            }

            if (pass.value.length < 8) {
                out.textContent =
                    "Kata sandi harus minimal 8 karakter.";
                pass.focus();
                return;
            }

            if (pass.value !== confirm.value) {
                out.textContent =
                    "Konfirmasi kata sandi tidak sama.";
                confirm.focus();
                return;
            }

            if (terms && !terms.checked) {
                out.textContent =
                    "Setujui syarat dan ketentuan untuk melanjutkan.";
                terms.focus();
                return;
            }

            // Simpan peran terpilih agar beranda tujuan konsisten.
            localStorage.setItem("trustx_peran", pilihPeran());

            out.textContent =
                "Validasi berhasil. Kode OTP akan dikirim ke WhatsApp " +
                "setelah backend terhubung.";
        });
    }
});
