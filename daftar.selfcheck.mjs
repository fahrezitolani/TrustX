/* Cek cepat handler daftar.html tanpa browser: DOM tiruan + server Django.
   Jalankan: node daftar.selfcheck.mjs   (backend harus hidup di :8000) */
import fs from "node:fs";

const html = fs.readFileSync(new URL("./daftar.html", import.meta.url), "utf8");
const kode = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");

const el = (nilai = "") => ({ value: nilai, checked: false, hidden: false, textContent: "",
  attrs: {}, getAttribute(k) { return this.attrs[k] ?? null; },
  setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { this["on" + t] = f; },
  querySelector() { return null; }, querySelectorAll() { return []; } });

const f = { nama: el("Uji Handler"), wa: el("081200000077"), email: el(`h${Date.now()}@mail.com`),
  pass: el("RahasiaKuat123"), konf: el("RahasiaKuat123"), toko: el("Toko Handler") };
const tombol = [el(), el()];
const kotak = { registerName: f.nama, registerWa: f.wa, registerEmail: f.email,
  registerPassword: f.pass, confirmPassword: f.konf, tokoNama: f.toko, terms: el(),
  registerMessage: el(), registerForm: el(), tokoField: el() };
kotak.registerForm.onsubmit = null;

let dikirim = null, pindah = "";
globalThis.window = { TrustXAkun: {
  daftar(d) { dikirim = d; return fetch("http://127.0.0.1:8000/api/akun/daftar/",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
    .then((r) => r.json().then((j) => ({ ok: r.ok, status: r.status, data: j }))); },
  pesan: (d) => JSON.stringify(d), emailMenunggu: { set() {} }, beranda: () => "index.html" } };
globalThis.document = {
  body: { dataset: { page: "register" } },
  getElementById: (id) => kotak[id] ?? el(),
  querySelectorAll: (s) => (s === ".role-btn" ? tombol : []),
  addEventListener(t, f) { if (t === "DOMContentLoaded") f(); }
};
globalThis.location = { href: "" };
Object.defineProperty(globalThis, "location", { value: { href: "" }, writable: true });

new Function(kode)();

// submit tanpa centang syarat -> ditolak, tidak ada request
await kotak.registerForm.onsubmit({ preventDefault() {} });
if (dikirim) throw new Error("GAGAL: submit lolos padahal syarat belum dicentang");

// centang syarat + pilih peran PENJUAL, lalu submit
kotak.terms.checked = true;
tombol[1].onclick();
await kotak.registerForm.onsubmit({ preventDefault() {} });

if (!dikirim) throw new Error("GAGAL: handler submit tidak memanggil A.daftar()");
if (dikirim.role !== "seller") throw new Error("GAGAL: peran tidak terkirim sebagai seller");
if (dikirim.toko_nama !== "Toko Handler") throw new Error("GAGAL: toko_nama kosong");
if (!globalThis.location.href.endsWith("verifikasi-otp.html")) throw new Error("GAGAL: tidak pindah ke OTP");
console.log("LULUS: submit mengirim", JSON.stringify(dikirim), "->", globalThis.location.href);