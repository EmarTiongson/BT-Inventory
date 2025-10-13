document.addEventListener('DOMContentLoaded', function () {
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

    console.log('Searching for:', filter); // Debug

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
            console.log('Match found in row', i, 'column', index, ':', cellText); // Debug
            break;
          }
        }
      }

      if (found || filter === '') {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
        console.log('Hiding row', i); // Debug
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
  cancelDeleteBtn.addEventListener('click', function () {
    deleteModal.style.display = 'none';
    currentUserId = null;
    currentButton = null;
  });

  // Close modal when clicking outside
  deleteModal.addEventListener('click', function (e) {
    if (e.target === deleteModal) {
      deleteModal.style.display = 'none';
      currentUserId = null;
      currentButton = null;
    }
  });

  // Handle delete confirmation
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