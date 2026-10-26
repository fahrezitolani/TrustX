"use strict";

/* =====================================================================
   0. Perbaikan global: atribut [hidden] selalu menyembunyikan elemen,
      walaupun CSS memberi display:flex/grid pada kartu atau pesan kosong.
   ===================================================================== */
(() => {
  const style = document.createElement("style");
  style.textContent = "[hidden]{display:none !important}";
  document.head.appendChild(style);
})();

/* =====================================================================
   1. Pelaporan Transaksi (lapor.html, confirm-otp.html, success.html)
   Terhubung ke backend Django. Jalankan dulu: python manage.py runserver
   ===================================================================== */
(() => {
  const API = "http://127.0.0.1:8000/api"; // ganti saat backend sudah di-deploy
  const KEY = "trustx_draft", TIKET = "trustx_tiket";
  // TODO: ambil dari akun yang login (fitur 1). Sementara memakai nomor tetap.
  const PELAPOR = "081246817890";
  const KOSONG = { whatsapp: "", bank: "", rekening: "", scam: false, jumlah_scam_7_hari: 0 };
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage diblokir */ } }
  };
  const words = (t) => t.trim().match(/\S+/g) || [];
  const setErr = (id, msg) => { const e = $("#err-" + id); if (e) e.textContent = msg || ""; };
  const flat = (v) => Array.isArray(v) ? v.map(flat).join(" ") : (v && typeof v === "object") ? Object.values(v).map(flat).join(" ") : String(v);
  const PESAN_GAGAL = "Tidak dapat terhubung ke server. Pastikan backend berjalan, lalu coba lagi.";

  /* Pembungkus fetch: selalu mengembalikan { ok, status, data } dan tidak melempar error. */
  async function api(path, { method = "GET", json, form } = {}) {
    try {
      const opt = { method };
      if (json) { opt.headers = { "Content-Type": "application/json" }; opt.body = JSON.stringify(json); }
      if (form) opt.body = form;
      const res = await fetch(API + path, opt);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { detail: PESAN_GAGAL } };
    }
  }

  function lapor() {
    const f = $("#form-laporan"), user = $("#lawan"), kr = $("#kronologi");
    const inp = $("#bukti"), drop = $("#drop"), list = $("#berkas");
    const files = [];
    let akun = { wa: "", bank: "", rek: "" }; // data mentah dari server, ikut dikirim saat submit
    let seq = 0, timer;
    const prm = new URLSearchParams(location.search).get("akun");
    if (prm) user.value = prm;

    function tampil(d) {
      akun = { wa: d.whatsapp || "", bank: d.bank || "", rek: d.rekening || "" };
      $("#a-wa").textContent = akun.wa || "Belum terdata";
      $("#a-bank").textContent = akun.bank || "Rekening";
      $("#a-rek").textContent = akun.rek || "Belum terdata";
      const badge = d.scam ? "scam-user.svg" : "verified-user.svg";
      $("#badge").src = "assets/images/" + badge;
      $("#cek").src = "assets/images/" + (d.scam ? badge : "check-account.svg");
      $("#note-aman").hidden = !!d.scam; $("#note-scam").hidden = !d.scam;
      if (d.scam) $("#n-jml").textContent = d.jumlah_scam_7_hari;
    }
    function cekAkun(tunda) {
      const q = user.value.trim();
      $("#a-nama").textContent = q || "—";
      clearTimeout(timer);
      if (q.length < 3) { seq++; tampil(KOSONG); return; }
      timer = setTimeout(async () => {
        const n = ++seq;
        const r = await api("/akun/?q=" + encodeURIComponent(q));
        if (n === seq) tampil(r.ok ? r.data : KOSONG); // abaikan jawaban lama
      }, tunda);
    }
    user.addEventListener("input", () => cekAkun(400));
    user.addEventListener("blur", () => { if (user.value.trim()) user.readOnly = true; });
    user.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); user.blur(); } });
    $("#edit-lawan").addEventListener("click", () => { user.readOnly = false; user.focus(); user.select(); });
    cekAkun(0);

    kr.addEventListener("input", () => {
      let w = words(kr.value);
      if (w.length > 500) { kr.value = w.slice(0, 500).join(" "); w = words(kr.value); }
      $("#hitung").textContent = w.length + " / 500 kata";
      if (w.length) setErr("kronologi", "");
    });

    const fmt = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.ceil(b / 1024) + " KB";
    function draw() {
      $("#hdr-berkas").hidden = !files.length;
      $("#jml-berkas").textContent = files.length + "/3";
      list.textContent = "";
      files.forEach((x, i) => {
        const li = document.createElement("li"); li.className = "file";
        const im = document.createElement("img"); im.src = x.url; im.alt = "";
        const d = document.createElement("div");
        const n = document.createElement("strong"); n.textContent = x.file.name;
        const s = document.createElement("small"); s.textContent = fmt(x.file.size) + " • " + (x.ok ? "Terverifikasi Gambar" : "Memeriksa...");
        d.append(n, s);
        const b = document.createElement("button"); b.type = "button"; b.className = "rm";
        b.setAttribute("aria-label", "Hapus " + x.file.name);
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>';
        b.addEventListener("click", () => { URL.revokeObjectURL(x.url); files.splice(i, 1); setErr("bukti", ""); draw(); });
        li.append(im, d, b); list.append(li);
      });
    }
    function addFiles(fl) {
      const msgs = new Set();
      [...fl].forEach((fi) => {
        if (files.length >= 3) return msgs.add("Maksimal 3 berkas.");
        if (!/^image\/(png|jpeg)$/.test(fi.type)) return msgs.add(fi.name + ": hanya PNG atau JPG.");
        if (fi.size > 5 * 1048576) return msgs.add(fi.name + ": ukuran melebihi 5MB.");
        const x = { file: fi, url: URL.createObjectURL(fi), ok: false };
        files.push(x);
        const im = new Image();
        im.onload = () => { x.ok = true; draw(); };
        im.onerror = () => { const i = files.indexOf(x); if (i > -1) files.splice(i, 1); setErr("bukti", fi.name + ": file gambar rusak."); draw(); };
        im.src = x.url;
      });
      setErr("bukti", [...msgs].join(" ")); inp.value = ""; draw();
    }
    inp.addEventListener("change", () => addFiles(inp.files));
    ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const cek = $("#pernyataan"), btn = f.querySelector("button[type=submit]");
      const er = [
        ["lawan", user, user.value.trim().length < 3 ? "Isi username lawan transaksi." : ""],
        ["kronologi", kr, kr.value.trim().length < 20 ? "Tulis kronologi minimal 20 karakter." : ""],
        ["bukti", inp, files.length ? "" : "Unggah minimal 1 bukti transaksi."],
        ["pernyataan", cek, cek.checked ? "" : "Centang pernyataan untuk melanjutkan."]
      ];
      er.forEach(([id, , m]) => setErr(id, m)); setErr("form", "");
      const gagal = er.find((x) => x[2]);
      if (gagal) { if (gagal[0] === "lawan") user.readOnly = false; gagal[1].focus(); gagal[1].scrollIntoView({ block: "center", behavior: "smooth" }); return; }

      const fd = new FormData();
      fd.append("akun_target", user.value.trim());
      fd.append("whatsapp_target", akun.wa); fd.append("bank_target", akun.bank); fd.append("rekening_target", akun.rek);
      fd.append("status_transaksi", f.elements.status.value);
      fd.append("kronologi", kr.value.trim());
      fd.append("nomor_pelapor", PELAPOR);
      fd.append("pernyataan", "true");
      files.forEach((x) => fd.append("bukti", x.file));

      btn.disabled = true;
      const r = await api("/laporan/", { method: "POST", form: fd });
      btn.disabled = false;
      if (!r.ok) {
        const peta = { akun_target: "lawan", kronologi: "kronologi", bukti: "bukti", pernyataan: "pernyataan" };
        let ada = false;
        if (r.status === 400) Object.entries(r.data).forEach(([k, v]) => { setErr(peta[k] || "form", flat(v)); ada = true; });
        if (!ada) setErr("form", r.data.detail || "Laporan gagal dikirim. Coba lagi.");
        return;
      }
      store.set(KEY, { laporanId: r.data.laporan_id, pelapor: r.data.nomor_pelapor });
      location.href = "confirm-otp.html";
    });
  }

  function otp() {
    const d = store.get(KEY);
    if (!d || !d.laporanId) { location.replace("lapor.html"); return; }
    $("#whatsapp-number").textContent = d.pelapor;
    const boxes = [...document.querySelectorAll(".otp-input-row input")];
    const err = $("#otp-error"), ok = $("#otp-ok"), re = $("#resend-otp"), btn = $("#otp-form button[type=submit]");
    boxes.forEach((b, i) => {
      b.addEventListener("input", () => { b.value = b.value.replace(/\D/g, "").slice(-1); err.textContent = ""; if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener("paste", (e) => {
        const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        if (!t) return;
        e.preventDefault(); [...t].forEach((c, k) => { boxes[k].value = c; }); boxes[Math.min(t.length, 5)].focus();
      });
    });

    let s = 45, t;
    const tampilHitung = () => {
      re.disabled = s > 0;
      re.textContent = s > 0 ? "Kirim Ulang (00:" + String(s).padStart(2, "0") + ")" : "Kirim Ulang";
    };
    function mulaiHitung() { // sama dengan jeda kirim ulang di server (45 detik)
      clearInterval(t); s = 45; tampilHitung();
      t = setInterval(() => { s--; tampilHitung(); if (s <= 0) clearInterval(t); }, 1000);
    }
    mulaiHitung();

    const sesiHabis = "Sesi laporan tidak ditemukan atau sudah selesai. Mulai lagi dari formulir.";
    re.addEventListener("click", async () => {
      if (re.disabled) return;
      err.textContent = ""; ok.textContent = ""; re.disabled = true;
      const r = await api("/otp/kirim/", { method: "POST", json: { laporan_id: d.laporanId } });
      if (r.ok) { ok.textContent = r.data.detail; mulaiHitung(); return; }
      err.textContent = r.status === 404 ? sesiHabis : (r.data.detail || "Gagal mengirim ulang kode.");
      tampilHitung();
    });

    $("#otp-form").addEventListener("submit", async (e) => {
      e.preventDefault(); ok.textContent = "";
      const kode = boxes.map((b) => b.value).join("");
      if (kode.length < 6) { err.textContent = "Masukkan 6 digit kode OTP."; return; }
      btn.disabled = true;
      const r = await api("/otp/verifikasi/", { method: "POST", json: { laporan_id: d.laporanId, kode } });
      btn.disabled = false;
      if (!r.ok) { err.textContent = r.status === 404 ? sesiHabis : (r.data.detail || "Terjadi kesalahan. Coba lagi."); return; }
      store.set(TIKET, r.data.nomor_tiket);
      sessionStorage.removeItem(KEY);
      location.href = "success.html";
    });
  }

  async function sukses() {
    const tiket = new URLSearchParams(location.search).get("tiket") || store.get(TIKET);
    if (!tiket) { location.replace("lapor.html"); return; }
    const status = $("#otp-status");
    const r = await api("/laporan/" + encodeURIComponent(tiket) + "/");
    if (!r.ok) { status.textContent = r.status === 404 ? "Laporan tidak ditemukan." : PESAN_GAGAL; return; }
    const t = r.data;
    $("#t-id").textContent = "#" + t.nomor_tiket; $("#t-akun").textContent = t.akun_target;
    status.textContent = "Verifikasi OTP valid. Laporan " + t.nomor_tiket + " telah tayang di database.";
    $("#t-kat").textContent = t.kategori;
    const p = Object.fromEntries(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).formatToParts(new Date(t.diterbitkan)).map((x) => [x.type, x.value]));
    $("#t-waktu").textContent = p.day + " " + p.month + " " + p.year + ", " + p.hour + ":" + p.minute + " WIB";
    $("#t-pelapor").textContent = t.pelapor + " (Identitas Disamarkan)";
  }

  ({ lapor, otp, sukses }[document.body.dataset.page] || (() => {}))();
})();


/* =====================================================================
   2. TrustX Seller: ikon, data demo, beranda, dan detail profil penjual.
   Data di bawah hanya contoh demonstrasi; ganti dengan data dari backend.
   ===================================================================== */
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
  const AKUN_SAYA = "@seller_gadget_murah";
  const DETAIL = "detail-profile-seller.html";
  const PENINJAUAN = "hasil_peninjauan.html";

  const FEED = [
    { user: "@wts_photoc***", type: "red", label: "Laporan Tipu", icon: "alert",
      text: "No. WA: 0813-9821-xxxx • DP tiket konser ditransfer tapi tiket fisik tidak dikirim & kontak langsung diblokir.",
      time: "12 menit lalu", meta: "4 korban melapor", metaIcon: "userx", metaClass: "red" },
    { user: "@trustedseller_id", type: "green", label: "Terverifikasi Aman", icon: "check",
      text: "Pembelian album sealed tiba aman packing tebal bubble wrap kardus double wall. Fast respon rekber TrustX disetujui.",
      time: "1 jam lalu", meta: "38 testimoni positif", metaIcon: "thumb" }
  ];

  const ACCOUNTS = {
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
    feed.innerHTML = FEED.map((f) => `
      <li class="fi"><header>
        <a class="who" href="${DETAIL}?q=${encodeURIComponent(f.user)}"><i class="av">@</i>${esc(f.user)}</a>
        <span class="badge b-${f.type}">${svg(f.icon)}${esc(f.label)}</span></header>
        <blockquote>${esc(f.text)}</blockquote>
        <footer><span>${svg("clock")}${esc(f.time)}</span>
        <span${f.metaClass === "red" ? ' style="color:var(--red);font-weight:700"' : ' style="color:var(--navy);font-weight:700"'}>${svg(f.metaIcon)}${esc(f.meta)}</span></footer></li>`).join("");
    injectIcons(feed);

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
  function initDetail() {
    const params = new URLSearchParams(location.search);
    const query = (params.get("q") || AKUN_SAYA).trim();
    const acc = findAccount(query);
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
      <ul class="rep" id="rep"></ul></section>`;

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

    actbar.innerHTML = own
      ? `<a class="btn dark" href="${toReview}">${svg("shieldcheck")}Sanggah Laporan</a><a class="btn out" href="lapor.html">${svg("flag")}Lapor Transaksi</a>`
      : `<a class="btn pri" href="index-seller.html">Cari Akun Lain</a><a class="btn out" href="lapor.html">${svg("flag")}Lapor Transaksi</a>`;
    injectIcons();
  }

  const start = () => {
    injectIcons();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page === "detail-seller") initDetail();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();


/* =====================================================================
   3. Halaman Laporan seller: filter laporan
   ===================================================================== */
(() => {
  const filters = document.querySelectorAll(".sr-filter");
  if (!filters.length) return;
  // Filter dipertahankan di sanggahan.js (initFilters) agar kartu dinamis ikut tersaring.
  // Blok ini sengaja dinonaktifkan untuk menghindari listener ganda pada .sr-filter.
  return;
})();



/* =====================================================================
   4. Form sanggahan penjual (hasil_peninjauan.html)
   ===================================================================== */
(() => {
  const init = () => {
    const form = document.getElementById("appealForm");
    if (!form) return;

    const reportId = document.getElementById("reportId");
    const story = document.getElementById("appealStory");
    const reason = document.getElementById("appealReason");
    const files = document.getElementById("appealFiles");
    const consent = document.getElementById("appealConsent");
    const message = document.getElementById("appealMessage");
    const storyCount = document.getElementById("storyCount");
    const fileList = document.getElementById("fileList");
    const history = document.getElementById("appealHistory");

    // Tautan dari halaman detail memakai ?id=, jadi terima ?id= maupun ?laporan=.
    const params = new URLSearchParams(window.location.search);
    const requestedId = (params.get("id") || params.get("laporan") || "LP-8821").trim();

    // Mencegah ID laporan yang tidak sesuai format.
    reportId.value = /^LP-\d{4,}$/i.test(requestedId) ? requestedId.toUpperCase() : "LP-8821";

    function showMessage(text, success = false) {
      message.textContent = text;
      message.className = "appeal-message is-visible";
      if (success) message.classList.add("is-success");
    }

    function getHistory() {
      try {
        return JSON.parse(localStorage.getItem("trustxSanggahan") || "[]");
      } catch {
        return [];
      }
    }

    function renderHistory() {
      const records = getHistory().filter((item) => item.reportId === reportId.value);

      if (records.length === 0) {
        history.innerHTML = `
          <p class="appeal-history-empty">
            Belum ada pengajuan sanggahan untuk laporan ini.
          </p>`;
        return;
      }

      history.replaceChildren();

      records.slice().reverse().forEach((item) => {
        const article = document.createElement("article");
        article.className = "appeal-history-item";

        const top = document.createElement("div");
        top.className = "appeal-history-top";

        const title = document.createElement("strong");
        title.textContent = `${item.reportId} · ${item.date}`;

        const status = document.createElement("span");
        status.className = "appeal-status";
        status.textContent = item.status;

        const description = document.createElement("p");
        description.textContent =
          `Alasan: ${item.reasonLabel}. ` +
          `Bukti: ${item.fileNames.join(", ")}`;

        const note = document.createElement("p");
        note.textContent = "Pengajuan tersimpan secara lokal dan belum diterima server.";

        top.append(title, status);
        article.append(top, description, note);
        history.append(article);
      });
    }

    story.addEventListener("input", () => {
      storyCount.textContent = story.value.length;
    });

    files.addEventListener("change", () => {
      fileList.replaceChildren();
      Array.from(files.files).forEach((file) => {
        const li = document.createElement("li");
        li.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileList.append(li);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message.className = "appeal-message";
      message.textContent = "";

      const selectedFiles = Array.from(files.files);
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      if (story.value.trim().length < 20) {
        showMessage("Kronologi harus berisi minimal 20 karakter.");
        story.focus();
        return;
      }

      if (selectedFiles.length < 1 || selectedFiles.length > 3) {
        showMessage("Pilih minimal 1 dan maksimal 3 berkas bukti.");
        files.focus();
        return;
      }

      const invalidFile = selectedFiles.some((file) =>
        !allowedTypes.includes(file.type) || file.size > maxSize
      );

      if (invalidFile) {
        showMessage("Berkas harus JPG, PNG, atau PDF dengan ukuran maksimal 5 MB per berkas.");
        files.focus();
        return;
      }

      if (!consent.checked) {
        showMessage("Centang pernyataan kebenaran informasi terlebih dahulu.");
        consent.focus();
        return;
      }

      const record = {
        reportId: reportId.value,
        reasonLabel: reason.options[reason.selectedIndex].text,
        story: story.value.trim(),
        fileNames: selectedFiles.map((file) => file.name),
        date: new Date().toLocaleDateString("id-ID"),
        status: "Menunggu pengiriman ke server"
      };

      try {
        const records = getHistory();
        records.push(record);
        localStorage.setItem("trustxSanggahan", JSON.stringify(records));
      } catch {
        showMessage("Riwayat tidak dapat disimpan di browser ini. Coba kosongkan penyimpanan browser.");
        return;
      }

      renderHistory();
      showMessage(
        "Validasi berhasil. Data pengajuan tersimpan di browser, tetapi belum dikirim ke server TrustX.",
        true
      );

      form.reset();
      reportId.value = record.reportId;
      storyCount.textContent = "0";
      fileList.replaceChildren();
    });

    renderHistory();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* =====================================================================
   5. Halaman Laporan Komunitas (buyer / laporanpage.html)
   Menampilkan laporan terbit dari database, lengkap dengan statistik dan filter.
   - Langsung berhenti di halaman yang tidak punya .laporan-list.
   - Data dari: GET http://127.0.0.1:8000/api/laporan-akun/
     (?akun=@nama_akun di URL halaman menyaring ke satu akun).
   ===================================================================== */
(() => {
  const list = document.querySelector(".laporan-list");
  if (!list) return;

  // Tanpa "/" di akhir, supaya `${API_BASE}/laporan-akun/` tidak menjadi "api//laporan-akun/".
  const API_BASE = "http://127.0.0.1:8000/api";
  const emptyEl = document.querySelector(".laporan-empty");
  const filterBtns = document.querySelectorAll(".laporan-filter");

  const TX = { scam: "Tertipu/Scam", aman: "Aman/Rekomendasi" };
  const BADGE = { scam: "badge-response", aman: "badge-done" };
  const FILTER_EMPTY = "Tidak ada laporan untuk kategori ini.";

  let activeFilter = "semua";
  let emptyText = "Memuat laporan...";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const tgl = (iso) => iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  // Terima dua bentuk data: hasil endpoint ringkas ({laporan:[...]})
  // atau serializer biasa (nama field sama dengan model Laporan).
  function normalize(r) {
    return {
      id: r.nomor_tiket || (typeof r.id === "string" ? r.id : ""),
      akun: r.akun || r.akun_target || "",
      tx: r.statusTransaksi || r.status_transaksi,
      kronologi: r.kronologi || "",
      bukti: r.jumlahBukti ?? (Array.isArray(r.bukti) ? r.bukti.length : 0),
      dibuat: r.dibuat,
      diterbitkan: r.diterbitkan,
      statusLaporan: r.status_laporan || "terbit",
    };
  }

  function buildCard(r) {
    const card = document.createElement("article");
    card.className = "laporan-item";
    card.dataset.status = r.tx;
    card.innerHTML = `
      <div class="laporan-item-top">
        <span class="laporan-badge ${BADGE[r.tx]}">${esc(TX[r.tx])}</span>
        <span class="laporan-id">${esc(r.id)}</span>
      </div>
      <h3>${esc(r.akun)}</h3>
      <p class="laporan-category">Diterbitkan ${esc(tgl(r.diterbitkan || r.dibuat))}</p>
      <p>${esc(r.kronologi)}</p>
      <div class="laporan-item-footer">
        <span>${esc(r.bukti)} bukti terlampir</span>
        <a class="laporan-button laporan-button-secondary"
           href="lapor.html?akun=${encodeURIComponent(r.akun)}">Lapor akun ini</a>
      </div>`;
    return card;
  }

  // Hitung ulang statistik, terapkan filter, dan atur pesan kosong.
  function sync() {
    const cards = [...list.querySelectorAll(".laporan-item")];

    const count = { total: cards.length, scam: 0, aman: 0 };
    cards.forEach((c) => { if (c.dataset.status === "scam" || c.dataset.status === "aman") count[c.dataset.status]++; });
    Object.entries(count).forEach(([key, val]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = val;
    });

    let visible = 0;
    cards.forEach((c) => {
      const show = activeFilter === "semua" || c.dataset.status === activeFilter;
      c.hidden = !show;
      if (show) visible++;
    });

    if (emptyEl) {
      emptyEl.textContent = cards.length ? FILTER_EMPTY : emptyText;
      emptyEl.hidden = visible > 0;
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      sync();
    });
  });

  async function loadLaporan() {
    const akun = (new URLSearchParams(location.search).get("akun") || "").trim();
    const url = `${API_BASE}/laporan-akun/` + (akun ? `?akun=${encodeURIComponent(akun)}` : "");

    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Status " + res.status);

      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.laporan || data.results || []);
      const target = akun.toLowerCase();

      const items = rows
        .map(normalize)
        .filter((r) => r.id && TX[r.tx]
          && r.statusLaporan === "terbit"
          && (!target || r.akun.toLowerCase() === target))
        .sort((a, b) => new Date(b.diterbitkan || b.dibuat) - new Date(a.diterbitkan || a.dibuat));

      emptyText = "Belum ada laporan yang diterbitkan.";
      list.replaceChildren(...items.map(buildCard));
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
      emptyText = "Laporan belum dapat dimuat. Periksa koneksi ke server.";
    }
    sync();
  }

  sync(); // tampilkan "Memuat laporan..." selagi menunggu server
  loadLaporan();
})();

