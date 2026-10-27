"use strict";
const IC = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  flag: '<path d="M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1"/>',
  mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8"/>',
  store: '<path d="M3 9l1-5h16l1 5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 21V12M19 21V12M3 21h18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'
};
const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const qs = (m, q) => `m=${m}&q=${encodeURIComponent(q)}`;
const waktu = d => d === 0 ? "Hari ini" : d === 1 ? "Kemarin" : `${d} hari lalu`;
const API = "https://fahrezitolani.pythonanywhere.com/api";

/* ---------- Home ---------- */
function initHome() {
  let mode = params.get("m") === "x" ? "x" : "wa";
  const tabs = [...document.querySelectorAll(".tab")], input = $("q"), err = $("err"), btn = $("go");
  const label = btn.innerHTML;
  function setMode(m, reset) {
    mode = m;
    tabs.forEach(t => t.setAttribute("aria-pressed", String(t.dataset.m === m)));
    input.placeholder = m === "wa" ? "Masukkan nomor WhatsApp..." : "Masukkan username X, mis. @toko_jersey_ori";
    input.inputMode = m === "wa" ? "tel" : "text";
    input.removeAttribute("aria-invalid"); err.textContent = "";
    if (reset) { input.value = ""; input.focus(); }
  }
  setMode(mode); input.value = params.get("q") || "";
  tabs.forEach(t => t.addEventListener("click", () => setMode(t.dataset.m, true)));
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const msg = validasi(mode, input.value);
    if (msg) { err.textContent = msg; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Memeriksa...';
    setTimeout(() => { location.href = `${ROUTE.hasil}?${qs(mode, input.value.trim())}`; }, 600);
  });
  addEventListener("pageshow", () => { btn.disabled = false; btn.innerHTML = label; });
  $("feed").innerHTML = FEED.map(f => {
    const tipu = f.tipe === "tipu";
    const href = `${ROUTE.detail}?${qs("x", f.id)}`;
    return `<li class="fi"><header><a class="who" href="${href}" aria-label="Lihat detail reputasi ${esc(f.akun)}"><i class="av">${esc(f.akun.replace("@", "")[0])}</i>${esc(f.akun)}</a>
      <span class="badge ${tipu ? "b-red" : "b-green"}">${svg(tipu ? "alert" : "check")}${tipu ? "Laporan Tipu" : "Terverifikasi Aman"}</span></header>
      <blockquote>${esc(f.teks)}</blockquote>
      <footer><span>${svg("clock")}${esc(f.waktu)}</span><span>${svg(tipu ? "users" : "check")}${esc(f.info)}</span></footer></li>`;
  }).join("");
}

/* ---------- Konteks pencarian (dipakai Hasil & Detail) ---------- */
function ambilKonteks() {
  const m = params.get("m") === "wa" ? "wa" : "x", q = params.get("q") || "";
  if (validasi(m, q)) { location.replace(ROUTE.home); return null; }
  const ctx = qs(m, q);
  $("kw").textContent = q;
  $("ubah").href = `${ROUTE.home}?${ctx}`;
  return { m, q, ctx, a: cari(m, q) };
}
const tipsCard = () => `<section class="card tips"><h3>Tips aman transaksi medsos:</h3><ul>${TIPS.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>`;
const aksi = (lapor = true) => `<div class="stack">${lapor ? `<a class="btn pri dark" href="${ROUTE.lapor}">+ LAPORKAN PENGALAMAN TRANSAKSI</a>` : ""}<a class="btn sec" href="${ROUTE.home}">Cari Akun Lain (Reset Pencarian)</a></div>`;
const emptyState = (badge, judul, teks) => `<section class="empty"><div class="ico">${svg("search")}</div>
  <span class="badge b-gray">${badge}</span><h2>${judul}</h2><p>${teks}</p></section>`;

/* ---------- Hasil ---------- */
function initHasil() {
  const k = ambilKonteks(); if (!k) return;
  const { a, ctx } = k, out = $("content");
  if (!a) {
    out.innerHTML = emptyState("TIDAK DITEMUKAN", "Identitas Tidak Ditemukan", "Identitas ini tidak ada di database TrustX. Periksa kembali penulisan atau coba pencarian lain. Tidak adanya data bukan berarti akun aman.") + tipsCard() + aksi(false);
  } else if (a.status.kode === "none") {
    out.innerHTML = emptyState("BELUM ADA LAPORAN", "Akun Belum Tercatat di Database", "Belum ditemukan riwayat laporan untuk identitas ini. Ini bukan jaminan akun aman. Tetap waspada dan ikuti panduan mitigasi transaksi.") + tipsCard() + aksi();
  } else {
    const n = a.laporan.length, v = a.laporan.filter(r => r[4]).length;
    const ringkas = n ? `${n} laporan tercatat, ${v} di antaranya terverifikasi admin. Pelajari kronologinya sebelum transfer.`
      : `Belum ada laporan. Tercatat ${a.aman} transaksi aman dari komunitas. Ini bukan verifikasi identitas resmi.`;
    out.innerHTML = `<section class="card stack"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
      <h2 style="margin:0;overflow-wrap:anywhere">${esc(a.nama)}</h2><span class="badge ${a.status.badge}">${a.status.label}</span></div>
      <div class="stats" style="margin:0"><div class="stat ${n ? "bad" : ""}"><small>Laporan</small><b>${n}</b></div><div class="stat ${a.aman ? "ok" : ""}"><small>Transaksi aman</small><b>${a.aman}</b></div>
      ${a.rating ? `<div class="stat"><small>Rating</small><b>${a.rating}</b></div>` : ""}</div>
      <p class="safe">${ringkas}</p>
      <a class="btn pri" href="${ROUTE.detail}?${ctx}">LIHAT DETAIL REPUTASI</a></section>` + aksi();
  }
}

/* ---------- Detail Profile Buyer ---------- */
async function initDetail() {
  const k = ambilKonteks(); if (!k) return;
  const { m, q, ctx } = k;
  $("back").href = `${ROUTE.hasil}?${ctx}`;

  /* Ambil data dari backend API; fallback ke data dummy jika gagal. */
  let a = null;
  try {
    const res = await fetch(`${API}/akun/cari/?m=${m}&q=${encodeURIComponent(q)}`);
    if (res.ok) { const d = await res.json(); if (d.ditemukan) { a = d; a._fromApi = true; } }
  } catch { /* abaikan, pakai fallback */ }
  if (!a) { a = cari(m, q); }
  if (!a) { location.replace(`${ROUTE.hasil}?${ctx}`); return; }

  /* Indikator sumber data: server atau cadangan (offline). */
  const fromApi = a._fromApi;
  if (fromApi) {
    const el = document.createElement('div');
    el.className = 'info';
    el.style.cssText = 'font-size:12px;color:var(--muted);margin-top:8px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#f4f6fa';
    el.innerHTML = '<strong>Data dari server TrustX</strong> — laporan baru akan muncul di sini setelah diverifikasi.';
    const content = document.getElementById('content');
    if (content) content.insertAdjacentElement('beforebegin', el);
  }

  /* Arahkan tombol Lapor Transaksi ke formulir dengan akun yang sedang dilihat. */
  const laporBtn = document.querySelector('.actbar .btn.out[data-ic="flag"]');
  if (laporBtn) laporBtn.href = `lapor.html?akun=${encodeURIComponent(a.nama)}`;

  const s = a.status, n = a.laporan.length, v = a.laporan.filter(r => r[4]).length;
  const cls = { high: "s-high", warn: "s-warn", safe: "s-safe", none: "s-none" }[s.kode];
  const ikon = s.kode === "safe" ? "check" : s.kode === "none" ? "search" : "alert";
  let html = `<section class="card"><div class="status ${cls}">${svg(ikon)}Status: ${s.label}</div>
    <div class="ident"><div class="avatar">${svg("store")}</div><div><h2>${esc(a.nama)}</h2><dl>
    <div>Platform: <dd style="display:inline">${esc(a.platform)}</dd></div>${a.wa ? `<div>WhatsApp: <dd style="display:inline">${esc(a.wa)}</dd></div>` : ""}</dl></div></div>`;
  if (s.kode === "none") html += `<p class="safe" style="margin-top:14px">Belum ada data statistik untuk akun ini.</p>`;
  else html += `<div class="stats"><div class="stat ${n ? "bad" : ""}"><small>Total laporan</small><b>${n}</b></div><div class="stat ${a.aman ? "ok" : ""}"><small>Transaksi aman</small><b>${a.aman}</b></div>${a.rating ? `<div class="stat"><small>Rating</small><b>★ ${a.rating}<small style="display:inline">/5</small></b></div>` : ""}</div>`;
  if (n) {
    const c = a.laporan.filter(r => r[1] <= 7).length;
    html += `<div class="warn"><h3>${svg("shield")}Peringatan Sistem</h3><p>Identitas ini dilaporkan ${c ? c + "× dalam 7 hari terakhir" : n + "× secara total"}; ${v} dari ${n} laporan telah terverifikasi admin.</p></div>`;
  } else html += `<div class="warn info" style="margin-top:14px"><h3>${svg("shield")}Catatan</h3><p>${s.kode === "safe" ? "Riwayat transaksi aman berasal dari laporan komunitas, bukan verifikasi identitas resmi." : "Tidak adanya laporan tidak menjamin akun aman."}</p></div>`;
  html += `</section><section aria-labelledby="hl"><div class="sechead"><h2 id="hl">Riwayat Laporan <span class="cnt">${n}</span></h2>
    ${n > 1 ? `<select id="urut" aria-label="Urutkan laporan"><option value="baru">Terbaru</option><option value="lama">Terlama</option></select>` : ""}</div>
    <ul class="rep" id="rep" style="margin-top:12px"></ul></section>
    <section class="card"><h2>Riwayat Transaksi Aman</h2><div id="aman"></div></section>`;
  $("content").innerHTML = html;
  const rep = $("rep");
  const tampil = urut => {
    if (!n) { rep.innerHTML = `<li class="safe">Belum ada laporan untuk akun ini.</li>`; return; }
    const d = [...a.laporan].sort((x, y) => urut === "lama" ? y[1] - x[1] : x[1] - y[1]);
    rep.innerHTML = d.map(r => `<li><header><span><span class="dot" style="margin:0 8px 2px 0"></span>Laporan #${esc(r[0])}</span><time>${waktu(r[1])}</time></header>
      <p>“${esc(r[2])}”</p><div class="chips"><span class="chip">${svg("image")}${esc(r[3])}</span>
      <span class="chip">${svg(r[4] ? "check" : "clock")}${r[4] ? "Terverifikasi Admin" : "Menunggu Verifikasi"}</span></div></li>`).join("");
  };
  tampil("baru");
  if ($("urut")) $("urut").addEventListener("change", e => tampil(e.target.value));
  $("aman").innerHTML = a.transaksi ? `<ul class="rep">${a.transaksi.map(t => `<li><p style="margin:0">${svg("check")} ${esc(t)}</p></li>`).join("")}</ul>`
    : `<p class="safe">${a.aman ? `${a.aman} transaksi aman tercatat (rincian belum tersedia).` : "Belum ada riwayat transaksi aman yang dilaporkan."}</p>`;
}

function fallbackGambar() {
  document.querySelectorAll(".brand img, .greet .art img").forEach(img => {
    const pasang = () => {
      if (img.closest(".brand")) img.replaceWith(Object.assign(document.createElement("span"), { innerHTML: svg("shield").replace("<svg", '<svg class="logo" style="color:#162350;fill:#e6ebfb"') }).firstChild);
      else img.replaceWith(Object.assign(document.createElement("span"), { innerHTML: svg("shield") }).firstChild);
    };
    img.addEventListener("error", pasang);
    if (img.complete && img.naturalWidth === 0) pasang();
  });
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-ic]").forEach(el => { el.insertAdjacentHTML("afterbegin", svg(el.dataset.ic)); });
  fallbackGambar();
  ({ home: initHome, hasil: initHasil, detail: initDetail })[document.body.dataset.page]?.();
});
