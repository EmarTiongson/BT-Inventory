// ============================================================================
// ADMIN.JS - User Management Script
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Only run if we're on the admin/users page
  const userTableBody = document.getElementById('userTableBody');
  if (!userTableBody) return; // Exit if not on admin page

  const deleteButtons = document.querySelectorAll('.delete-btn');
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const deleteMessage = document.getElementById('deleteMessage');
  const searchInput = document.getElementById('searchInput');
  
  let currentUserId = null;
  let currentButton = null;

  // ===========================
  // SEARCH FUNCTIONALITY
  // ===========================
  
  function searchUser() {
    const filter = searchInput.value.toLowerCase().trim();
    const tbody = document.getElementById('userTableBody');
    const rows = tbody.getElementsByTagName('tr');
    let visibleCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip the "no data" row and "no results" row
      if (row.querySelector('.no-data') || row.classList.contains('no-results-row')) {
        continue;
      }

      const cells = row.getElementsByTagName('td');
      let found = false;

      // Search in: Full Name (1), Position (2), Email (3), Username (4), Contact (5), Role (6)
      const searchableIndices = [1, 2, 3, 4, 5, 6];
      
      for (let index of searchableIndices) {
        if (cells[index]) {
          const cellText = cells[index].textContent.toLowerCase().trim();
          if (cellText.includes(filter)) {
            found = true;
            break;
          }
        }
      }

      if (found || filter === '') {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    }

    // Show "no results" message if no rows are visible
    const noResultsRow = tbody.querySelector('.no-results-row');
    if (visibleCount === 0 && filter !== '') {
      if (!noResultsRow) {
        const newRow = document.createElement('tr');
        newRow.className = 'no-results-row';
        newRow.innerHTML = '<td colspan="8" class="no-data">No matching users found.</td>';
        tbody.appendChild(newRow);
      }
    } else if (noResultsRow) {
      noResultsRow.remove();
    }
  }

  // Attach search event listeners
  if (searchInput) {
    searchInput.addEventListener('keyup', searchUser);
    searchInput.addEventListener('input', searchUser);
    searchInput.addEventListener('search', searchUser);
  }

  // ===========================
  // DELETE MODAL FUNCTIONALITY
  // ===========================

  // Open modal when delete button is clicked
  deleteButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      currentUserId = this.dataset.userId;
      currentButton = this;
      
      // Get user name from the table row
      const userName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
      
      // Update modal message
      deleteMessage.textContent = `Are you sure you want to delete ${userName}?`;
      
      // Show modal
      deleteModal.style.display = 'flex';
    });
  });

  // Close modal when cancel is clicked
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', function () {
      deleteModal.style.display = 'none';
      currentUserId = null;
      currentButton = null;
    });
  }

  // Close modal when clicking outside
  if (deleteModal) {
    deleteModal.addEventListener('click', function (e) {
      if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
        currentUserId = null;
        currentButton = null;
      }
    });
  }

  // Handle delete confirmation
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function () {
      if (!currentUserId) return;

      // Disable confirm button and show loading state
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      fetch(`/accounts/delete-user/${currentUserId}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || 'Failed to delete user');
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Remove the row from table
            const row = document.querySelector(`#user-row-${currentUserId}`);
            if (row) {
              row.style.opacity = '0';
              setTimeout(() => row.remove(), 300);
            }
            
            // Close modal
            deleteModal.style.display = 'none';
            
            // Show success message
            showNotification('User deleted successfully', 'success');
          } else {
            throw new Error(data.error || 'Failed to delete user');
          }
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          showNotification('Error: ' + error.message, 'error');
          deleteModal.style.display = 'none';
        })
        .finally(() => {
          // Reset button state
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = 'Yes, delete';
          currentUserId = null;
          currentButton = null;
        });
    });
  }

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  // Helper function to get CSRF token
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Helper function to show notifications
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
});

// ============================================================================
// INVENTORY.JS - Inventory Management Script
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Only run if we're on the inventory page
  const inventoryTableBody = document.getElementById("inventoryTableBody");
  if (!inventoryTableBody) return; // Exit if not on inventory page

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

  /* =====================================================
   * DELETE ITEM MODAL
   * ===================================================== */
  const deleteModal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");
  let itemIdToDelete = null;

  if (deleteModal && deleteForm) {
    // Get URL template from the form's data attribute
    const deleteUrlTemplate = deleteForm.dataset.urlTemplate;

    // Attach click event to all delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        itemIdToDelete = btn.dataset.itemId;
        
        // Set the form action with the correct item ID
        if (deleteUrlTemplate && deleteForm) {
          deleteForm.action = deleteUrlTemplate.replace("0", itemIdToDelete);
        }
        
        // Show the modal
        deleteModal.classList.remove("hidden");
      });
    });

    // Cancel button handler
    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        closeDeleteModal();
      });
    });

    // Close modal when clicking outside
    window.addEventListener("click", e => {
      if (e.target === deleteModal) closeDeleteModal();
    });

    // Close modal function
    window.closeDeleteModal = function() {
      itemIdToDelete = null;
      deleteModal.classList.add("hidden");
      if (deleteForm) deleteForm.reset();
    };
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
        row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
      });
    });
  }
});