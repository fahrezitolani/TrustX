/* TrustX Seller — ikon, data demo, beranda, dan detail profil penjual.
   Data di bawah hanya contoh demonstrasi; ganti dengan data dari backend. */
(function () {
  "use strict";

  /* ---------- Ikon (SVG inline, viewBox 24) ---------- */
  const IC = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldcheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3"/>',
    userx: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0M17 8l5 5M22 8l-5 5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    xcircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11"/><path d="M3 11l4-4 5 1 3-1 6 5-3 3"/><path d="m7 7-4 4 7 7a1.4 1.4 0 0 0 2-2"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    flag: '<path d="M5 22V4M5 4h12l-2 4 2 4H5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    thumb: '<path d="M7 10v11H3V10zM7 10l4-8a2.5 2.5 0 0 1 2.5 3L13 9h6a2 2 0 0 1 2 2.3l-1.3 8A2 2 0 0 1 17.7 21H7"/>',
    clip: '<path d="m21 12-8.6 8.6a5 5 0 0 1-7-7L14 4.9a3.3 3.3 0 0 1 4.7 4.7l-9.2 9.2a1.7 1.7 0 0 1-2.4-2.4L15 8"/>',
    scale: '<path d="M12 3v18M5 21h14M5 7h14"/><path d="m5 7-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.7 7L3 21l2-5.3A8 8 0 1 1 21 12z"/>',
    bank: '<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>'
  };
  const svg = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || "") + "</svg>";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function injectIcons(root) {
    (root || document).querySelectorAll("[data-ic]").forEach((el) => {
      if (el.querySelector(":scope > svg")) return;
      el.insertAdjacentHTML("afterbegin", svg(el.dataset.ic));
    });
  }

  /* ---------- Data demo ---------- */
  // Akun toko milik penjual yang sedang login (ganti dengan data sesi nyata).
  const AKUN_SAYA = new URLSearchParams(location.search).get("akun") || "@buyer_gadget";
  const DETAIL = "detail-profile-seller.html";
  const PENINJAUAN = "dashboard-laporanseller.html";
  const SANGGAHAN = "sanggahan.html";
  const API = "http://127.0.0.1:8000/api";

  const FEED = [
    { user: "@wts_photoc***", type: "red", label: "Laporan Tipu", icon: "alert",
      text: "No. WA: 0813-9821-xxxx • DP tiket konser ditransfer tapi tiket fisik tidak dikirim & kontak langsung diblokir.",
      time: "12 menit lalu", meta: "4 korban melapor", metaIcon: "userx", metaClass: "red" },
    { user: "@trustedseller_id", type: "green", label: "Terverifikasi Aman", icon: "check",
      text: "Pembelian album sealed tiba aman packing tebal bubble wrap kardus double wall. Fast respon rekber TrustX disetujui.",
      time: "1 jam lalu", meta: "38 testimoni positif", metaIcon: "thumb" }
  ];

  const ACCOUNTS = {
    "@buyer_gadget": {
      name: "@buyer_gadget", wa: "0812-3456-7890", bank: "BCA", rek: "5210-xxxx a/n B*** S***",
      risk: "high", rating: 1.8, total: 1, success: 12,
      warning: 'Akun ini memiliki laporan komunitas aktif (#LP-8790) yang memerlukan tanggapan sanggahan.',
      reports: [
        { id: "LP-8790", ts: 1, when: "3 Hari Lalu",
          text: "Klaim barang tidak sesuai deskripsi. Bukti unboxing & resi telah diunggah.",
          file: "Bukti_Unboxing.jpg", verified: false, sanggah: null }
      ]
    },
    "@seller_gadget_murah": {
      name: "@seller_gadget_murah", wa: "0812-3456-7890", bank: "BCA", rek: "5210-xxxx a/n B*** S***",
      risk: "high", rating: 1.8, total: 8, success: 1,
      warning: 'Nomor WhatsApp & no rekening ini pernah dilaporkan <b>5× dalam 7 hari terakhir</b> terkait bukti resi fiktif.',
      reports: [
        { id: "LP-8821", ts: 2, when: "Kemarin, 14:20",
          text: "Beli lightstick BTS seharga 650rb, setelah transfer langsung di-block WhatsApp dan akun Twitter ganti handle.",
          file: "Bukti_Transfer.jpg", verified: true,
          sanggah: { state: "Menunggu Verifikasi Admin",
            text: "Klarifikasi: Buyer salah paham mengenai nomor resi yang tertunda ekspedisi H+1 karena hari libur nasional. Paket sudah diterima dan diselesaikan dengan bukti chat terlampir.",
            file: "Resi_Valid.jpg" } },
        { id: "LP-8790", ts: 1, when: "3 Hari Lalu",
          text: "Mengaku punya proof video card, ternyata video curian dari seller lain di Carousell.",
          file: "Chat_Log.png", verified: false, sanggah: null }
      ]
    },
    "@trustedseller_id": {
      name: "@trustedseller_id", wa: "0857-1122-3344", bank: "BNI", rek: "0412-xxxx a/n T*** I***",
      risk: "safe", rating: 4.9, total: 0, success: 38,
      warning: "Belum ada laporan yang masuk. Tetap gunakan rekber untuk transaksi bernilai besar.",
      reports: []
    }
  };

  /* ---------- Util ---------- */
  const digits = (s) => String(s).replace(/\D/g, "").replace(/^62/, "0");
  const normUser = (s) => "@" + String(s).trim().replace(/^@/, "").toLowerCase();
  function findAccount(q) {
    if (!q) return null;
    const d = digits(q);
    return Object.values(ACCOUNTS).find((a) =>
      normUser(a.name) === normUser(q) || (d.length > 5 && digits(a.wa) === d)) || null;
  }
  const isOwn = (acc) => !!acc && normUser(acc.name) === normUser(AKUN_SAYA);

  /* ---------- Beranda ---------- */
  function initHome() {
    const feed = document.getElementById("feed");
    if (!feed) return;
    feed.innerHTML = FEED.map((f) => `
      <li class="fi"><header>
        <a class="who" href="${DETAIL}?q=${encodeURIComponent(f.user)}"><i class="av">@</i>${esc(f.user)}</a>
        <span class="badge b-${f.type}">${svg(f.icon)}${esc(f.label)}</span></header>
        <blockquote>${esc(f.text)}</blockquote>
        <footer><span>${svg("clock")}${esc(f.time)}</span>
        <span${f.metaClass === "red" ? ' style="color:var(--red);font-weight:700"' : ' style="color:var(--navy);font-weight:700"'}>${svg(f.metaIcon)}${esc(f.meta)}</span></footer></li>`).join("");

    const tabs = document.querySelectorAll(".tab");
    const q = document.getElementById("q");
    const err = document.getElementById("err");
    let mode = "wa";
    const cfg = {
      wa: { ph: "Masukkan nomor WhatsApp...", im: "tel", re: /^(\+?62|0)8\d{7,12}$/, msg: "Masukkan nomor WhatsApp yang valid, contoh 081234567890." },
      x: { ph: "Masukkan username X, contoh @namaakun", im: "text", re: /^@?[A-Za-z0-9_]{1,15}$/, msg: "Username X hanya boleh huruf, angka, dan garis bawah (maks. 15 karakter)." }
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      mode = t.dataset.m;
      tabs.forEach((o) => o.setAttribute("aria-pressed", String(o === t)));
      q.placeholder = cfg[mode].ph; q.inputMode = cfg[mode].im;
      q.value = ""; err.textContent = ""; q.removeAttribute("aria-invalid"); q.focus();
    }));
    document.getElementById("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = q.value.trim().replace(/[\s-]/g, "");
      if (!cfg[mode].re.test(v)) {
        err.textContent = cfg[mode].msg; q.setAttribute("aria-invalid", "true"); q.focus(); return;
      }
      q.removeAttribute("aria-invalid"); err.textContent = "";
      location.href = DETAIL + "?m=" + mode + "&q=" + encodeURIComponent(v);
    });
  }





  /* ---------- Detail profil ---------- */
  async function initDetail() {
    const params = new URLSearchParams(location.search);
    const query = (params.get("q") || AKUN_SAYA).trim();
    const m = params.get("m") === "wa" ? "wa" : "x";

    /* Ambil data dari backend API; fallback ke data dummy jika gagal. */
    let acc = null;
    try {
      const res = await fetch(`${API}/akun/cari/?m=${m}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.ditemukan) {
          const stMap = {
            high: { risk: "high", label: "Status: Berisiko Tinggi", icon: "alert" },
            warn: { risk: "high", label: "Status: Perlu Diwaspadai", icon: "alert" },
            safe: { risk: "safe", label: "Status: Aman", icon: "check" },
            none: { risk: "none", label: "Status: Belum Ada Laporan", icon: "search" }
          };
          const st = stMap[d.status.kode] || stMap.none;
          acc = {
            _fromApi: true,
            name: d.nama,
            wa: d.wa || "",
            bank: "",
            rek: "",
            risk: st.risk,
            rating: d.rating || 0,
            total: (d.laporan || []).length,
            success: d.aman || 0,
            warning: d.status.kode === "safe"
              ? "Belum ada laporan yang masuk. Tetap gunakan rekber untuk transaksi bernilai besar."
              : d.status.kode === "none"
              ? "Belum ada data statistik untuk akun ini."
              : `Identitas ini memiliki ${(d.laporan || []).length} laporan.`,
            reports: (d.laporan || []).map((r, i) => ({
              id: r[0],
              ts: r[1],
              when: r[1] === 0 ? "Hari ini" : r[1] === 1 ? "Kemarin" : `${r[1]} Hari Lalu`,
              text: r[2],
              file: r[3] || `Bukti_${i + 1}.jpg`,
              verified: r[4],
              sanggah: null
            }))
          };
        }
      }
    } catch { /* abaikan, pakai fallback */ }
    if (!acc) { acc = findAccount(query); }

    /* Indikator sumber data: server atau cadangan (offline). */
    if (acc._fromApi) {
      const el = document.createElement('div');
      el.className = 'info';
      el.style.cssText = 'font-size:12px;color:var(--muted);margin-top:8px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#f4f6fa';
      el.innerHTML = '<strong>Data dari server TrustX</strong> — laporan baru akan muncul di sini setelah diverifikasi.';
      const content = document.getElementById('content');
      if (content) content.insertAdjacentElement('beforebegin', el);
    }

    const own = isOwn(acc);
    document.getElementById("kw").textContent = acc ? acc.name : query;
    const content = document.getElementById("content");
    const actbar = document.getElementById("actbar");

    if (!acc) {
      content.innerHTML = `<div class="card empty" style="grid-column:1/-1"><span class="ico">${svg("search")}</span>
        <h2>Belum ada data untuk akun ini</h2>
        <p>Akun <b>${esc(query)}</b> belum memiliki laporan di TrustX. Tetap berhati-hati dan gunakan rekber.</p></div>`;
      actbar.innerHTML = `<a class="btn pri" href="index-seller.html">Cari Akun Lain</a><a class="btn out" href="lapor.html">${svg("flag")}Lapor Transaksi</a>`;
      injectIcons(); return;
    }

    const firstSanggah = acc.reports.find((r) => r.sanggah) || acc.reports[0];
    const toReview = PENINJAUAN + (firstSanggah ? "?id=" + encodeURIComponent(firstSanggah.id) : "");
    const risk = { high: ["s-high", "Status: Berisiko Tinggi", "alert"], safe: ["s-safe", "Status: Aman", "check"] }[acc.risk];

    const banner = own ? `<section class="sg-banner" aria-label="Hak sanggah penjual"><span>${svg("shieldcheck")}</span>
        <div><b>Ini Akun Toko Kamu?</b><small>Gunakan hak sanggah</small></div>
        <a href="${toReview}">Ajukan Sanggah</a></section>` : "";

    const profile = `<section class="card" aria-label="Profil akun">
      <div class="status ${risk[0]}">${svg(risk[2])}${risk[1].toUpperCase()}</div>
      <div class="ident"><span class="avatar">${svg("store")}${acc.risk === "high" ? `<span class="shield-mini">${svg("shield")}</span>` : ""}</span>
        <div><h2>${esc(acc.name)}${svg("xcircle")}</h2>
        <dl><div><dt>${svg("chat")}WhatsApp</dt><dd>${esc(acc.wa)}</dd></div>
        <div><dt>${svg("bank")}${esc(acc.bank)}</dt><dd>${esc(acc.rek)}</dd></div></dl></div></div>
      <div class="stats">
        <div class="stat star"><small>Rating</small><b><span>★</span> ${acc.rating.toFixed(1)} <small>/5</small></b></div>
        <div class="stat bad"><small>Total lapor</small><b>${acc.total} <small>Korban</small></b></div>
        <div class="stat ok"><small>Status aman</small><b>${acc.success} <small>Sukses</small></b></div></div>
      <div class="warn${acc.risk === "safe" ? " info" : ""}"><h3>${svg("shield")}Peringatan Sistem</h3><p>${acc.warning}</p></div></section>`;

    const reportsSection = `<section aria-labelledby="rh"><div class="sechead"><h2 id="rh">Riwayat Laporan Korban <span class="cnt">${acc.reports.length}</span></h2>
      <select id="sort" aria-label="Urutkan laporan"><option value="new">Terbaru</option><option value="old">Terlama</option></select></div>
      <ul class="rep" id="rep"></ul></section>
      <section class="card"><h2>Riwayat Transaksi Aman</h2><div id="aman"></div></section>`;

    content.innerHTML = `<div class="col-side">${banner}${profile}</div><div class="col-main">${reportsSection}</div>`;

    function renderReports() {
      const dir = document.getElementById("sort").value === "old" ? 1 : -1;
      const list = [...acc.reports].sort((a, b) => dir * (a.ts - b.ts));
      document.getElementById("rep").innerHTML = list.length ? list.map((r) => {
        const sg = r.sanggah ? `<div class="sg-box"><header><span>${svg("scale")}Sanggahan Resmi Penjual</span><span class="badge b-green">Hak Jawab</span></header>
            <div class="sg-state">${svg("clock")}${esc(r.sanggah.state)}</div>
            <p>“${esc(r.sanggah.text)}”</p>
            <footer><a href="${PENINJAUAN}?id=${encodeURIComponent(r.id)}">${svg("clip")}Lihat ${esc(r.sanggah.file)}</a><span>Diunggah Penjual</span></footer></div>` : "";
        const noSg = !r.sanggah ? `<span class="chip red">Belum ada sanggahan</span>` +
          (own ? `<a class="chip link" href="${PENINJAUAN}?id=${encodeURIComponent(r.id)}">${svg("scale")}Sanggah</a>` : "") : "";
        return `<li><header><strong><i class="rdot"></i>Laporan #${esc(r.id)}</strong><time>${esc(r.when)}</time></header>
          <p>“${esc(r.text)}”</p>
          <div class="chips"><span class="chip">${svg("image")}${esc(r.file)}</span>${r.verified ? `<span class="chip">${svg("check")}Terverifikasi Admin</span>` : ""}${noSg}</div>${sg}</li>`;
      }).join("") : `<li><p class="safe">Belum ada laporan untuk akun ini.</p></li>`;
      injectIcons(document.getElementById("rep"));
    }
    document.getElementById("sort").addEventListener("change", renderReports);
    renderReports();

    const amanEl = document.getElementById("aman");
    amanEl.innerHTML = acc.transaksi && acc.transaksi.length
      ? `<ul class="rep">${acc.transaksi.map(t => `<li><p style="margin:0">${svg("check")} ${esc(t)}</p></li>`).join("")}</ul>`
      : `<p class="safe">${acc.success ? `${acc.success} transaksi aman tercatat (rincian belum tersedia).` : "Belum ada riwayat transaksi aman yang dilaporkan."}</p>`;

    actbar.innerHTML = own
      ? `<a class="btn dark" href="${toReview}">${svg("shieldcheck")}Sanggah Laporan</a><a class="btn out" href="lapor.html?akun=${encodeURIComponent(acc.name)}">${svg("flag")}Lapor Transaksi</a>`
      : `<a class="btn pri" href="index-seller.html">Cari Akun Lain</a><a class="btn out" href="lapor.html?akun=${encodeURIComponent(acc.name)}">${svg("flag")}Lapor Transaksi</a>`;
    injectIcons();
  }

  /* ---------- Dashboard laporan ---------- */
function initReports() {
  // Lihat detail / hasil peninjauan
  document.querySelectorAll("[data-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.dataset.detail);
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  // Ajukan klarifikasi -> form sanggahan
  document.querySelectorAll("[data-appeal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.href = SANGGAHAN + "?id=" + encodeURIComponent(btn.dataset.appeal);
    });
  });

  // Filter status (membaca kartu saat diklik, jadi kartu dari API ikut tersaring)
  // Filter dipertahankan di sanggahan.js (initFilters) agar kartu dinamis ikut tersaring.
  // Blok ini sengaja dinonaktifkan untuk menghindari listener ganda pada .sr-filter.
  return;
}

  document.addEventListener("DOMContentLoaded", () => {
    injectIcons();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page == "report") initReports();
    if (page === "detail-seller") initDetail();
    // R6: tombol lonceng -> toast jujur
    document.querySelectorAll('button[aria-label="Notifikasi"]').forEach((b) => {
      b.addEventListener("click", () => {
        let t = document.getElementById("trustx-toast");
        if (!t) {
          t = document.createElement("div");
          t.id = "trustx-toast";
          t.style.cssText = "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:8px;z-index:9999;font-size:14px;opacity:0;transition:opacity .2s;";
          document.body.appendChild(t);
        }
        t.textContent = "Notifikasi belum tersedia";
        t.style.opacity = "1";
        clearTimeout(t._t);
        t._t = setTimeout(() => { t.style.opacity = "0"; }, 2000);
      });
    });
  });
})();


