// ===========================
// UPDATE ITEM PAGE - JAVASCRIPT
// ===========================

// DOM Elements
const updateContainer = document.getElementById('updateContainer');
const serialModal = document.getElementById('serialModal');
const serialInputsContainer = document.getElementById('serialInputsContainer');
const serialSearchBox = document.getElementById('serialSearchBox');
const serialSearch = document.getElementById('serialSearch');
const inField = document.getElementById('inField');
const outField = document.getElementById('outField');
const poSupplier = document.getElementById('poSupplierField');
const poClient = document.getElementById('poClientField');
const drInput = document.getElementById('drInput');
const openSerialsBtn = document.getElementById('openSerialsBtn');
const closeSerialsBtn = document.getElementById('closeSerialsBtn');
const saveSerialsBtn = document.getElementById('saveSerialsBtn');
const serialNumbersField = document.getElementById('serialNumbersField');
const serialModalTitle = document.getElementById('serialModalTitle');

// Get available serials from window object (passed from HTML)
let availableSerials = window.availableSerials || [];

// Serial sorting logic
if (Array.isArray(availableSerials)) {
  availableSerials = availableSerials.sort((a, b) => {
    // Improved sorting by replacing non-digits to ensure proper numeric sort for SN-0001, SN-0010, etc.
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });
}



// ===========================
// VIEW TOGGLING
// ===========================

function showSerialView() {
  updateContainer.classList.replace('show-view', 'hide-view');
  serialModal.classList.replace('hide-view', 'show-view');
}

function showUpdateView() {
  serialModal.classList.replace('show-view', 'hide-view');
  updateContainer.classList.replace('hide-view', 'show-view');
}

// ===========================
// SERIAL CHECKBOXES RENDERING
// ===========================

function renderSerialCheckboxes(serialList) {
  serialInputsContainer.innerHTML = "";
  serialInputsContainer.style.display = 'grid'; // Default grid style for inputs/checkboxes

  // Logic for 3-column split (for OUT/checkbox view)
  const totalSerials = serialList.length;
  const numColumns = 3;
  const baseSize = Math.floor(totalSerials / numColumns);
  const remainder = totalSerials % numColumns; 
  
  const columnSizes = [];
  for (let i = 0; i < numColumns; i++) {
    columnSizes.push(baseSize + (i < remainder ? 1 : 0));
  }

  // Override to flex for vertical columns only when OUT and there are serials
  if (totalSerials > 0) {
    serialInputsContainer.style.display = 'flex';
    serialInputsContainer.style.flexDirection = 'row';
    serialInputsContainer.style.flexWrap = 'nowrap';
    serialInputsContainer.style.justifyContent = 'space-between';
    serialInputsContainer.style.gap = '30px'; // Gap between columns
  } else {
    serialInputsContainer.style.display = 'grid'; // Fallback for IN or no serials
  }

  let serialIndex = 0;
  columnSizes.forEach(size => {
    const columnDiv = document.createElement('div');
    columnDiv.style.display = 'flex';
    columnDiv.style.flexDirection = 'column';
    columnDiv.style.flexGrow = '1';
    columnDiv.style.gap = '5px'; // Gap between items in a column

    for (let i = 0; i < size; i++) {
      const serial = serialList[serialIndex];
      
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = serial;
      checkbox.style.marginRight = '10px';
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(serial));
      
      columnDiv.appendChild(label);
      serialIndex++;
    }
    
    serialInputsContainer.appendChild(columnDiv);
  });
}

// ===========================
// SERIAL MODAL FUNCTIONALITY
// ===========================

openSerialsBtn.addEventListener('click', () => {
  const inVal = parseInt(inField.value) || 0;
  const outVal = parseInt(outField.value) || 0;
  const allocVal = parseInt(allocatedQuantity.value) || 0; 
  serialInputsContainer.innerHTML = '';
  serialSearch.value = '';

  // Prevent opening modal without valid transaction quantity
  if (inVal === 0 && outVal === 0 && allocVal === 0) {
    alert("Please enter a valid IN, OUT, or ALLOCATE quantity before managing serials.");
    return;
  }

  // ===========================
  // IN Transaction → Add serials
  // ===========================
  if (inVal > 0 && outVal === 0 && allocVal === 0) {
    serialModalTitle.textContent = `Add ${inVal} New Serial Numbers`;
    serialSearchBox.style.display = "none";

    // Reset to grid flow for input fields (3 columns wide)
    serialInputsContainer.style.display = 'grid';
    serialInputsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    serialInputsContainer.style.gap = '10px 30px';

    for (let i = 1; i <= inVal; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Serial #${i}`;
      input.className = 'serial-input';
      serialInputsContainer.appendChild(input);
    }
    showSerialView();
    return;
  }

  // ===========================
  // OUT Transaction → Select serials
  // ===========================
  if (outVal > 0 && inVal === 0 && allocVal === 0) {
    if (outVal > availableSerials.length) {
      alert(`Only ${availableSerials.length} serial numbers are available — you requested ${outVal}.`);
      return;
    }
    serialModalTitle.textContent = `Select ${outVal} Serial Numbers`;
    serialSearchBox.style.display = "block";
    renderSerialCheckboxes(availableSerials);
    showSerialView();
    return;
  }

  // ===========================
  // ALLOCATE Transaction → Select serials (same as OUT)
  // ===========================
  if (allocVal > 0 && inVal === 0 && outVal === 0) {
    if (allocVal > availableSerials.length) {
      alert(`Only ${availableSerials.length} serial numbers are available — you requested ${allocVal}.`);
      return;
    }
    serialModalTitle.textContent = `Select ${allocVal} Serial Numbers (Allocate)`;
    serialSearchBox.style.display = "block";
    renderSerialCheckboxes(availableSerials);
    showSerialView();
    return;
  }
});

// Serial search functionality
serialSearch.addEventListener('input', () => {
  const query = serialSearch.value.toLowerCase();
  const filtered = availableSerials.filter(s => s.toLowerCase().includes(query));
  renderSerialCheckboxes(filtered);
});

// Close modal
closeSerialsBtn.addEventListener('click', showUpdateView);

// Save serials
saveSerialsBtn.addEventListener('click', () => {
  let serials = [];
  const inVal = parseInt(inField.value) || 0;
  const outVal = parseInt(outField.value) || 0;
  const allocVal = parseInt(allocatedQuantity.value) || 0; 

  // IN → collect text inputs
  if (inVal > 0) {
    serials = Array.from(serialInputsContainer.querySelectorAll('.serial-input'))
      .map(i => i.value.trim()).filter(Boolean);
    if (serials.length !== inVal) {
      alert(`Please enter exactly ${inVal} serial numbers.`);
      return;
    }
  } 
  // OUT or ALLOCATE → collect selected checkboxes
  else if (outVal > 0 || allocVal > 0) {
    const expected = outVal > 0 ? outVal : allocVal;
    serials = Array.from(serialInputsContainer.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    if (serials.length !== expected) {
      alert(`Please select exactly ${expected} serial numbers.`);
      return;
    }
  }

  serialNumbersField.value = serials.join(',');
  showUpdateView();
});



// Robust handleTransactionType + listeners (drop-in)
(function () {
  const inField = document.getElementById('inField');
  const outField = document.getElementById('outField');
  const allocateField = document.getElementById('allocatedQuantity');
  const poSupplier = document.getElementById('poSupplierField');
  const poClient = document.getElementById('poClientField');
  const drInput = document.getElementById('drInput');

  if (!inField || !outField || !allocateField) {
    console.warn('handleTransactionType: required fields not found');
    return;
  }

  // Safe positive number check
  function isPositive(val) {
    const n = Number(val);
    return Number.isFinite(n) && n > 0;
  }

  function handleTransactionType() {
    const hasIn = isPositive(inField.value);
    const hasOut = isPositive(outField.value);
    const hasAlloc = isPositive(allocateField.value);

    // If user entered multiple simultaneously, clear the others and show alert
    if ((hasIn && hasOut) || (hasIn && hasAlloc) || (hasOut && hasAlloc)) {
      alert("You can only perform one transaction type at a time — IN, OUT, or ALLOCATE.");
      const active = document.activeElement;
      // Clear the field that is not active (so user keeps typing in current)
      if (active === inField) { outField.value = ''; allocateField.value = ''; }
      else if (active === outField) { inField.value = ''; allocateField.value = ''; }
      else if (active === allocateField) { inField.value = ''; outField.value = ''; }
    }

    // Recompute booleans after possible clearing
    const nowHasIn = isPositive(inField.value);
    const nowHasOut = isPositive(outField.value);
    const nowHasAlloc = isPositive(allocateField.value);

    // Default: enable everything (we'll set properly below)
    inField.disabled = false;
    outField.disabled = false;
    allocateField.disabled = false;
    if (poSupplier) poSupplier.disabled = false;
    if (poClient) poClient.disabled = false;
    if (drInput) drInput.disabled = true; // default DR disabled

    // IN case
    if (nowHasIn) {
      inField.disabled = false;
      outField.disabled = true;
      allocateField.disabled = true;

      if (poSupplier) poSupplier.disabled = false;
      if (poClient) poClient.disabled = false;
      if (drInput) drInput.disabled = true;

      // clear any stale allocate/out values just in case
      outField.value = '';
      allocateField.value = '';
      return;
    }

    // OUT case
    if (nowHasOut) {
      inField.disabled = true;
      outField.disabled = false;
      allocateField.disabled = true;

      if (poSupplier) poSupplier.disabled = true;
      if (poClient) poClient.disabled = false;
      if (drInput) drInput.disabled = false;

      inField.value = '';
      allocateField.value = '';
      return;
    }

    // ALLOCATE case
if (nowHasAlloc) {
  inField.disabled = true;
  outField.disabled = true;
  allocateField.disabled = false;

  if (poSupplier) poSupplier.disabled = false;
  if (poClient) poClient.disabled = false;
  if (drInput) drInput.disabled = false; 

  inField.value = '';
  outField.value = '';
  return;
}

    // No values present — reset to default
    inField.disabled = false;
    outField.disabled = false;
    allocateField.disabled = false;
    if (poSupplier) poSupplier.disabled = false;
    if (poClient) poClient.disabled = false;
    if (drInput) drInput.disabled = true;
  }

  // Attach listeners — input/change/keyup to be thorough
  ['input', 'change', 'keyup'].forEach(evt => {
    inField.addEventListener(evt, handleTransactionType);
    outField.addEventListener(evt, handleTransactionType);
    allocateField.addEventListener(evt, handleTransactionType);
  });

  // Also prevent typing into disabled fields (failsafe)
  function preventIfDisabled(e) {
    if (e.target.disabled) {
      e.preventDefault();
      e.target.blur();
    }
  }
  [inField, outField, allocateField].forEach(el => {
    el.addEventListener('keydown', preventIfDisabled);
    el.addEventListener('focus', () => { if (el.disabled) el.blur(); });
  });

  // Initialize on load
  handleTransactionType();

  // Expose if other code wants to call it
  window.handleTransactionType = handleTransactionType;
})();
