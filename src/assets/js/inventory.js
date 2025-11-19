document.addEventListener("DOMContentLoaded", () => {
  // Only run if we're on the inventory page
  const inventoryTableBody = document.getElementById("inventoryTableBody");
  if (!inventoryTableBody) return;

  /* =====================================================
   * IMAGE POPUP / LIGHTBOX
   * ===================================================== */
  const overlay = document.getElementById("imageLightboxOverlay");
  const img = document.getElementById("imageLightboxImg");
  const closeBtn = document.getElementById("imageLightboxClose");

  if (overlay && img && closeBtn) {
    window.showImagePopup = function(src) {
      img.src = src;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    function closeImage() {
      overlay.classList.remove("active");
      img.src = "";
      document.body.style.overflow = "";
    }

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

  window.closeDeleteModal = function() {
    itemIdToDelete = null;
    deleteModal.classList.add('hidden');
    deleteForm.reset();
  };

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      itemIdToDelete = btn.dataset.itemId;
      const deleteUrlTemplate = deleteForm.dataset.urlTemplate;
      const deleteUrl = deleteUrlTemplate.replace('0', itemIdToDelete);
      deleteForm.action = deleteUrl;
      deleteModal.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      window.closeDeleteModal();
    });
  });

  window.addEventListener('click', e => {
    if (e.target === deleteModal) window.closeDeleteModal();
  });

  /* =====================================================
   * SERIAL DROPDOWN + FILTER (Desktop)
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
   * MOBILE SERIAL FUNCTIONS
   * ===================================================== */
  window.toggleSerialsMobile = id => {
    const dropdown = document.getElementById(`serials-mobile-${id}`);
    if (dropdown) {
      const allMobileDropdowns = document.querySelectorAll('[id^="serials-mobile-"]');
      allMobileDropdowns.forEach(el => el.classList.remove("show"));
      dropdown.classList.toggle("show");
    }
  };

  window.filterSerialsMobile = id => {
    const input = document.querySelector(`#serials-mobile-${id} .serial-search`);
    if (input) {
      const filter = input.value.toLowerCase();
      const items = document.querySelectorAll(`#serials-mobile-${id} .serials-list li`);
      items.forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
      });
    }
  };

  /* =====================================================
   * SMOOTH SERVER-SIDE SEARCH WITH LOADING INDICATOR
   * ===================================================== */
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    let searchTimeout;
    let isSearching = false;

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'searchLoadingIndicator';
    loadingIndicator.innerHTML = '<i class="bi bi-hourglass-split"></i> Searching...';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(33, 150, 243, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: none;
      font-weight: 500;
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(loadingIndicator);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Function to show loading
    function showLoading() {
      loadingIndicator.style.display = 'block';
      isSearching = true;
    }

    // Function to perform search
    function performSearch() {
      const searchQuery = searchInput.value.trim();
      
      // Get current URL
      const url = new URL(window.location.href);
      
      if (searchQuery) {
        url.searchParams.set('search', searchQuery);
        url.searchParams.set('page', '1');
      } else {
        url.searchParams.delete('search');
      }
      
      // Show loading indicator
      showLoading();
      
      // Small delay for smooth transition
      setTimeout(() => {
        window.location.href = url.toString();
      }, 150);
    }

    // Search on keyup with delay (LONGER delay = less blinking)
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === 'Enter' || isSearching) return;
      
      clearTimeout(searchTimeout);
      
      // Wait 1200ms (1.2 seconds) after user stops typing
      // Increase this number if you want even less blinking
      searchTimeout = setTimeout(() => {
        performSearch();
      }, 1200);
    });

    // Instant search on Enter key
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        performSearch();
      }
    });

    // Removed search button - using icon only
  }
});