document.addEventListener("DOMContentLoaded", () => {
  // Only run if we're on the inventory page
  const inventoryTableBody = document.getElementById("inventoryTableBody");
  if (!inventoryTableBody) return;

  console.log("✅ Inventory.js loaded");

  /* =====================================================
   * IMAGE POPUP / LIGHTBOX
   * ===================================================== */
  const overlay = document.getElementById("imageLightboxOverlay");
  const img = document.getElementById("imageLightboxImg");
  const closeBtn = document.getElementById("imageLightboxClose");

  if (overlay && img && closeBtn) {
    function openImage(src) {
      img.src = src;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeImage() {
      overlay.classList.remove("active");
      img.src = "";
      document.body.style.overflow = "";
    }

    document.body.addEventListener("click", e => {
      const thumb = e.target.closest("img.thumbnail");
      if (thumb) openImage(thumb.dataset.src || thumb.src);
    });

    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target === closeBtn) closeImage();
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && overlay.classList.contains("active")) closeImage();
    });
  }

  // ==============================
// DELETE ITEM LOGIC (password confirm)
// ==============================

const deleteModal = document.getElementById('deleteModal');
const deleteForm = document.getElementById('deleteForm');
let itemIdToDelete = null;

// When a delete button is clicked, open modal
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    itemIdToDelete = btn.dataset.itemId;
    const deleteUrlTemplate = deleteForm.dataset.urlTemplate;
    const deleteUrl = deleteUrlTemplate.replace('0', itemIdToDelete);
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

// Helper function to close modal
function closeDeleteModal() {
  itemIdToDelete = null;
  deleteModal.classList.add('hidden');
  deleteForm.reset(); // clear password field
}
  /* =====================================================
   * SERIAL DROPDOWN + FILTER
   * ===================================================== */
  const allDropdowns = document.querySelectorAll(".serials-list-container");

  if (allDropdowns.length > 0) {
    window.toggleSerials = id => {
      const dropdown = document.getElementById(`serials-${id}`);
      if (dropdown) {
        allDropdowns.forEach(el => el.classList.remove("show"));
        dropdown.classList.toggle("show");
      }
    };

    window.filterSerials = id => {
      const input = document.querySelector(`#serials-${id} .serial-search`);
      if (input) {
        const filter = input.value.toLowerCase();
        const items = document.querySelectorAll(`#serials-${id} .serials-list li`);
        items.forEach(li => {
          li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
      }
    };

    document.addEventListener("click", e => {
      const inside = e.target.closest(".serials-wrapper");
      if (!inside) allDropdowns.forEach(el => el.classList.remove("show"));
    });
  }

  /* =====================================================
   * TABLE SEARCH BAR
   * ===================================================== */
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#inventoryTableBody tr");

  if (searchInput && tableRows.length > 0) {
    searchInput.addEventListener("keyup", () => {
      const filter = searchInput.value.toLowerCase();
      tableRows.forEach(row => {
        if (row.querySelector('.no-data')) return;
        row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
      });
    });
  }
});