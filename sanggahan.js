// ================================
// ========== Sanggahan List ======
// Kartu menampilkan LAPORAN lebih dulu. Tombol "Lihat sanggahan" membuka
// SANGGAHAN untuk laporan itu di bawah laporan (laporan tetap terlihat).

"use strict";

(() => { // SANGGAHAN_IIFE: dibungkus agar tidak bentrok dengan variabel global lain

const API_BASE = "http://127.0.0.1:8000/api";
const AKUN_SAYA = "@seller_gadget_murah"; // TODO: ganti dengan akun seller yang login
const AJUKAN_SANGGAHAN = "sanggahan.html";

// Pemetaan status sanggahan di database -> filter, badge, dan label di dashboard
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

const TX = { scam: "Tertipu/Scam", aman: "Aman/Rekomendasi" };

// Escape teks dari pengguna supaya tidak bisa menyisipkan HTML/script
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function tanggal(iso) {
  return iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";
}

// Tampilan 1: isi LAPORAN
function laporanView(l, id) {
  if (!l) {
    return `
      <div class="sr-report-top"><span class="sr-id">${esc(id)}</span></div>
      <p class="sr-meta">Data laporan ini tidak ditemukan.</p>`;
  }
  return `
    <div class="sr-report-top">
      <span class="sr-badge">${esc(TX[l.statusTransaksi] || l.statusTransaksi)}</span>
      <span class="sr-id">${esc(l.nomor_tiket)}</span>
    </div>
    <h3>${esc(l.akun)}</h3>
    <p class="sr-meta">Diterbitkan ${tanggal(l.diterbitkan)}</p>
    <p>${esc(l.kronologi)}</p>
    <p class="sr-meta">${esc(l.jumlahBukti)} bukti terlampir</p>`;
}

// Tampilan 2: isi SANGGAHAN
function sanggahanView(sg) {
  const st = STATUS[sg.status] || STATUS.pending;
  const alasan = ALASAN[sg.reason] || sg.reason;
  const bukti = (sg.bukti || [])
    .map(b => `<a href="${esc(b.file)}" target="_blank" rel="noopener">${esc(b.nama_asli)}</a>`)
    .join(", ") || "-";

  return `
    <div class="sr-report-top">
      <span class="sr-badge ${st.badge}">${esc(st.label)}</span>
      <span class="sr-id">${esc(sg.report_id)}</span>
    </div>
    <h3>Sanggahan: ${esc(alasan)}</h3>
    <p class="sr-meta">Toko: ${esc(sg.store_name)} · ${tanggal(sg.created_at)}</p>
    <p>${esc(sg.story)}</p>
    <div class="sr-detail-grid">
      <div><span>Nama toko</span><strong>${esc(sg.store_name)}</strong></div>
      <div><span>Alasan</span><strong>${esc(alasan)}</strong></div>
      <div><span>Status</span><strong>${esc(st.label)}</strong></div>
      <div><span>Dikirim</span><strong>${tanggal(sg.created_at)}</strong></div>
    </div>
    <div class="sr-result-note">
      <h4>Bukti pendukung</h4>
      <p>${bukti}</p>
    </div>
    ${sg.admin_response ? `
    <div class="sr-result-note">
      <h4>Tanggapan tim peninjau</h4>
      <p>${esc(sg.admin_response)}</p>
    </div>` : ""}`;
}

function buildCard(l, sg) {
  const id = l ? l.nomor_tiket : sg.report_id;
  const filter = sg ? (STATUS[sg.status] || STATUS.pending).filter : "none";

  const card = document.createElement("article");
  card.className = "sr-report";
  card.dataset.status = filter;
  card.dataset.dynamic = "true";

  let aksi = "";
  if (sg) {
    aksi = `<button type="button" class="sr-btn sr-btn-secondary" aria-expanded="false">Lihat sanggahan</button>`;
  } else if (l && l.statusTransaksi === "scam") {
    aksi = `<a class="sr-btn sr-btn-secondary" href="${AJUKAN_SANGGAHAN}?id=${encodeURIComponent(id)}">Ajukan sanggahan</a>`;
  }

  // Urutan: LAPORAN dulu, lalu tombol, lalu SANGGAHAN (muncul di bawah laporan saat diklik)
  card.innerHTML = `
    <div class="sr-view sr-view-laporan">${laporanView(l, id)}</div>
    <div class="sr-actions">${aksi}</div>
    <div class="sr-view sr-view-sanggahan" hidden
         style="margin-top:12px;padding-top:12px;border-top:1px dashed #cbd5e1">${sg ? sanggahanView(sg) : ""}</div>`;

  const btn = card.querySelector("button");
  if (btn) {
    const vSanggahan = card.querySelector(".sr-view-sanggahan");
    btn.addEventListener("click", () => {
      const buka = vSanggahan.hidden; // laporan tetap tampil, hanya sanggahan yang dibuka/ditutup
      vSanggahan.hidden = !buka;
      btn.setAttribute("aria-expanded", String(buka));
      btn.textContent = buka ? "Sembunyikan sanggahan" : "Lihat sanggahan";
    });
  }
  return card;
}

// Angka ringkasan dihitung dari status sanggahan
function updateStats(items, total) {
  const c = { total: total ?? items.length, response: 0, review: 0, done: 0 };
  items.forEach(i => { c[(STATUS[i.status] || STATUS.pending).filter]++; });
  Object.entries(c).forEach(([key, val]) => {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = val;
  });
}

// Filter dihitung ulang dari kartu yang ada sekarang (termasuk yang dimuat dari server)
let activeFilter = "all";
let emptyText = "Memuat laporan...";

function showToast(message, type = "info") {
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

  toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-message">${esc(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.95)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function showSkeleton(count = 2) {
  const list = document.querySelector(".sr-report-list");
  const emptyEl = document.getElementById("srEmptyState");
  const errorEl = document.getElementById("srErrorState");
  if (emptyEl) emptyEl.hidden = true;
  if (errorEl) errorEl.hidden = true;
  if (!list) return;

  const skeletons = [];
  for (let i = 0; i < count; i++) {
    skeletons.push(`
      <article class="skeleton-card" aria-hidden="true">
        <div class="skeleton-row">
          <div class="skeleton-bar skeleton-badge"></div>
          <div class="skeleton-bar skeleton-id"></div>
        </div>
        <div class="skeleton-bar skeleton-title"></div>
        <div class="skeleton-bar skeleton-meta"></div>
        <div class="skeleton-bar skeleton-desc-1"></div>
        <div class="skeleton-footer">
          <div class="skeleton-bar skeleton-footer-left"></div>
          <div class="skeleton-bar skeleton-footer-right"></div>
        </div>
      </article>
    `);
  }
  list.innerHTML = skeletons.join("");
}

function applyFilter() {
  const list = document.querySelector(".sr-report-list");
  const emptyEl = document.querySelector(".sr-empty");
  const emptyState = document.getElementById("srEmptyState");
  const emptyTitle = document.getElementById("srEmptyTitle");
  const emptyTextEl = document.getElementById("srEmptyText");
  if (!list) return;

  const cards = [...list.querySelectorAll(".sr-report")];
  let visible = 0;
  cards.forEach(c => {
    const show = activeFilter === "all" || c.dataset.status === activeFilter;
    c.hidden = !show;
    if (show) visible++;
  });

  if (emptyEl) emptyEl.hidden = true; // Sembunyikan pesan teks lama

  if (emptyState) {
    if (visible === 0) {
      emptyState.hidden = false;
      const filterNames = { all: "semua", response: "Perlu Tanggapan", review: "Ditinjau", done: "Selesai" };
      if (cards.length === 0) {
        if (emptyTitle) emptyTitle.textContent = "Belum Ada Laporan Toko";
        if (emptyTextEl) emptyTextEl.textContent = "Belum ada laporan keluhan yang tercatat untuk toko ini di sistem TrustX.";
      } else {
        if (emptyTitle) emptyTitle.textContent = `Tidak Ada Laporan (${filterNames[activeFilter] || activeFilter})`;
        if (emptyTextEl) emptyTextEl.textContent = `Tidak ditemukan laporan dengan status "${filterNames[activeFilter] || activeFilter}". Klik tombol di bawah untuk mereset filter.`;
      }
    } else {
      emptyState.hidden = true;
    }
  }
}

function initFilters() {
  const filters = document.querySelectorAll(".sr-filter");
  const filterNames = { all: "Semua", response: "Perlu Tanggapan", review: "Ditinjau", done: "Selesai" };

  filters.forEach(btn => btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    filters.forEach(f => {
      const on = f === btn;
      f.classList.toggle("active", on);
      f.setAttribute("aria-pressed", String(on));
    });
    showToast(`Filter laporan toko: ${filterNames[activeFilter] || activeFilter}`, "info");
    applyFilter();
  }));

  const btnReset = document.getElementById("btnResetFilterSeller");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      activeFilter = "all";
      filters.forEach(f => {
        const on = f.dataset.filter === "all";
        f.classList.toggle("active", on);
        f.setAttribute("aria-pressed", String(on));
      });
      showToast("Filter berhasil direset ke Semua", "info");
      applyFilter();
    });
  }

  const btnRetry = document.getElementById("btnRetrySeller");
  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      showToast("Mencoba memuat ulang laporan toko...", "info");
      loadSanggahan();
    });
  }
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Status " + res.status + " pada " + url);
  return res.json();
}

async function loadSanggahan() {
  const list = document.querySelector(".sr-report-list");
  const errorEl = document.getElementById("srErrorState");
  const errorTextEl = document.getElementById("srErrorText");
  const emptyState = document.getElementById("srEmptyState");
  if (!list) return;

  showSkeleton(2);

  const [rLap, rSg] = await Promise.allSettled([
    getJSON(`${API_BASE}/laporan-akun/?akun=${encodeURIComponent(AKUN_SAYA)}`),
    getJSON(`${API_BASE}/sanggahan/`),
  ]);

  if (rLap.status === "rejected") console.error("Gagal memuat laporan:", rLap.reason);
  if (rSg.status === "rejected") console.error("Gagal memuat sanggahan:", rSg.reason);

  if (rLap.status === "rejected" && rSg.status === "rejected") {
    list.innerHTML = "";
    if (emptyState) emptyState.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      if (errorTextEl) errorTextEl.textContent = "Tidak dapat terhubung ke server Django di http://127.0.0.1:8000. Pastikan server backend sedang aktif.";
    }
    showToast("Gagal terhubung ke server backend", "error");
    return;
  }

  if (errorEl) errorEl.hidden = true;

  const dLap = rLap.status === "fulfilled" ? rLap.value : [];
  const dSg = rSg.status === "fulfilled" ? rSg.value : [];
  const laporan = (Array.isArray(dLap) ? dLap : dLap.laporan || []).filter(l => l.nomor_tiket);
  const sanggahan = Array.isArray(dSg) ? dSg : (dSg.results || []);

  if (rSg.status === "fulfilled") updateStats(sanggahan, dSg.count);

  const ada = new Set(laporan.map(l => String(l.nomor_tiket).toLowerCase()));
  const toko = [...new Set(sanggahan
    .filter(sg => sg.store_name && !ada.has(String(sg.report_id).toLowerCase()))
    .map(sg => sg.store_name))];
  const tambahan = await Promise.allSettled(
    toko.map(t => getJSON(`${API_BASE}/laporan-akun/?akun=${encodeURIComponent(t)}`))
  );
  tambahan.forEach(r => {
    if (r.status !== "fulfilled") return;
    const rows = Array.isArray(r.value) ? r.value : (r.value.laporan || []);
    rows.forEach(l => {
      const key = String(l.nomor_tiket || "").toLowerCase();
      if (key && !ada.has(key)) { laporan.push(l); ada.add(key); }
    });
  });

  const sgPerLaporan = new Map();
  sanggahan.forEach(sg => {
    const key = String(sg.report_id).toLowerCase();
    if (!sgPerLaporan.has(key)) sgPerLaporan.set(key, sg);
  });

  const entries = laporan.map(l => {
    const sg = sgPerLaporan.get(String(l.nomor_tiket).toLowerCase()) || null;
    return { l, sg, waktu: new Date(l.diterbitkan || 0) };
  });

  const dipakai = new Set(laporan.map(l => String(l.nomor_tiket).toLowerCase()));
  sgPerLaporan.forEach((sg, key) => {
    if (!dipakai.has(key)) entries.push({ l: null, sg, waktu: new Date(sg.created_at || 0) });
  });

  entries.sort((a, b) => b.waktu - a.waktu);

  list.innerHTML = "";
  entries.forEach(e => list.append(buildCard(e.l, e.sg)));

  showToast(`${entries.length} laporan toko berhasil disinkronkan`, "success");
  applyFilter();
}

document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  loadSanggahan();
});
})();