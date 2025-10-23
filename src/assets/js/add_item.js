const openModalBtn = document.getElementById("openSerialModal");
const serialModal = document.getElementById("serialModal");
const closeModalBtn = document.getElementById("closeSerialModal");
const saveSerialBtn = document.getElementById("saveSerialNumbers");
const serialFieldsContainer = document.getElementById("serialFieldsContainer");
const hiddenSerialInput = document.getElementById("serialHiddenInput");
const totalStockField = document.querySelector("input[name='total_stock']");

let serialNumbers = [];

// ✅ Open modal and generate serial fields based on total stock
openModalBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const totalStock = parseInt(totalStockField.value);
  if (!totalStock || totalStock <= 0) {
    alert("Please enter a valid Total Stock before adding serial numbers.");
    return;
  }

  // Clear old fields
  serialFieldsContainer.innerHTML = "";

  // Create input fields
  for (let i = 1; i <= totalStock; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Serial Number ${i} (optional)`;
    input.classList.add("serial-field");
    if (serialNumbers[i - 1]) input.value = serialNumbers[i - 1];
    serialFieldsContainer.appendChild(input);
  }

  serialModal.style.display = "flex";
});

// ✅ Close modal
closeModalBtn.addEventListener("click", () => {
  serialModal.style.display = "none";
});

// ✅ Save serial numbers to hidden input
saveSerialBtn.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".serial-field");
  serialNumbers = Array.from(inputs)
    .map((input) => input.value.trim())
    .filter(Boolean);

  hiddenSerialInput.value = serialNumbers.join(",");
  serialModal.style.display = "none";
});

// ✅ Click outside to close modal
serialModal.addEventListener("mousedown", (e) => {
  if (e.target === serialModal) {
    serialModal.style.display = "none";
  }
});

// ✅ Image preview handling
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const uploadLabel = document.getElementById('uploadLabel');

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