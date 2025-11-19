/* ==========================================================
 * ASSETS & TOOLS PAGE SCRIPT (Optimized & Cleaned)
 * ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------------------
     IMAGE LIGHTBOX
  --------------------------------*/
  const overlay = document.getElementById("imageLightboxOverlay");
  const img = document.getElementById("imageLightboxImg");
  const closeBtn = document.getElementById("imageLightboxClose");

  if (overlay && img && closeBtn) {

    window.showImagePopup = (src) => {
      img.src = src;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeImage = () => {
      overlay.classList.remove("active");
      img.src = "";
      document.body.style.overflow = "";
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target === closeBtn) closeImage();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeImage();
    });
  }

  /* ------------------------------
     DELETE CONFIRMATION MODAL
  --------------------------------*/
  const deleteModal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");

  if (deleteModal && deleteForm) {
    let assetIdToDelete = null;

    window.closeDeleteModal = () => {
      assetIdToDelete = null;
      deleteModal.classList.add("hidden");
      deleteForm.reset();
    };

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        assetIdToDelete = btn.dataset.assetId;
        const url = deleteForm.dataset.urlTemplate.replace("0", assetIdToDelete);
        deleteForm.action = url;
        deleteModal.classList.remove("hidden");
      });
    });

    document.querySelectorAll(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.closeDeleteModal();
      });
    });

    window.addEventListener("click", (e) => {
      if (e.target === deleteModal) window.closeDeleteModal();
    });
  }

  /* ------------------------------
     SERVER-SIDE SEARCH
  --------------------------------*/
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    let searchTimeout;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "searchLoadingIndicator";
    loadingIndicator.innerHTML = '<i class="bi bi-hourglass-split"></i> Searching...';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(249, 115, 22, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      display: none;
    `;
    document.body.appendChild(loadingIndicator);

    function showLoading() {
      loadingIndicator.style.display = "block";
    }

    function performSearch() {
      const value = searchInput.value.trim();
      const url = new URL(window.location.href);

      if (value) {
        url.searchParams.set("search", value);
        url.searchParams.set("page", 1);
      } else {
        url.searchParams.delete("search");
      }

      showLoading();
      setTimeout(() => (window.location.href = url.toString()), 150);
    }

    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") return;

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch();
      }, 1200);
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(searchTimeout);
        performSearch();
      }
    });
  }
});


