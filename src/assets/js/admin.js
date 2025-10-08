// admin.js - Combines sidebar controls and user management functions

// ===================================================
// 1. Sidebar Toggle (Based on your provided HTML structure)
// ===================================================

const sidebarEl = document.getElementById('sidebar');
const mainContentEl = document.getElementById('mainContent');
const sidebarToggleBtn = document.getElementById('sidebarToggle'); // Assuming you have a toggle button with this ID

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    // Toggles classes for desktop collapse view
    sidebarEl.classList.toggle('collapsed');
    mainContentEl.classList.toggle('expanded');
  });
}

// Mobile sidebar functions (optional, depending on your mobile button implementation)
window.openSidebarMobile = function() {
  if (sidebarEl) {
    sidebarEl.classList.add('open');
  }
}

window.closeSidebarMobile = function() {
  if (sidebarEl) {
    sidebarEl.classList.remove('open');
  }
}

// Expose the main toggle function globally if needed for inline use
window.toggleSidebar = function() {
  if (sidebarEl && mainContentEl) {
    sidebarEl.classList.toggle('collapsed');
    mainContentEl.classList.toggle('expanded');
  }
};


// ===================================================
// 2. User Management Search Functionality
// ===================================================

/**
 * Filters the user table based on the input from the search bar.
 * This function is called via 'onkeyup' in admin.html.
 */
window.searchUser = function() {
  const input = document.getElementById('searchInput');
  // Get search term and convert to upper case for case-insensitive matching
  const filter = input.value.toUpperCase(); 
  
  // Target the <tbody> element where user rows are located
  const tableBody = document.getElementById('userTableBody'); 
  const tr = tableBody.getElementsByTagName('tr');

  // Loop through all table rows
  for (let i = 0; i < tr.length; i++) {
    const row = tr[i];
    
    // Skip the 'No users found' row if it exists
    if (row.classList.contains('no-data')) {
        continue;
    }
    
    // We search the following columns:
    // Full Name (index 1), Email Address (index 3), Username (index 4)
    const fullNameCell = row.getElementsByTagName('td')[1];
    const emailCell = row.getElementsByTagName('td')[3];
    const usernameCell = row.getElementsByTagName('td')[4];
    
    let rowText = '';

    // Concatenate text content from searchable cells
    if (fullNameCell) {
        rowText += fullNameCell.textContent || fullNameCell.innerText;
    }
    if (emailCell) {
        rowText += emailCell.textContent || emailCell.innerText;
    }
    if (usernameCell) {
        rowText += usernameCell.textContent || usernameCell.innerText;
    }

    // Check if the concatenated row text includes the search filter
    if (rowText.toUpperCase().indexOf(filter) > -1) {
      row.style.display = ''; // Show row
    } else {
      row.style.display = 'none'; // Hide row
    }
  }
};