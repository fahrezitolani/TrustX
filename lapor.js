"use strict";
/* Interaksi fitur Pelaporan Transaksi (lapor.html, confirm-otp.html, success.html).
   Belum terhubung ke backend: data akun masih dummy dan laporan disimpan di browser.
   Saat API Flask siap, ganti bagian bertanda TODO. */
(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = "trustx_draft", LIST = "trustx_laporan", TIKET = "trustx_tiket";
  const PELAPOR = "0812-xxxx-7890";
  const DEMO_OTP = "692841"; // TODO: ganti dengan POST /api/otp/verify
  // TODO: ganti dengan GET /api/akun?q=...
  const AKUN = {
    "@buyer_ticket_f1": { wa: "0812-4681-7890", bank: "BCA", rek: "5411-xxxx a/n G*** R***", scam: false },
    "@seller_gadget_murah": { wa: "0812-3456-7***", bank: "BCA", rek: "7203-xxxx a/n A*** S***", scam: true, jumlah: 5 }
  };
  const BELUM = { wa: "Belum terdata", bank: "Rekening", rek: "Belum terdata", scam: false };
  const cariAkun = (u) => AKUN[u.trim().toLowerCase()] || BELUM;
  const store = {
    get(k, s = sessionStorage) { try { return JSON.parse(s.getItem(k)); } catch { return null; } },
    set(k, v, s = sessionStorage) { try { s.setItem(k, JSON.stringify(v)); } catch { /* storage penuh/diblokir */ } }
  };
  const words = (t) => t.trim().match(/\S+/g) || [];
  const setErr = (id, msg) => { const e = $("#err-" + id); if (e) e.textContent = msg || ""; };

  function lapor() {
    const f = $("#form-laporan"), user = $("#lawan"), kr = $("#kronologi");
    const inp = $("#bukti"), drop = $("#drop"), list = $("#berkas");
    const files = [];
    const prm = new URLSearchParams(location.search).get("akun");
    if (prm) user.value = prm;

    function renderAkun() {
      const d = cariAkun(user.value);
      $("#a-nama").textContent = user.value.trim() || "—";
      $("#a-wa").textContent = d.wa; $("#a-bank").textContent = d.bank; $("#a-rek").textContent = d.rek;
      const badge = d.scam ? "scam-user.svg" : "verified-user.svg";
      $("#badge").src = "assets/images/" + badge;
      $("#cek").src = "assets/images/" + (d.scam ? badge : "check-account.svg");
      $("#note-aman").hidden = d.scam; $("#note-scam").hidden = !d.scam;
      if (d.scam) $("#n-jml").textContent = d.jumlah;
    }
    user.addEventListener("input", renderAkun);
    user.addEventListener("blur", () => { if (user.value.trim()) user.readOnly = true; });
    user.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); user.blur(); } });
    $("#edit-lawan").addEventListener("click", () => { user.readOnly = false; user.focus(); user.select(); });
    renderAkun();

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

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const cek = $("#pernyataan");
      const er = [
        ["lawan", user, user.value.trim().length < 3 ? "Isi username lawan transaksi." : ""],
        ["kronologi", kr, kr.value.trim().length < 20 ? "Tulis kronologi minimal 20 karakter." : ""],
        ["bukti", inp, files.length ? "" : "Unggah minimal 1 bukti transaksi."],
        ["pernyataan", cek, cek.checked ? "" : "Centang pernyataan untuk melanjutkan."]
      ];
      er.forEach(([id, , m]) => setErr(id, m));
      const gagal = er.find((x) => x[2]);
      if (gagal) { if (gagal[0] === "lawan") user.readOnly = false; gagal[1].focus(); gagal[1].scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      const d = cariAkun(user.value);
      store.set(KEY, {
        akun: user.value.trim(), wa: d.wa, bank: d.bank, rek: d.rek, status: f.elements.status.value,
        kronologi: kr.value.trim(), bukti: files.map((x) => ({ nama: x.file.name, ukuran: x.file.size })), pelapor: PELAPOR
      });
      location.href = "confirm-otp.html";
    });
  }

  function otp() {
    const d = store.get(KEY);
    if (!d) { location.replace("lapor.html"); return; }
    $("#whatsapp-number").textContent = d.pelapor;
    const boxes = [...document.querySelectorAll(".otp-input-row input")], err = $("#otp-error"), re = $("#resend-otp");
    boxes.forEach((b, i) => {
      b.addEventListener("input", () => { b.value = b.value.replace(/\D/g, "").slice(-1); err.textContent = ""; if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener("paste", (e) => {
        const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        if (!t) return;
        e.preventDefault(); [...t].forEach((c, k) => { boxes[k].value = c; }); boxes[Math.min(t.length, 5)].focus();
      });
    });
    let s = 45, salah = 0;
    (function tick() {
      re.disabled = false;
      if (s > 0) { s--; setTimeout(tick, 1000); }
    })();
    re.addEventListener("click", () => {
      salah = 0; err.textContent = "";
      s = 45;
      re.disabled = true; re.textContent = "Kirim Ulang (00:45)";
      const t = setInterval(() => { s--; re.textContent = s > 0 ? "Kirim Ulang (00:" + String(s).padStart(2, "0") + ")" : "Kirim Ulang"; if (s <= 0) { re.disabled = false; clearInterval(t); } }, 1000);
    });
    $("#otp-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const k = boxes.map((b) => b.value).join("");
      if (k.length < 6) { err.textContent = "Masukkan 6 digit kode OTP."; return; }
      if (salah >= 5) { err.textContent = "Terlalu banyak percobaan. Minta kode baru."; return; }
      if (k !== DEMO_OTP) { salah++; err.textContent = "Kode OTP salah. Periksa kembali."; return; }
      const now = new Date();
      const tiket = Object.assign({}, d, { id: "LP-" + now.getFullYear() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(), waktu: now.toISOString(), statusLaporan: "Menunggu Tinjauan" });
      store.set(LIST, (store.get(LIST, localStorage) || []).concat(tiket), localStorage);
      store.set(TIKET, tiket); sessionStorage.removeItem(KEY);
      location.href = "success.html";
    });
  }

  function sukses() {
    const t = store.get(TIKET);
    if (!t) { location.replace("lapor.html"); return; }
    $("#t-id").textContent = "#" + t.id; $("#t-akun").textContent = t.akun;
    const otpStatus = document.getElementById("otp-status");
    if (otpStatus) otpStatus.textContent = "Verifikasi OTP valid. Laporan " + t.id + " telah tayang di database.";
    $("#t-kat").textContent = t.status === "scam" ? "Penipuan WTS / Scam Transfer" : "Transaksi Aman / Rekomendasi";
    const p = Object.fromEntries(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).formatToParts(new Date(t.waktu)).map((x) => [x.type, x.value]));
    $("#t-waktu").textContent = p.day + " " + p.month + " " + p.year + ", " + p.hour + ":" + p.minute + " WIB";
    $("#t-pelapor").textContent = t.pelapor + " (Identitas Disamarkan)";
  }

  ({ lapor, otp, sukses }[document.body.dataset.page] || (() => {}))();
})();
