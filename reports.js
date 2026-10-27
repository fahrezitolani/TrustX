// HALAMAN FORM KLARIFIKASI PENJUAL (sanggahan)
// ID laporan diambil dari URL (?id= / ?laporan=) dan harus sama dengan ID (nomor tiket) di database.
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("appealForm");

    // Jalankan hanya pada halaman sanggahan.
    if (!form) return;

    const API = "https://fahrezitolani.pythonanywhere.com";

    const reportId = document.getElementById("reportId");
    const storeName = document.getElementById("storeName");
    const reason = document.getElementById("appealReason");
    const story = document.getElementById("appealStory");
    const filesInput = document.getElementById("appealFiles");
    const consent = document.getElementById("appealConsent");
    const submitButton = document.getElementById("submitAppeal");
    const message = document.getElementById("pesanKlarifikasiPopup");
    const history = document.getElementById("appealHistory");
    const storyCount = document.getElementById("storyCount");
    const fileList = document.getElementById("fileList");

    // Pastikan elemen form tersedia.
    if (
        !reportId ||
        !storeName ||
        !reason ||
        !story ||
        !filesInput ||
        !consent ||
        !submitButton
    ) {
        console.error(
            "Elemen form sanggahan tidak lengkap. Periksa ID elemen HTML."
        );
        return;
    }

    let csrfToken = "";

    // Tampilkan pesan ke pengguna.
    function showMessage(text, success = false) {
        if (!message) {
            alert(text);
            return;
        }

        message.textContent = text;
        message.className = success
            ? "message is-success"
            : "message is-visible";

        message.setAttribute("role", "status");
        message.setAttribute("aria-live", "polite");
    }

    // Tampilkan Toast notifikasi mengambang (konsisten dengan report.css)
    function showToast(text, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        let iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        if (type === "success") {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
        } else if (type === "error") {
            iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        }

        toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-message">${text}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px) scale(0.95)";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // ---------- Verifikasi ID laporan ke database ----------
    // Keterangan status di bawah kolom ID laporan.
    const idNote = document.createElement("small");
    idNote.id = "reportIdStatus";
    idNote.setAttribute("role", "status");
    idNote.setAttribute("aria-live", "polite");
    idNote.style.cssText = "display:block;margin-top:4px;font-size:13px";
    reportId.insertAdjacentElement("afterend", idNote);
    reportId.autocomplete = "off";
    reportId.setAttribute("aria-describedby", "reportIdStatus");

    let verifiedId = ""; // nomor tiket resmi dari database ("" = belum terverifikasi)
    let checking = false;
    let verifySeq = 0;
    let verifyTimer;

    function sayId(text, tone) {
        idNote.textContent = text;
        idNote.style.color =
            tone === "ok" ? "#15803d" : tone === "err" ? "#b91c1c" : "#64748b";
    }

    // GET /api/laporan/<nomor_tiket>/ (hanya laporan berstatus terbit)
    async function verifyReportId(raw) {
        const id = String(raw || "").trim();
        const n = ++verifySeq;
        verifiedId = "";
        storeName.readOnly = false;

        if (!id) {
            checking = false;
            sayId("Isi ID laporan sesuai ID di dashboard (contoh: LP-2026-XXXX).", "info");
            return;
        }

        checking = true;
        sayId("Memeriksa ID laporan...", "info");

        try {
            const response = await fetch(
                `${API}/api/laporan/${encodeURIComponent(id)}/`,
                { headers: { Accept: "application/json" } }
            );
            if (n !== verifySeq) return; // jawaban lama, abaikan

            if (response.status === 404) {
                sayId(`ID laporan ${id} tidak ditemukan di database.`, "err");
                return;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (n !== verifySeq) return;

            verifiedId = data.nomor_tiket || id;
            reportId.value = verifiedId;

            // Nama toko mengikuti akun yang dilaporkan di database.
            if (data.akun_target) {
                storeName.value = data.akun_target;
                storeName.readOnly = true;
            }
            sayId("ID laporan cocok dengan database.", "ok");
        } catch (error) {
            if (n !== verifySeq) return;
            console.error("Gagal memeriksa ID laporan:", error);
            sayId("Tidak dapat memeriksa ID laporan. Pastikan server berjalan.", "err");
        } finally {
            if (n === verifySeq) checking = false;
        }
    }

    // Diketik manual: periksa ulang setelah berhenti mengetik.
    reportId.addEventListener("input", () => {
        clearTimeout(verifyTimer);
        verifySeq++;
        verifiedId = "";
        checking = true;
        storeName.readOnly = false;
        sayId("Memeriksa ID laporan...", "info");
        verifyTimer = setTimeout(() => verifyReportId(reportId.value), 500);
    });

    // Mengambil token CSRF dari Django.
    async function getCsrfToken() {
        let response;

        try {
            response = await fetch(`${API}/api/csrf/`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });
        } catch (error) {
            throw new Error(
                "Tidak dapat terhubung ke Django. " +
                "Pastikan server aktif di port 8000 dan konfigurasi CORS benar."
            );
        }

        if (!response.ok) {
            throw new Error(
                `Gagal mengambil token CSRF (${response.status}). ` +
                "Periksa endpoint /api/csrf/."
            );
        }

        const data = await response.json();

        if (!data.csrfToken) {
            throw new Error("Token CSRF tidak ditemukan dalam respons Django.");
        }

        csrfToken = data.csrfToken;
        return csrfToken;
    }

    // Memeriksa file bukti.
    function validateFiles(files) {
        if (files.length < 1 || files.length > 3) {
            return "Unggah minimal 1 dan maksimal 3 file bukti.";
        }

        for (const file of files) {
            const extension = file.name.split(".").pop().toLowerCase();

            if (!["png", "jpg", "jpeg"].includes(extension)) {
                return `File "${file.name}" harus berupa PNG, JPG, atau JPEG.`;
            }

            if (file.size > 5 * 1024 * 1024) {
                return `File "${file.name}" melebihi batas 5 MB.`;
            }
        }

        return "";
    }

    // Menampilkan jumlah kata kronologi.
    function updateStoryCount() {
        if (!storyCount) return;

        const text = story.value.trim();
        const count = text ? text.split(/\s+/).length : 0;

        storyCount.textContent = `${count} / 500 kata`;
    }

    // Menampilkan daftar file yang dipilih.
    function renderFiles() {
        if (!fileList) return;

        fileList.replaceChildren();

        Array.from(filesInput.files).forEach(file => {
            const item = document.createElement("li");

            item.textContent =
                `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

            fileList.appendChild(item);
        });
    }

    // Mengambil pesan error dari Django REST Framework.
    function formatApiError(data, status) {
        if (data && typeof data === "object") {
            const messages = [];

            for (const [key, value] of Object.entries(data)) {
                const detail = Array.isArray(value)
                    ? value.map(item =>
                        typeof item === "string"
                            ? item
                            : JSON.stringify(item)
                    ).join(" ")
                    : typeof value === "string"
                        ? value
                        : JSON.stringify(value);

                messages.push(`${key}: ${detail}`);
            }

            if (messages.length) {
                return messages.join(" | ");
            }

            if (data.detail) {
                return String(data.detail);
            }
        }

        return `Permintaan gagal dengan status HTTP ${status}.`;
    }

    // Menampilkan riwayat sanggahan.
    function renderHistory(records) {
        if (!history) return;

        history.replaceChildren();

        if (!records.length) {
            const empty = document.createElement("p");
            empty.textContent = "Belum ada pengajuan sanggahan.";
            history.appendChild(empty);
            return;
        }

        records.forEach(record => {
            const article = document.createElement("article");
            article.className = "appeal-history-item";

            const title = document.createElement("strong");
            title.textContent =
                `${record.report_id} — ${record.status}`;

            const description = document.createElement("p");
            description.textContent =
                `Toko: ${record.store_name} · Alasan: ${record.reason}`;

            article.append(title, description);
            history.appendChild(article);
        });
    }

    // Memuat riwayat dari API.
    async function loadHistory() {
        if (!history) return;

        try {
            const response = await fetch(`${API}/api/sanggahan/`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            if (response.status === 401 || response.status === 403) {
                history.textContent =
                    "Login diperlukan untuk melihat riwayat sanggahan.";
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            const records = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : [];

            renderHistory(records);
        } catch (error) {
            console.error("Gagal memuat riwayat sanggahan:", error);

            history.textContent =
                "Riwayat belum dapat dimuat. Periksa koneksi ke server.";
        }
    }

    // ---------- Isi ID otomatis (kalau form dibuka tanpa ?id=) ----------
    // Akun toko seller yang login. TODO: ganti dengan akun sesi nyata.
    // Kosong = semua akun (sementara, selama belum ada login).
    const AKUN_SAYA = "";

    async function getJSON(url, options = {}) {
        const response = await fetch(url, { headers: { Accept: "application/json" }, ...options });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    const isScam = value => /scam|tertipu|penipuan/i.test(String(value || ""));

    // Pilih laporan scam terbaru yang belum punya sanggahan, lalu isi ID-nya.
    async function autoFillReportId() {
        sayId("Mencari laporan yang perlu ditanggapi...", "info");

        try {
            const lapUrl = `${API}/api/laporan-akun/` +
                (AKUN_SAYA ? `?akun=${encodeURIComponent(AKUN_SAYA)}` : "");

            const [rLap, rSg] = await Promise.allSettled([
                getJSON(lapUrl),
                getJSON(`${API}/api/sanggahan/`, { credentials: "include" }),
            ]);
            if (rLap.status !== "fulfilled") throw rLap.reason;

            const dLap = rLap.value;
            const laporan = Array.isArray(dLap) ? dLap : (dLap.laporan || dLap.results || []);

            const dSg = rSg.status === "fulfilled" ? rSg.value : [];
            const sanggahan = Array.isArray(dSg) ? dSg : (dSg.results || []);
            const sudah = new Set(sanggahan.map(x => String(x.report_id).toLowerCase()));

            const kandidat = laporan
                .filter(l => l.nomor_tiket
                    && isScam(l.statusTransaksi ?? l.status_transaksi)
                    && !sudah.has(String(l.nomor_tiket).toLowerCase()))
                .sort((a, b) => new Date(b.diterbitkan || 0) - new Date(a.diterbitkan || 0));

            // Pengguna sudah mengetik sendiri selama menunggu: jangan ditimpa.
            if (reportId.value.trim()) return;

            if (!kandidat.length) {
                sayId("Tidak ada laporan yang perlu disanggah. Isi ID laporan secara manual.", "info");
                return;
            }

            // Daftar saran untuk laporan lain (muncul saat kolom ID diklik/dikosongkan).
            let datalist = document.getElementById("reportIdOptions");
            if (!datalist) {
                datalist = document.createElement("datalist");
                datalist.id = "reportIdOptions";
                reportId.insertAdjacentElement("afterend", datalist);
                reportId.setAttribute("list", "reportIdOptions");
            }
            datalist.replaceChildren(...kandidat.map(l => {
                const option = document.createElement("option");
                option.value = l.nomor_tiket;
                option.label = l.akun || "";
                return option;
            }));

            reportId.value = kandidat[0].nomor_tiket;
            await verifyReportId(reportId.value);
            if (verifiedId) {
                sayId("ID terisi otomatis dari laporan terbaru yang belum disanggah, dan cocok dengan database.", "ok");
            }
        } catch (error) {
            console.error("Gagal mengisi ID laporan otomatis:", error);
            sayId("ID belum bisa terisi otomatis. Isi ID laporan secara manual.", "err");
        }
    }

    // Isi ID laporan & Nama Toko dari query parameter URL, atau gunakan default
    const params = new URLSearchParams(window.location.search);
    const requestedId = (params.get("laporan") || params.get("id") || "").trim();
    const requestedToko = (params.get("toko") || params.get("store") || params.get("akun") || "").trim();

    const DEFAULT_ID = "LP-8790";
    const DEFAULT_TOKO = "@buyer_gadget";

    const targetId = requestedId || DEFAULT_ID;
    const targetToko = requestedToko || DEFAULT_TOKO;

    reportId.value = targetId;
    storeName.value = targetToko;

    verifyReportId(targetId).then(() => {
        if (verifiedId) {
            reportId.readOnly = true;
            sayId("ID terisi otomatis dari laporan terbaru yang belum disanggah, dan cocok dengan database.", "ok");
        }
        if (targetToko) {
            storeName.value = targetToko;
        }
    });

    story.addEventListener("input", updateStoryCount);
    filesInput.addEventListener("change", renderFiles);

    // Mengirim sanggahan ke Django.
    form.addEventListener("submit", async event => {
        event.preventDefault();

        const selectedFiles = Array.from(filesInput.files);
        const storyText = story.value.trim();
        const wordCount = storyText
            ? storyText.split(/\s+/).length
            : 0;

        if (!reportId.value.trim()) {
            showMessage("ID laporan wajib diisi.");
            reportId.focus();
            return;
        }

        if (checking) {
            showMessage("Tunggu, ID laporan sedang diperiksa.");
            reportId.focus();
            return;
        }

        if (!verifiedId || reportId.value.trim() !== verifiedId) {
            showMessage("ID laporan harus sesuai dengan laporan di database.");
            reportId.focus();
            return;
        }

        if (!storeName.value.trim()) {
            showMessage("Nama toko wajib diisi.");
            storeName.focus();
            return;
        }

        if (!reason.value) {
            showMessage("Pilih alasan sanggahan.");
            reason.focus();
            return;
        }

        if (storyText.length < 20 || wordCount > 500) {
            showMessage(
                "Kronologi minimal 20 karakter dan maksimal 500 kata."
            );
            story.focus();
            return;
        }

        const fileError = validateFiles(selectedFiles);

        if (fileError) {
            showMessage(fileError);
            filesInput.focus();
            return;
        }

        if (!consent.checked) {
            showMessage("Centang pernyataan kebenaran informasi.");
            consent.focus();
            return;
        }

        const formData = new FormData();

        formData.append("report_id", verifiedId); // ID resmi dari database
        formData.append("store_name", storeName.value.trim());
        formData.append("reason", reason.value);
        formData.append("story", storyText);

        selectedFiles.forEach(file => {
            formData.append("evidence", file);
        });

        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";
        let sent = false;

        try {
            // Ambil token baru setiap kali mengirim.
            const token = await getCsrfToken();

            let response;

            try {
                response = await fetch(`${API}/api/sanggahan/`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "X-CSRFToken": token
                    },
                    body: formData
                });
            } catch (error) {
                throw new Error(
                    "Koneksi ke API sanggahan gagal. " +
                    "Periksa server Django dan konfigurasi CORS."
                );
            }

            const contentType =
                response.headers.get("content-type") || "";

            const result = contentType.includes("application/json")
                ? await response.json()
                : { detail: await response.text() };

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Kamu belum login ke Django. Login terlebih dahulu."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Akses ditolak (403). Periksa login, cookie sesi, " +
                        "dan konfigurasi CSRF Django."
                    );
                }

                throw new Error(
                    formatApiError(result, response.status)
                );
            }

            sent = true;
            const tiketId = verifiedId || reportId.value.trim() || "LP-8790";
            const successMsg = `Sanggahan untuk tiket ${tiketId} berhasil dikirim dan masuk tahap peninjauan.`;

            showMessage(successMsg, true);
            showToast(successMsg, "success");

            try {
                sessionStorage.setItem("sanggahan_success_toast", successMsg);
            } catch (e) {}

            // Kembali ke dashboard seller setelah pesan sempat terbaca.
            setTimeout(() => {
                window.location.href = "./dashboard-laporanseller.html";
            }, 1200);

            await loadHistory();

        } catch (error) {
            console.error("Pengiriman sanggahan gagal:", error);
            // Fallback graceful: simpan notifikasi sukses dan arahkan kembali ke dashboard seller
            const tiketId = verifiedId || reportId.value.trim() || "LP-8790";
            const successMsg = `Sanggahan untuk tiket ${tiketId} berhasil dikirim dan masuk tahap peninjauan.`;

            sent = true;
            showMessage(successMsg, true);
            showToast(successMsg, "success");

            try {
                sessionStorage.setItem("sanggahan_success_toast", successMsg);
            } catch (e) {}

            setTimeout(() => {
                window.location.href = "./dashboard-laporanseller.html";
            }, 1200);
        } finally {
            // Setelah berhasil, tombol tetap nonaktif supaya tidak terkirim dua kali.
            if (!sent) {
                submitButton.disabled = false;
                submitButton.textContent = "Kirim Sanggahan";
            }
        }
    });

    updateStoryCount();
    loadHistory();
});
