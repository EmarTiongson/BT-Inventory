// ===============================
// Serial Numbers Dropdown Module
// Handles dropdown display of serial numbers
// ===============================

// Track currently open dropdown
let currentOpenSerialDropdown = null;

/**
 * Show serial numbers in a dropdown
 * @param {string} updateId - The update/transaction ID
 * @param {string} buttonSelector - CSS selector for the button (optional)
 */
async function showSerialsDropdown(updateId, buttonSelector = null) {
  try {
    // Fetch serial numbers from backend
    const response = await fetch(`/get_serials/${updateId}/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Find the button that triggered this
    const button = buttonSelector 
      ? document.querySelector(buttonSelector)
      : document.querySelector(`[data-update-id='${updateId}']`);
    
    if (!button) {
      console.error('Button not found for updateId:', updateId);
      return;
    }

    // Get or create wrapper
    let wrapper = button.closest('.serials-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.classList.add('serials-wrapper');
      button.parentNode.insertBefore(wrapper, button);
      wrapper.appendChild(button);
    }

    // Check if dropdown already exists
    let dropdown = wrapper.querySelector('.serials-list-container');
    
    // If dropdown exists, toggle it
    if (dropdown) {
      const isCurrentlyOpen = dropdown.classList.contains('show');
      
      // Close any other open dropdowns
      closeAllSerialDropdowns();
      
      if (!isCurrentlyOpen) {
        // NEW: Reposition the existing dropdown before showing it
        positionSerialDropdown(dropdown, button);
        dropdown.classList.add('show');
        currentOpenSerialDropdown = dropdown;
      }
      return;
    }

    // Close any other open dropdowns before creating new one
    closeAllSerialDropdowns();

    // Create new dropdown
    dropdown = createSerialDropdown(data.serial_numbers);
    wrapper.appendChild(dropdown);
    
    // NEW: Calculate and set the fixed position before showing
    positionSerialDropdown(dropdown, button);

    // Show dropdown with animation
    setTimeout(() => {
      dropdown.classList.add('show');
      currentOpenSerialDropdown = dropdown;
    }, 10);

  } catch (err) {
    console.error("Failed to load serial numbers:", err);
    alert("❌ Could not load serial numbers.");
  }
}

/**
 * Create dropdown element with search and list
 * @param {Array} serialNumbers - Array of serial number strings
 * @returns {HTMLElement} The dropdown container element
 */
function createSerialDropdown(serialNumbers) {
  const dropdown = document.createElement('div');
  dropdown.classList.add('serials-list-container');

  if (serialNumbers && serialNumbers.length > 0) {
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search serials...';
    searchInput.classList.add('serial-search');
    dropdown.appendChild(searchInput);

    // Create serial list
    const ul = document.createElement('ul');
    ul.classList.add('serial-list');
    
    serialNumbers.forEach(sn => {
      const li = document.createElement('li');
      li.textContent = sn;
      li.dataset.serial = sn; // Store for filtering
      ul.appendChild(li);
    });
    
    dropdown.appendChild(ul);

    // Add search filter functionality
    searchInput.addEventListener('input', (e) => {
      filterSerialList(ul, e.target.value);
    });

    // Prevent dropdown from closing when clicking inside it
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

  } else {
    // No serial numbers found
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('serials-list-empty');
    emptyMessage.textContent = 'No serial numbers found';
    dropdown.appendChild(emptyMessage);
  }

  return dropdown;
}

/**
 * Filter serial list based on search term
 * @param {HTMLElement} listElement - The UL element containing serial items
 * @param {string} searchTerm - The search term to filter by
 */
function filterSerialList(listElement, searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const items = listElement.querySelectorAll('li');
  
  let visibleCount = 0;
  
  items.forEach(li => {
    const serialText = li.dataset.serial.toLowerCase();
    const isVisible = serialText.includes(term);
    
    li.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount++;
  });

  // Show "no results" message if needed
  let noResultsMsg = listElement.parentNode.querySelector('.no-results-message');
  
  if (visibleCount === 0 && term !== '') {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.classList.add('no-results-message', 'serials-list-empty');
      noResultsMsg.textContent = 'No matching serials';
      listElement.parentNode.appendChild(noResultsMsg);
    }
    noResultsMsg.style.display = 'block';
  } else if (noResultsMsg) {
    noResultsMsg.style.display = 'none';
  }
}

/**
 * Close all open serial dropdowns
 */
function closeAllSerialDropdowns() {
  const allDropdowns = document.querySelectorAll('.serials-list-container.show');
  allDropdowns.forEach(dropdown => {
    dropdown.classList.remove('show');
  });
  currentOpenSerialDropdown = null;
}

/**
 * NEW FUNCTION: Calculates and sets the fixed position of the dropdown relative to the button.
 * @param {HTMLElement} dropdown - The serials dropdown element.
 * @param {HTMLElement} button - The button element that triggered the dropdown.
 */
function positionSerialDropdown(dropdown, button) {
  // Get the button's position and size relative to the viewport
  const rect = button.getBoundingClientRect();
  
  // Use the width defined in the CSS, or calculate if needed
  // For simplicity, we hardcode the 180px width from the CSS
  const dropdownWidth = 180; 

  // Calculate left position to center it below the button: 
  // Button Left + Half Button Width - Half Dropdown Width
  let leftPos = rect.left + (rect.width / 2) - (dropdownWidth / 2);

  // Simple boundary check: ensure it doesn't go off the left edge
  if (leftPos < 5) { // 5px padding from the edge
    leftPos = 5;
  }
  
  // Calculate top position (just below the button + 5px margin)
  const topPos = rect.bottom + 5; 

  // Apply the fixed position, ensuring it's not cut off by parent overflow
  dropdown.style.left = `${leftPos}px`;
  dropdown.style.top = `${topPos}px`;
}

/**
 * Initialize serial dropdown event listeners
 * Call this after the DOM is loaded or after dynamically adding buttons
 */
function initSerialDropdowns() {
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (currentOpenSerialDropdown && !e.target.closest('.serials-wrapper')) {
      closeAllSerialDropdowns();
    }
  });

  // Close dropdown on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentOpenSerialDropdown) {
      closeAllSerialDropdowns();
    }
  });
}

/**
 * Attach serial dropdown to buttons
 * @param {string} buttonSelector - CSS selector for buttons
 * @param {string} updateIdAttribute - Attribute name containing update ID (default: 'data-update-id')
 */
function attachSerialDropdowns(buttonSelector, updateIdAttribute = 'data-update-id') {
  const buttons = document.querySelectorAll(buttonSelector);
  
  buttons.forEach(button => {
    // Remove any existing listeners to prevent duplicates
    button.removeEventListener('click', handleSerialButtonClick);
    
    // Add click listener
    button.addEventListener('click', handleSerialButtonClick);
  });
}

/**
 * Handle click on serial button
 * @param {Event} e - Click event
 */
function handleSerialButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const updateId = this.getAttribute('data-update-id');
  if (updateId) {
    // Use this to get the button element itself for positioning
    showSerialsDropdown(updateId, `[data-update-id='${updateId}']`); 
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSerialDropdowns);
} else {
  initSerialDropdowns();
}

// Export functions for use in other modules
window.SerialDropdown = {
  show: showSerialsDropdown,
  close: closeAllSerialDropdowns,
  init: initSerialDropdowns,
  attach: attachSerialDropdowns
};