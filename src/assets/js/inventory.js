document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
   * IMAGE POPUP / LIGHTBOX
   * ===================================================== */
  const overlay = document.getElementById("imageLightboxOverlay");
  const img = document.getElementById("imageLightboxImg");
  const closeBtn = document.getElementById("imageLightboxClose");

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


  /* =====================================================
   * DELETE ITEM MODAL
   * ===================================================== */
  const deleteModal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");
  let itemIdToDelete = null;

  // Save URL template from Django
  const deleteUrlTemplate = deleteForm?.dataset.urlTemplate;

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      itemIdToDelete = btn.dataset.itemId;
      if (deleteUrlTemplate && deleteForm) {
        deleteForm.action = deleteUrlTemplate.replace("0", itemIdToDelete);
      }
      deleteModal.classList.remove("hidden");
    });
  });

  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      closeDeleteModal();
    });
  });

  window.addEventListener("click", e => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  function closeDeleteModal() {
    itemIdToDelete = null;
    deleteModal.classList.add("hidden");
    deleteForm.reset();
  }


  /* =====================================================
   * SERIAL DROPDOWN + FILTER
   * ===================================================== */
  const allDropdowns = document.querySelectorAll(".serials-list-container");

  window.toggleSerials = id => {
    const dropdown = document.getElementById(`serials-${id}`);
    allDropdowns.forEach(el => el.classList.remove("show"));
    dropdown.classList.toggle("show");
  };

  window.filterSerials = id => {
    const input = document.querySelector(`#serials-${id} .serial-search`);
    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll(`#serials-${id} .serials-list li`);
    items.forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
  };

  document.addEventListener("click", e => {
    const inside = e.target.closest(".serials-wrapper");
    if (!inside) allDropdowns.forEach(el => el.classList.remove("show"));
  });


  /* =====================================================
   * TABLE SEARCH BAR
   * ===================================================== */
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#inventoryTableBody tr");

  searchInput?.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();
    tableRows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
  });
});
