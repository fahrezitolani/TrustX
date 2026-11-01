
    // =========================
    // Toggle password visibility
    // =========================
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".password-toggle");
        if (!btn) return;
        const targetId = btn.getAttribute("data-toggle-password");
        let input = null;
        if (targetId) {
            input = document.getElementById(targetId);
        } else {
            input = btn.previousElementSibling;
            while (input && input.tagName !== "INPUT") {
                input = input.previousElementSibling;
            }
        }
        if (!input || input.tagName !== "INPUT") return;
        if (input.type === "password") {
            input.type = "text";
            btn.textContent = "Sembunyi";
            btn.setAttribute("aria-label", "Sembunyikan kata sandi");
        } else {
            input.type = "password";
            btn.textContent = "Lihat";
            btn.setAttribute("aria-label", "Tampilkan kata sandi");
        }
    });

    // =========================
    // 2. Cek reputasi akun
    // =========================
    let mode = "wa";

    const tabs = document.querySelectorAll(".tab");
    const input = document.getElementById("q");
    const form = document.getElementById("form");
    const msg = document.getElementById("err");

    function setMode(next) {
        mode = next;

        tabs.forEach((tab) => {
            const active = tab.dataset.m === mode;

            tab.classList.toggle("active", active);
            tab.setAttribute("aria-pressed", String(active));
        });

        if (input) {
            input.value = "";
            input.placeholder = mode === "wa"
                ? "Masukkan nomor WhatsApp"
                : "Masukkan username X";
        }

        if (msg) msg.textContent = "";
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setMode(tab.dataset.m);
        });
    });

    if (form && input && msg) {
        form.addEventListener("submit", (e) => {
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
                    "atau garis bawah, maksimal 15 karakter.";
                input.focus();
                return;
            }

            msg.textContent =
                "Format data valid. Hasil reputasi belum tersedia " +
                "karena aplikasi belum terhubung ke database.";
        });
    }
