"use strict";
/* Data dummy + logika pencarian Buyer. Ganti isi cari() dengan fetch ke API Flask nanti:
   fetch(`/api/akun?m=${m}&q=${q}`) -> kembalikan objek dengan bentuk yang sama seperti AKUN[id]. */
const ROUTE = { home: "index.html", hasil: "hasil.html", detail: "detail-profile.html", lapor: "lapor.html", bantuan: "bantuan.html" };

// laporan: [id, hariLalu, kronologi, bukti, terverifikasi]
const AKUN = {
  seller_gadget_murah: { nama: "@seller_gadget_murah", platform: "X (Twitter)", wa: "0812-3456-7***", rating: 1.8, aman: 1, laporan: [
    ["LP-8821", 1, "Beli lightstick BTS seharga 650rb, setelah transfer langsung di-block WhatsApp dan akun Twitter ganti handle.", "Bukti_Transfer.jpg", true],
    ["LP-8790", 3, "Mengaku punya proof video card, ternyata video curian dari seller lain di Carousell.", "Chat_Log.jpg", false],
    ["LP-8744", 4, "Resi yang dikirim fiktif, barang tidak pernah sampai.", "Resi_Palsu.png", true],
    ["LP-8702", 6, "DP 50% sudah ditransfer, penjual menghilang.", "Bukti_DP.jpg", true],
    ["LP-8655", 12, "Diminta transfer ke rekening atas nama berbeda lalu diblokir.", "Chat_Log2.png", false]] },
  wts_photoc: { nama: "@wts_photoc***", platform: "X (Twitter)", wa: "0813-9821-****", aman: 0, laporan: [
    ["LP-8830", 0, "DP tiket konser ditransfer tapi tiket fisik tidak dikirim & kontak langsung diblokir.", "Bukti_Transfer.jpg", true],
    ["LP-8801", 2, "Tiket tidak dikirim setelah pelunasan.", "SS_Chat.png", false]] },
  trustedseller_id: { nama: "@trustedseller_id", platform: "X (Twitter)", wa: "", rating: 4.9, aman: 78, laporan: [],
    transaksi: ["Pembelian album sealed tiba aman, packing bubble wrap + kardus double wall.", "Respon cepat, barang sesuai deskripsi.", "COD di tempat ramai, tanpa kendala."] },
  toko_jersey_ori: { nama: "@toko_jersey_ori", platform: "X (Twitter)", wa: "", aman: 0, laporan: [] }
};
const WA_INDEX = { "081398217788": "wts_photoc", "081234567890": "seller_gadget_murah" };
const FEED = [
  { id: "wts_photoc", akun: "@wts_photoc***", tipe: "tipu", teks: "No. WA: 0813-9821-xxxx • DP tiket konser ditransfer tapi tiket fisik tidak dikirim & kontak langsung diblokir.", waktu: "12 menit lalu", info: "4 korban melapor" },
  { id: "trustedseller_id", akun: "@trustedseller_id", tipe: "aman", teks: "Pembelian album sealed tiba aman, packing tebal bubble wrap kardus double wall. Fast respon, rekber TrustX disetujui.", waktu: "1 jam lalu", info: "78 testimoni positif" }
];
const TIPS = ["Cek umur akun Twitter penjual (hindari akun dibuat < 3 bulan).", "Jangan tergiur harga jauh di bawah pasaran wajar.", "Tolak jika penjual buru-buru mendesak transfer langsung.", "Utamakan COD di tempat ramai jika berada di kota yang sama."];

function validasi(m, q) {
  q = q.trim();
  if (!q) return "Silakan masukkan data akun terlebih dahulu.";
  if (m === "wa" && !/^\+?[0-9][0-9\s-]{7,17}$/.test(q)) return "Format nomor WhatsApp belum valid. Contoh: 0812-3456-7890.";
  if (m === "x" && !/^@?[A-Za-z0-9_]{1,20}$/.test(q)) return "Username X hanya boleh huruf, angka, atau garis bawah (maks. 20 karakter).";
  return "";
}
function normalisasi(m, q) {
  q = q.trim();
  if (m === "x") return q.replace(/^@/, "").toLowerCase();
  let d = q.replace(/[\s-]/g, "").replace(/^\+/, "");
  return d.startsWith("62") ? "0" + d.slice(2) : d;
}
/* Mengembalikan null (tidak ditemukan) atau {id, ...akun, status}. */
function cari(m, q) {
  const k = normalisasi(m, q), id = m === "wa" ? WA_INDEX[k] : k, a = AKUN[id];
  return a ? { id, ...a, status: hitungStatus(a) } : null;
}
/* Aturan status (dapat dijelaskan):
   >=5 laporan, atau >=3 laporan terverifikasi -> Berisiko Tinggi | 1-4 laporan -> Perlu Diwaspadai
   0 laporan & ada transaksi aman -> Riwayat Transaksi Aman | selain itu -> Belum Ada Laporan */
function hitungStatus(a) {
  const n = a.laporan.length, v = a.laporan.filter(r => r[4]).length;
  if (n >= 5 || v >= 3) return { kode: "high", label: "Berisiko Tinggi", badge: "b-red" };
  if (n >= 1) return { kode: "warn", label: "Perlu Diwaspadai", badge: "b-amber" };
  if (a.aman > 0) return { kode: "safe", label: "Memiliki Riwayat Transaksi Aman", badge: "b-green" };
  return { kode: "none", label: "Belum Ada Laporan", badge: "b-gray" };
}
