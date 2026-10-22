"use strict";
/* Interaksi fitur Pelaporan Transaksi (lapor.html, confirm-otp.html, success.html).
   Terhubung ke backend Django (folder backend/). Jalankan dulu: python manage.py runserver */
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
