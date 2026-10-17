
const laporanData = {
    "LP-8821": {
        account: "@seller_gadget_murah",
        date: "22 September 2026",
        status: "Sanggahan Diterima",
        statusClass: "accepted",
        title: "Sanggahan diterima",
        response:
            "Berdasarkan pemeriksaan bukti yang tersedia, sanggahan diterima untuk ditindaklanjuti. Informasi pada laporan perlu diperbarui sesuai hasil verifikasi.",
        reason:
            "Bukti pendukung telah diperiksa dan ditemukan informasi yang perlu diklarifikasi pada laporan awal.",
        action:
            "Periksa pembaruan laporan dan simpan bukti transaksi untuk kebutuhan klarifikasi berikutnya.",
        history: [
            ["Sanggahan diterima sistem", "22 September 2026"],
            ["Bukti diperiksa", "23 September 2026"],
            ["Hasil peninjauan diterbitkan", "24 September 2026"]
        ]
    },

    "LP-8822": {
        account: "@seller_toko_online",
        date: "25 September 2026",
        status: "Sanggahan Ditolak",
        statusClass: "rejected",
        title: "Sanggahan belum dapat diterima",
        response:
            "Berdasarkan informasi yang tersedia, sanggahan belum dapat diterima. Bukti yang diajukan belum cukup untuk mengubah hasil pemeriksaan laporan.",
        reason:
            "Informasi pendukung belum menunjukkan bukti yang memadai untuk menyelesaikan perbedaan keterangan transaksi.",
        action:
            "Lengkapi bukti transaksi dan kronologi yang relevan sebelum mengajukan klarifikasi lanjutan.",
        history: [
            ["Sanggahan diterima sistem", "25 September 2026"],
            ["Bukti dan kronologi diperiksa", "26 September 2026"],
            ["Keputusan peninjauan dicatat", "27 September 2026"]
        ]
    },

    "LP-8823": {
        account: "@seller_baru",
        date: "28 September 2026",
        status: "Sedang Ditinjau",
        statusClass: "reviewing",
        title: "Peninjauan masih berlangsung",
        response:
            "Tim peninjau sedang memeriksa kronologi dan bukti yang diajukan. Hasil akhir belum tersedia.",
        reason:
            "Pemeriksaan terhadap bukti dan informasi terkait masih berlangsung.",
        action:
            "Pantau halaman ini untuk melihat hasil peninjauan setelah keputusan diterbitkan.",
        history: [
            ["Sanggahan diterima sistem", "28 September 2026"],
            ["Pemeriksaan sedang berlangsung", "Dalam proses"],
        ]
    }
};

const pilihLaporan = document.getElementById("pilihLaporan");
const reviewStatus = document.getElementById("reviewStatus");
const reviewHistory = document.getElementById("reviewHistory");

function tampilkanLaporan(id) {
    const data = laporanData[id];

    if (!data) return;

    document.getElementById("reviewId").textContent = id;
    document.getElementById("reviewAccount").textContent = data.account;
    document.getElementById("reviewDate").textContent = data.date;

    reviewStatus.textContent = data.status;
    reviewStatus.className = "review-badge " + data.statusClass;

    document.getElementById("responseTitle").textContent = data.title;
    document.getElementById("responseText").textContent = data.response;
    document.getElementById("reviewReason").textContent = data.reason;
    document.getElementById("reviewAction").textContent = data.action;

    reviewHistory.replaceChildren();

    data.history.forEach(([judul, tanggal]) => {
        const item = document.createElement("li");
        const dot = document.createElement("span");
        const content = document.createElement("div");
        const title = document.createElement("strong");
        const date = document.createElement("p");

        dot.className = "timeline-dot";
        title.textContent = judul;
        date.textContent = tanggal;

        content.append(title, date);
        item.append(dot, content);
        reviewHistory.appendChild(item);
    });
}

pilihLaporan.addEventListener("change", function () {
    tampilkanLaporan(pilihLaporan.value);
});

tampilkanLaporan(pilihLaporan.value);

// ========================= pop up klarifikasi =========================

const popup = document.getElementById("popupKlarifikasi");
const tombolBuka = document.getElementById("bukaKlarifikasi");
const tombolTutup = document.getElementById("tutupKlarifikasi");
const formPopup = document.getElementById("formKlarifikasiPopup");
const kronologiPopup = document.getElementById("kronologiPopup");
const buktiPopup = document.getElementById("buktiPopup");
const pesanPopup = document.getElementById("pesanKlarifikasiPopup");

function bukaPopup() {
    popup.hidden = false;
    document.body.classList.add("popup-klarifikasi-open");
    kronologiPopup.focus();
}

function tutupPopup() {
    popup.hidden = true;
    document.body.classList.remove("popup-klarifikasi-open");
    tombolBuka.focus();
}

tombolBuka.addEventListener("click", bukaPopup);
tombolTutup.addEventListener("click", tutupPopup);

popup.addEventListener("click", function (event) {
    if (event.target === popup) {
        tutupPopup();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !popup.hidden) {
        tutupPopup();
    }
});


form.addEventListener("submit", (event) => {
    event.preventDefault();

    const files = Array.from(bukti.files);
    const formatValid = /\.(png|jpe?g)$/i;
    const ukuranMaksimal = 5 * 1024 * 1024;

    if (!kronologi.value.trim()) {
        pesan.textContent = "Kronologi kejadian wajib diisi.";
        kronologi.focus();
        return;
    }

    if (files.length < 1 || files.length > 3) {
        pesan.textContent =
            "Unggah minimal 1 dan maksimal 3 file bukti.";
        bukti.focus();
        return;
    }

    const fileTidakValid = files.some((file) => {
        return (
            !formatValid.test(file.name) ||
            file.size > ukuranMaksimal
        );
    });

    if (fileTidakValid) {
        pesan.textContent =
            "Pastikan semua bukti berformat PNG/JPG " +
            "dan maksimal 5 MB per file.";
        bukti.focus();
        return;
    }

    // Tampilkan konfirmasi pengajuan
    alert("Klarifikasi berhasil diajukan!");

    // Tutup popup
    popup.hidden = true;
    document.body.classList.remove("modal-open");

    // Reset formulir
    form.reset();

    // Kembalikan fokus ke tombol pembuka
    buka.focus();
});
