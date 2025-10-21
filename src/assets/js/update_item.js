document.addEventListener('DOMContentLoaded', function() {
    
    // --- START of all your existing code ---

    const updateContainer = document.getElementById('updateContainer');
    const serialModal = document.getElementById('serialModal');

    const inField = document.getElementById('inField');
    const outField = document.getElementById('outField');
    const poSupplier = document.getElementById('poSupplierField');
    const poClient = document.getElementById('poClientField');
    const drInput = document.getElementById('drInput');
    const openSerialsBtn = document.getElementById('openSerialsBtn');
    const closeSerialsBtn = document.getElementById('closeSerialsBtn');
    const saveSerialsBtn = document.getElementById('saveSerialsBtn');
    const serialInputsContainer = document.getElementById('serialInputsContainer');
    const serialNumbersField = document.getElementById('serialNumbersField');
    const serialModalTitle = document.getElementById('serialModalTitle');

    // IMPORTANT: We need to get the availableSerials array from the HTML, 
    // so we'll grab it from a data attribute on the serialModal element.
    const serialModalElement = document.getElementById('serialModal');
    // Check if element exists before trying to access attribute
    const availableSerialsString = serialModalElement ? serialModalElement.getAttribute('data-available-serials') : '[]';
    const availableSerials = JSON.parse(availableSerialsString);

    // --- Helper Functions ---
    function resetFields() {
        inField.disabled = false;
        outField.disabled = false;
        poSupplier.disabled = false;
        poClient.disabled = false;
        drInput.disabled = true;
        drInput.value = ""; // Clear DR on reset
        poClient.value = ""; // Clear PO Client on reset
        poSupplier.value = ""; // Clear PO Supplier on reset
    }

    function handleTransactionType() {
        const inVal = inField.value.trim();
        const outVal = outField.value.trim();
        const hasIn = inVal !== "" && parseInt(inVal) > 0;
        const hasOut = outVal !== "" && parseInt(outVal) > 0;

        if (hasIn && hasOut) {
            alert("You can only enter either IN or OUT — not both.");
            if (outField === document.activeElement) {
                outField.value = "";
            } else if (inField === document.activeElement) {
                inField.value = "";
            }
            handleTransactionType(); 
            return;
        }
            
        if (hasIn) {
            outField.disabled = true;
            poClient.disabled = true;
            drInput.disabled = true;
            poSupplier.disabled = false;
        }
        else if (hasOut) {
            inField.disabled = true;
            poSupplier.disabled = true;
            poClient.disabled = false;
            drInput.disabled = false;
        }
        else {
            resetFields();
        }
    }

    // Attach event listeners to trigger the logic on input
    [inField, outField].forEach(field => {
        field.addEventListener('input', handleTransactionType);
    });

    // Initialize the state when the page loads
    resetFields();
    handleTransactionType();


    // --- View Swapping Functions ---
    function showSerialView() {
        updateContainer.classList.remove('show-view');
        updateContainer.classList.add('hide-view');
        
        serialModal.classList.remove('hide-view');
        serialModal.classList.add('show-view');
    }

    function showUpdateView() {
        serialModal.classList.remove('show-view');
        serialModal.classList.add('hide-view');
        
        updateContainer.classList.remove('hide-view');
        updateContainer.classList.add('show-view');
    }
    // -------------------------------


    /* ============================== SERIAL MODAL LOGIC ============================== */

    // Check if openSerialsBtn exists before adding listener
    if (openSerialsBtn) {
        openSerialsBtn.addEventListener('click', () => {
            const inVal = parseInt(inField.value) || 0;
            const outVal = parseInt(outField.value) || 0;
            serialInputsContainer.innerHTML = '';

            if (inVal === 0 && outVal === 0) {
                alert("Please enter a valid IN or OUT quantity before managing serials.");
                return;
            }
                
            if (inVal > 0 && outVal === 0) {
                // IN - Adding new serials (3-column input fields)
                serialModalTitle.textContent = `Add ${inVal} New Serial Numbers`;
                serialInputsContainer.classList.add('form-grid'); 
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
                // OUT - Selecting available serials (3-column checklist)
                if (availableSerials.length === 0) {
                    alert("No available serial numbers for this item.");
                    return;
                }
                if (outVal > availableSerials.length) {
                    alert(`Only ${availableSerials.length} serial numbers are available — you requested ${outVal}.`);
                    return;
                }

                serialModalTitle.textContent = `Select ${outVal} Serial Numbers`;
                serialInputsContainer.classList.add('form-grid'); 
                
                // Checkbox rendering logic for 3 columns
                availableSerials.forEach(serial => {
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = serial;
                    checkbox.style.marginRight = '12px';
                    
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(serial));
                    
                    // Wrap each checkbox/label in a DIV to ensure clean grid cells
                    const wrapper = document.createElement('div');
                    wrapper.appendChild(label);
                    serialInputsContainer.appendChild(wrapper);
                });
                
                showSerialView();
                return;
            }
        });
    }


    closeSerialsBtn.addEventListener('click', showUpdateView);

    saveSerialsBtn.addEventListener('click', () => {
        let serials = [];
        const inVal = parseInt(inField.value) || 0;
        const outVal = parseInt(outField.value) || 0;

        if (inVal > 0 && outVal === 0) {
            serials = Array.from(serialInputsContainer.querySelectorAll('input.serial-input'))
                .map(i => i.value.trim())
                .filter(v => v !== '');
            if (serials.length !== inVal) {
                alert(`Please enter exactly ${inVal} serial numbers.`);
                return;
            }
        }
        else if (outVal > 0 && inVal === 0) {
            const checked = Array.from(serialInputsContainer.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            if (checked.length !== outVal) {
                alert(`Please select exactly ${outVal} serial numbers.`);
                return;
            }
            serials = checked;
        }

        serialNumbersField.value = serials.join(',');
        showUpdateView();
    });

    document.querySelector('form').addEventListener('submit', (e) => {
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Updating...';
        }
    });

    // --- END of all your existing code ---
});