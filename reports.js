// HALAMAN DAHBOARD SANGGAHAN
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("appealForm");

    // Jalankan hanya pada halaman sanggahan.
    if (!form) return;

    const API = "http://127.0.0.1:8000";

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
    const items = Array.isArray(data) ? data : (data.results || []);
    updateStats(items);

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

    // Isi ID laporan dari URL jika tersedia.
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("laporan") || params.get("id");
    if (
        reportId &&
        requestedId &&
        /^LP-\d{4,}$/i.test(requestedId)
    ) {
        reportId.value = requestedId;
    }

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

        formData.append("report_id", reportId.value.trim());
        formData.append("store_name", storeName.value.trim());
        formData.append("reason", reason.value);
        formData.append("story", storyText);

        selectedFiles.forEach(file => {
            formData.append("evidence", file);
        });

        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";

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

            showMessage(
                setTimeout(() => {
                    window.location.href = "./dashboard-laporanseller.html";
                }, 1200)
                `Sanggahan berhasil dikirim. ID: ${result.id}. ` +
                `Status: ${result.status}.`,
                true
            );

            form.reset();
            updateStoryCount();

            if (fileList) {
                fileList.replaceChildren();
            }

            await loadHistory();

        } catch (error) {
            console.error("Pengiriman sanggahan gagal:", error);
            showMessage(`Gagal mengirim sanggahan: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Kirim Sanggahan";
        }
    });

    updateStoryCount();
    loadHistory();
});


// // ================================
// ========== SAnggahan List ==============

"use strict";

const API = "http://127.0.0.1:8000/api/sanggahan/";

// Pemetaan status database -> filter, badge, dan label di dashboard
const STATUS = {
  pending:   { filter: "response", badge: "response", label: "Menunggu Ditinjau" },
  reviewing: { filter: "review",   badge: "review",   label: "Sedang Ditinjau" },
  accepted:  { filter: "done",     badge: "done",     label: "Diterima" },
  rejected:  { filter: "done",     badge: "done",     label: "Ditolak" },
};

const ALASAN = {
  "informasi-tidak-sesuai": "Informasi laporan tidak sesuai",
  "bukti-tambahan": "Memiliki bukti tambahan",
  "masalah-sudah-selesai": "Masalah telah diselesaikan",
  "kesalahan-identitas": "Kesalahan identitas akun",
  "lainnya": "Alasan lainnya",
};

// Escape teks dari pengguna supaya tidak bisa menyisipkan HTML/script
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function tanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function buildCard(item) {
  const st = STATUS[item.status] || STATUS.pending;
  const alasan = ALASAN[item.reason] || item.reason;
  const detailId = `detail-sg-${item.id}`;

  const bukti = (item.bukti || [])
    .map(b => `<a href="${esc(b.file)}" target="_blank" rel="noopener">${esc(b.nama_asli)}</a>`)
    .join(", ") || "-";

  const card = document.createElement("article");
  card.className = "sr-report";
  card.dataset.status = st.filter;
  card.dataset.dynamic = "true";
  card.innerHTML = `
    <div class="sr-report-top">
      <span class="sr-badge ${st.badge}">${esc(st.label)}</span>
      <span class="sr-id">${esc(item.report_id)}</span>
    </div>
    <h3>Sanggahan: ${esc(alasan)}</h3>
    <p class="sr-meta">Toko: ${esc(item.store_name)} · ${tanggal(item.created_at)}</p>
    <p>${esc(item.story)}</p>

    <div class="sr-actions">
      <button type="button" class="sr-btn sr-btn-secondary" aria-expanded="false">
        Lihat sanggahan
      </button>
    </div>

    <div class="sr-detail" id="${detailId}" hidden>
      <h4>Detail sanggahan ${esc(item.report_id)}</h4>
      <div class="sr-detail-grid">
        <div><span>Nama toko</span><strong>${esc(item.store_name)}</strong></div>
        <div><span>Alasan</span><strong>${esc(alasan)}</strong></div>
        <div><span>Status</span><strong>${esc(st.label)}</strong></div>
        <div><span>Dikirim</span><strong>${tanggal(item.created_at)}</strong></div>
      </div>
      <div class="sr-result-note">
        <h4>Kronologi</h4>
        <p>${esc(item.story)}</p>
      </div>
      <div class="sr-result-note">
        <h4>Bukti pendukung</h4>
        <p>${bukti}</p>
      </div>
      ${item.admin_response ? `
      <div class="sr-result-note">
        <h4>Tanggapan tim peninjau</h4>
        <p>${esc(item.admin_response)}</p>
      </div>` : ""}
    </div>`;

  const btn = card.querySelector("button");
  const panel = card.querySelector(".sr-detail");
  btn.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });

  return card;
}

// Mengisi angka ringkasan sesuai data database
function updateStats(items, total) {
  const c = { total: total ?? items.length, response: 0, review: 0, done: 0 };
  items.forEach(i => {
    c[(STATUS[i.status] || STATUS.pending).filter]++;
  });
  Object.entries(c).forEach(([key, val]) => {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = val;
  });
}

async function loadSanggahan() {
  const list = document.querySelector(".sr-report-list");
  if (!list) return;

  try {
    const res = await fetch(API, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Status " + res.status);

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.results || []);

    updateStats(items, data.count);

    list.querySelectorAll("[data-dynamic]").forEach(n => n.remove());
    // API mengurutkan terbaru dulu; dibalik lalu di-prepend agar urutannya tetap terbaru di atas
    items.slice().reverse().forEach(item => list.prepend(buildCard(item)));
  } catch (err) {
    console.error("Gagal memuat sanggahan:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSanggahan);