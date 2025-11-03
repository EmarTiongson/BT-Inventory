/* ==========================================================
 * ASSETS & TOOLS PAGE SCRIPT
 * Based on inventory.js
 * ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const assetsToolsTableBody = document.getElementById("assetsToolsTableBody");
  if (!assetsToolsTableBody) return;

  console.log("✅ Assets & Tools JS loaded");

  // ===========================
  // SEARCH FUNCTIONALITY
  // ===========================
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const filter = searchInput.value.toLowerCase();
      const rows = document.querySelectorAll("#assetsToolsTableBody tr");

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      });
    });
  }

  // ===========================
  // IMAGE LIGHTBOX
  // ===========================
  const overlay = document.getElementById("imageLightboxOverlay");
  const img = document.getElementById("imageLightboxImg");
  const closeBtn = document.getElementById("imageLightboxClose");

  if (overlay && img && closeBtn) {
    window.showImagePopup = function(imageUrl) {
      img.src = imageUrl;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    function closeImagePopup() {
      overlay.classList.remove("active");
      img.src = "";
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", closeImagePopup);

    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target === closeBtn) closeImagePopup();
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && overlay.classList.contains("active")) closeImagePopup();
    });
  }

  // ==============================
  // DELETE ASSET/TOOL LOGIC (password confirm)
  // ==============================
  const deleteModal = document.getElementById('deleteModal');
  const deleteForm = document.getElementById('deleteForm');
  let assetIdToDelete = null;

  // When a delete button is clicked, open modal
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      assetIdToDelete = btn.dataset.assetId;
      const deleteUrlTemplate = deleteForm.dataset.urlTemplate;
      const deleteUrl = deleteUrlTemplate.replace('0', assetIdToDelete);
      deleteForm.action = deleteUrl; // set correct form action
      deleteModal.classList.remove('hidden'); // show modal
    });
  });

  // Close modal on Cancel button
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      closeDeleteModal();
    });
  });

  // Close modal when clicking outside of modal content
  window.addEventListener('click', e => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Helper function to close modal (make it global)
  window.closeDeleteModal = function() {
    assetIdToDelete = null;
    deleteModal.classList.add('hidden');
    deleteForm.reset(); // clear password field
  };
});