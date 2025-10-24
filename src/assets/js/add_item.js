// Get all required DOM elements
const openModalBtn = document.getElementById("openSerialModal");
const serialModal = document.getElementById("serialModal");
const closeModalBtn = document.getElementById("closeSerialModal");
const saveSerialBtn = document.getElementById("saveSerialNumbers");
const serialFieldsContainer = document.getElementById("serialFieldsContainer");
const hiddenSerialInput = document.getElementById("serialHiddenInput");
const totalStockField = document.querySelector("input[name='total_stock']");
const modalSerialError = document.getElementById("modalSerialError");
const serialErrorText = document.getElementById("serialErrorText");

let serialNumbers = [];

// ✅ Check if all elements exist
console.log("Modal elements check:", {
  openModalBtn: !!openModalBtn,
  serialModal: !!serialModal,
  closeModalBtn: !!closeModalBtn,
  saveSerialBtn: !!saveSerialBtn,
  serialFieldsContainer: !!serialFieldsContainer,
  hiddenSerialInput: !!hiddenSerialInput,
  totalStockField: !!totalStockField
});

// ✅ Open modal and generate serial fields based on total stock
if (openModalBtn && serialModal) {
  openModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Open modal button clicked");

    const totalStock = parseInt(totalStockField.value);
    console.log("Total stock value:", totalStock);
    
    if (!totalStock || totalStock <= 0) {
      alert("Please enter a valid Total Stock before adding serial numbers.");
      return;
    }

    // Clear old fields and hide error
    serialFieldsContainer.innerHTML = "";
    if (modalSerialError) {
      modalSerialError.classList.remove("show");
    }

    // Load existing serial numbers from hidden input (for error recovery)
    const existingSerials = hiddenSerialInput.value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    // Create input fields
    for (let i = 1; i <= totalStock; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Serial Number ${i} (optional)`;
      input.classList.add("serial-field");
      
      // Restore existing value if available
      if (existingSerials[i - 1]) {
        input.value = existingSerials[i - 1];
      } else if (serialNumbers[i - 1]) {
        input.value = serialNumbers[i - 1];
      }
      
      serialFieldsContainer.appendChild(input);
    }

    // Show modal
    serialModal.style.display = "flex";
    console.log("Modal display set to:", serialModal.style.display);
    console.log("Modal computed display:", window.getComputedStyle(serialModal).display);
  });
}

// ✅ Close modal
if (closeModalBtn && serialModal) {
  closeModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    serialModal.style.display = "none";
    if (modalSerialError) {
      modalSerialError.classList.remove("show");
    }
    console.log("Modal closed via close button");
  });
}

// ✅ Save serial numbers with validation
if (saveSerialBtn) {
  saveSerialBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const inputs = document.querySelectorAll(".serial-field");
    const totalStock = parseInt(totalStockField.value);
    
    console.log("Save button clicked, inputs found:", inputs.length);
    
    // Collect all filled serial numbers
    serialNumbers = Array.from(inputs)
      .map((input) => input.value.trim())
      .filter(Boolean);

    const filledCount = serialNumbers.length;
    console.log("Filled serial numbers:", filledCount, "Total stock:", totalStock);

    // ✅ VALIDATION 1: Check if filled serials match total stock (if any are filled)
    if (filledCount > 0 && filledCount !== totalStock) {
      if (modalSerialError && serialErrorText) {
        serialErrorText.textContent = `You've filled ${filledCount} serial number(s), but Total Stock is ${totalStock}. Please fill all ${totalStock} fields or leave them all empty.`;
        modalSerialError.classList.add("show");
      } else {
        alert(`⚠️ Serial number count mismatch!\n\nFilled: ${filledCount}\nRequired: ${totalStock}\n\nPlease fill all ${totalStock} fields or leave them all empty.`);
      }
      return; // ❌ Prevent saving
    }

    // ✅ VALIDATION 2: Check for duplicate serial numbers
    const uniqueSerials = [...new Set(serialNumbers)];
    if (uniqueSerials.length !== serialNumbers.length) {
      if (modalSerialError && serialErrorText) {
        serialErrorText.textContent = 'Duplicate serial numbers detected. Each serial number must be unique.';
        modalSerialError.classList.add("show");
      } else {
        alert('⚠️ Duplicate serial numbers detected!\n\nEach serial number must be unique.');
      }
      return; // ❌ Prevent saving
    }

    // ✅ SUCCESS: Save to hidden input
    hiddenSerialInput.value = serialNumbers.join(",");
    serialModal.style.display = "none";
    
    // Hide error message on successful save
    if (modalSerialError) {
      modalSerialError.classList.remove("show");
    }

    // Show success feedback
    if (filledCount > 0) {
      console.log(`✅ ${filledCount} serial numbers saved successfully!`);
      alert(`✅ ${filledCount} serial numbers saved successfully!`);
    } else {
      console.log("No serial numbers entered (optional)");
    }
  });
}

// ✅ Click outside to close modal
if (serialModal) {
  serialModal.addEventListener("mousedown", (e) => {
    if (e.target === serialModal) {
      serialModal.style.display = "none";
      if (modalSerialError) {
        modalSerialError.classList.remove("show");
      }
      console.log("Modal closed via outside click");
    }
  });
}

// ===========================
// IMAGE PREVIEW HANDLING
// ===========================

const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const uploadLabel = document.getElementById('uploadLabel');

if (imageInput && imagePreview && uploadLabel) {
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadLabel.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = '#';
      imagePreview.style.display = 'none';
      uploadLabel.style.display = 'inline-flex';
    }
  });

  // ✅ Clicking the preview allows re-upload
  imagePreview.addEventListener('click', function() {
    imageInput.click();
  });
}