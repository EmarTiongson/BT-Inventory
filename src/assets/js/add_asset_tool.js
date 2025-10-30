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

// ===========================
// FORM VALIDATION
// ===========================

const form = document.querySelector('form');

if (form) {
  form.addEventListener('submit', function(e) {
    const toolName = document.querySelector('input[name="tool_name"]');
    const description = document.querySelector('input[name="description"]');
    const dateAdded = document.querySelector('input[name="date_added"]');
    const assignedBy = document.querySelector('input[name="assigned_by"]');
    
    let isValid = true;
    let errorMessage = '';

    // Validate required fields
    if (!toolName.value.trim()) {
      isValid = false;
      errorMessage = 'Tool/Asset Name is required.';
    } else if (!description.value.trim()) {
      isValid = false;
      errorMessage = 'Description is required.';
    } else if (!dateAdded.value) {
      isValid = false;
      errorMessage = 'Date is required.';
    } else if (!assignedBy.value.trim()) {
      isValid = false;
      errorMessage = 'Assignment maker is required.';
    }

    if (!isValid) {
      e.preventDefault();
      alert(errorMessage);
    }
  });
}