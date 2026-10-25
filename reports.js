"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const reportItems = document.querySelectorAll(".report-item");
    const emptyState = document.getElementById("emptyState");

    const modal = document.getElementById("reportModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalId = document.getElementById("modalId");
    const modalDescription = document.getElementById("modalDescription");

    const closeModalButton = document.getElementById("closeModal");
    const closeModalBottom = document.getElementById("closeModalBottom");

    const isSellerPage =
        document.body.dataset.page === "seller-reports";

    let previousFocus = null;

    // =====================================
    // 1. FILTER LAPORAN
    // =====================================

    function applyFilter(status) {
        let visibleCount = 0;

        reportItems.forEach((item) => {
            const itemStatus = item.dataset.status;
            const isVisible =
                status === "semua" || itemStatus === status;

            item.hidden = !isVisible;

            if (isVisible) {
                visibleCount++;
            }
        });

        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }

        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === status;

            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyFilter(button.dataset.filter || "semua");
        });
    });

    // =====================================
    // 2. BUKA DETAIL LAPORAN
    // =====================================

    function openDetail(item) {
        if (!modal) return;

        previousFocus = document.activeElement;

        if (modalTitle) {
            modalTitle.textContent =
                item.dataset.title || "Detail Laporan";
        }

        if (modalId) {
            modalId.textContent =
                "#" + (item.dataset.id || "");
        }

        if (modalDescription) {
            modalDescription.textContent =
                item.dataset.description ||
                "Detail laporan belum tersedia.";
        }

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        closeModalButton?.focus();
    }

    // =====================================
    // 3. TUTUP DETAIL LAPORAN
    // =====================================

    function closeDetail() {
        if (!modal || modal.hidden) return;

        modal.hidden = true;
        document.body.style.overflow = "";

        if (previousFocus && typeof previousFocus.focus === "function") {
            previousFocus.focus();
        }
    }

    reportItems.forEach((item) => {
        const detailButton = item.querySelector(".detail-btn");

        detailButton?.addEventListener("click", () => {
            openDetail(item);
        });
    });

    closeModalButton?.addEventListener("click", closeDetail);
    closeModalBottom?.addEventListener("click", closeDetail);

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeDetail();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDetail();
        }
    });

    // =====================================
    // 4. TOMBOL AJUKAN SANGGAHAN
    // KHUSUS HALAMAN SELLER
    // =====================================

    if (isSellerPage) {
        document.querySelectorAll(".btn-sanggah").forEach((button) => {
            button.addEventListener("click", () => {
                const reportId =
                    button.dataset.id ||
                    button.closest(".report-item")?.dataset.id;

                if (!reportId) {
                    alert("ID laporan tidak ditemukan.");
                    return;
                }

                window.location.href =
                    "form-klarifikasi.html?id=" +
                    encodeURIComponent(reportId);
            });
        });
    }

    // =====================================
    // 5. FILTER AWAL
    // =====================================

    applyFilter("semua");
});