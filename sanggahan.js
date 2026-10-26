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

function applyFilter() {
  const list = document.querySelector(".sr-report-list");
  const emptyEl = document.querySelector(".sr-empty");
  if (!list) return;

  const cards = [...list.querySelectorAll(".sr-report")];
  let visible = 0;
  cards.forEach(c => {
    const show = activeFilter === "all" || c.dataset.status === activeFilter;
    c.hidden = !show;
    if (show) visible++;
  });

  if (emptyEl) {
    emptyEl.textContent = cards.length ? "Tidak ada laporan untuk kategori ini." : emptyText;
    emptyEl.hidden = visible > 0;
  }
}

function initFilters() {
  const filters = document.querySelectorAll(".sr-filter");
  filters.forEach(btn => btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    filters.forEach(f => {
      const on = f === btn;
      f.classList.toggle("active", on);
      f.setAttribute("aria-pressed", String(on));
    });
    applyFilter();
  }));
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Status " + res.status + " pada " + url);
  return res.json();
}

async function loadSanggahan() {
  const list = document.querySelector(".sr-report-list");
  if (!list) return;

  applyFilter(); // tampilkan "Memuat laporan..." selagi menunggu server

  const [rLap, rSg] = await Promise.allSettled([
    getJSON(`${API_BASE}/laporan-akun/?akun=${encodeURIComponent(AKUN_SAYA)}`),
    getJSON(`${API_BASE}/sanggahan/`),
  ]);

  if (rLap.status === "rejected") console.error("Gagal memuat laporan:", rLap.reason);
  if (rSg.status === "rejected") console.error("Gagal memuat sanggahan:", rSg.reason);

  if (rLap.status === "rejected" && rSg.status === "rejected") {
    emptyText = "Data belum dapat dimuat. Periksa koneksi ke server.";
    applyFilter();
    return;
  }

  const dLap = rLap.status === "fulfilled" ? rLap.value : [];
  const dSg = rSg.status === "fulfilled" ? rSg.value : [];
  const laporan = (Array.isArray(dLap) ? dLap : dLap.laporan || []).filter(l => l.nomor_tiket);
  const sanggahan = Array.isArray(dSg) ? dSg : (dSg.results || []);

  if (rSg.status === "fulfilled") updateStats(sanggahan, dSg.count);

  // Sanggahan yang laporannya belum ditemukan: ambil laporan dari toko (store_name) sanggahan itu,
  // supaya tidak bergantung pada AKUN_SAYA yang masih hard-code.
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

  // Satu laporan -> sanggahan terbarunya (API mengurutkan terbaru dulu)
  const sgPerLaporan = new Map();
  sanggahan.forEach(sg => {
    const key = String(sg.report_id).toLowerCase();
    if (!sgPerLaporan.has(key)) sgPerLaporan.set(key, sg);
  });

  const entries = laporan.map(l => {
    const sg = sgPerLaporan.get(String(l.nomor_tiket).toLowerCase()) || null;
    return { l, sg, waktu: new Date(l.diterbitkan || 0) };
  });

  // Sanggahan yang laporannya tidak ada di daftar tetap ditampilkan
  const dipakai = new Set(laporan.map(l => String(l.nomor_tiket).toLowerCase()));
  sgPerLaporan.forEach((sg, key) => {
    if (!dipakai.has(key)) entries.push({ l: null, sg, waktu: new Date(sg.created_at || 0) });
  });

  entries.sort((a, b) => b.waktu - a.waktu);

  list.querySelectorAll("[data-dynamic]").forEach(n => n.remove());
  entries.forEach(e => list.append(buildCard(e.l, e.sg)));

  emptyText = "Belum ada laporan terhadap akun ini.";
  applyFilter();
}

document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  loadSanggahan();
});
})();