function showImagePopup(src) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('popupImage');
  modal.style.display = "flex"; /* Changed from 'block' to 'flex' to enable centering */
  modalImg.src = src;
}

function closeImagePopup() {
  document.getElementById('imageModal').style.display = "none";
}

// Delete item logic
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
let itemIdToDelete = null;

document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    itemIdToDelete = btn.dataset.itemId;
    deleteModal.style.display = 'block';
  });
});

cancelDeleteBtn.addEventListener('click', () => {
  itemIdToDelete = null;
  deleteModal.style.display = 'none';
});

confirmDeleteBtn.addEventListener('click', () => {
  if (!itemIdToDelete) return;
  const deleteUrlTemplate = "{% url 'delete_item' 0 %}";
  const deleteUrl = deleteUrlTemplate.replace('0', itemIdToDelete);

  fetch(deleteUrl, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json'
    },
  })
    .then(res => {
      if (!res.ok) throw new Error('Network response not OK');
      return res.json();
    })
    .then(data => {
      if (data.success) {
        const row = document.getElementById(`item-row-${itemIdToDelete}`);
        if (row) {
          row.style.transition = 'opacity 0.5s';
          row.style.opacity = 0;
          setTimeout(() => row.remove(), 500);
        }
      }
      deleteModal.style.display = 'none';
      itemIdToDelete = null;
    })
    .catch(err => {
      console.error('Error deleting item:', err);
      deleteModal.style.display = 'none';
      itemIdToDelete = null;
    });
});

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(cookie => {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    });
  }
  return cookieValue;
}

window.addEventListener('click', e => {
  if (e.target === deleteModal) {
    deleteModal.style.display = 'none';
    itemIdToDelete = null;
  }
});

// --- Serial Dropdown Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const allDropdowns = document.querySelectorAll(".serials-list-container");

  window.toggleSerials = function (id) {
    const dropdown = document.getElementById(`serials-${id}`);
    if (dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
      return;
    }
    allDropdowns.forEach(el => el.classList.remove("show"));
    dropdown.classList.add("show");
  };

  window.filterSerials = function (id) {
    const input = document.querySelector(`#serials-${id} .serial-search`);
    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll(`#serials-${id} .serials-list li`);
    items.forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
  };

  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".serials-wrapper");
    if (!inside) {
      allDropdowns.forEach(el => el.classList.remove("show"));
    }
  });
});

// ======== MAIN TABLE SEARCH BAR ========
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const tableRows = document.querySelectorAll("#inventoryTableBody tr");

  searchInput.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();

    tableRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  });
});