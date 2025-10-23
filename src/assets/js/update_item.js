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

// ✅ Get available serials from window object (passed from HTML)
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
// TRANSACTION TYPE HANDLING
// ===========================

function resetFields() {
  inField.disabled = false;
  outField.disabled = false;
  poSupplier.disabled = false;
  poClient.disabled = false;
  drInput.disabled = true;
  drInput.value = "";
  poClient.value = "";
  poSupplier.value = "";
}

function handleTransactionType() {
  const inVal = inField.value.trim();
  const outVal = outField.value.trim();
  const hasIn = inVal !== "" && parseInt(inVal) > 0;
  const hasOut = outVal !== "" && parseInt(outVal) > 0;

  if (hasIn && hasOut) {
    alert("You can only enter either IN or OUT — not both.");
    if (outField === document.activeElement) outField.value = "";
    else if (inField === document.activeElement) inField.value = "";
    handleTransactionType();
    return;
  }

  if (hasIn) {
    outField.disabled = true;
    poClient.disabled = true;
    drInput.disabled = true;
    poSupplier.disabled = false;
  } else if (hasOut) {
    inField.disabled = true;
    poSupplier.disabled = true;
    poClient.disabled = false;
    drInput.disabled = false;
  } else {
    resetFields();
  }
}

// Add event listeners
[inField, outField].forEach(f => f.addEventListener('input', handleTransactionType));
resetFields();
handleTransactionType();

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
  serialInputsContainer.innerHTML = '';
  serialSearch.value = '';

  if (inVal === 0 && outVal === 0) {
    alert("Please enter a valid IN or OUT quantity before managing serials.");
    return;
  }

  if (inVal > 0 && outVal === 0) {
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

  if (outVal > 0 && inVal === 0) {
    if (outVal > availableSerials.length) {
      alert(`Only ${availableSerials.length} serial numbers are available — you requested ${outVal}.`);
      return;
    }
    serialModalTitle.textContent = `Select ${outVal} Serial Numbers`;
    serialSearchBox.style.display = "block";
    renderSerialCheckboxes(availableSerials);
    showSerialView();
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

  if (inVal > 0) {
    serials = Array.from(serialInputsContainer.querySelectorAll('.serial-input'))
      .map(i => i.value.trim()).filter(Boolean);
    if (serials.length !== inVal) {
      alert(`Please enter exactly ${inVal} serial numbers.`);
      return;
    }
  } else if (outVal > 0) {
    serials = Array.from(serialInputsContainer.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    if (serials.length !== outVal) {
      alert(`Please select exactly ${outVal} serial numbers.`);
      return;
    }
  }

  serialNumbersField.value = serials.join(',');
  showUpdateView();
});