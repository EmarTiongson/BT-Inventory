// ===============================
// Modal Functionality
// ===============================

const addProjectModal = document.getElementById('addProjectModal');
const addProjectForm = document.getElementById('addProjectForm');
const projectList = document.getElementById('projectList');
const projectSearchInput = document.getElementById('projectSearchInput');

function openAddProjectModal() {
  addProjectModal.classList.add('show');
  addProjectModal.style.display = 'flex';
}

function closeAddProjectModal() {
  addProjectModal.classList.remove('show');
  addProjectModal.style.display = 'none';
  addProjectForm.reset();
}

// ===============================
// Add Project Form Handler (AJAX)
// ===============================

addProjectForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const title = document.getElementById('newProjectTitle').value.trim();
  const po = document.getElementById('newPoNumber').value.trim();
  const remarks = document.getElementById('newProjectRemarks').value.trim();
  const location = document.getElementById('newProjectLocation').value.trim();
  const date = document.getElementById('newProjectDate').value;

  if (!title || !po) {
    alert("Please enter both Project Title and P.O Number.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('project_title', title);
    formData.append('po_number', po);
    formData.append('remarks', remarks);
    formData.append('location', location);
    formData.append('date', date);

    // Get CSRF token from Django cookie
    const csrftoken = getCookie('csrftoken');

    const response = await fetch('/add_project/', {
      method: 'POST',
      headers: { 'X-CSRFToken': csrftoken },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      await loadProjects(); // Reload the full list from backend
      alert("✅ Project saved successfully!");
      addProjectForm.reset();
      closeAddProjectModal();
    } else {
      alert("⚠️ " + (data.error || "Failed to save project."));
    }
  } catch (err) {
    console.error(err);
    alert("❌ An error occurred while saving the project.");
  }
});

// ===============================
// CSRF Helper
// ===============================

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// ===============================
// Dropdown Search Functionality
// ===============================

function filterProjects() {
  const filter = projectSearchInput.value.toUpperCase();
  const li = projectList.getElementsByTagName('li');

  for (let i = 0; i < li.length; i++) {
    const txtValue = li[i].textContent || li[i].innerText;
    li[i].style.display = txtValue.toUpperCase().includes(filter) ? "" : "none";
  }
}

function showAllProjects() {
  projectList.style.display = "block";
}

// ===============================
// Project Selection
// ===============================

function selectProject(displayName, el) {
  projectSearchInput.value = displayName;
  projectList.style.display = "none";

  // ✅ FIX: Use dataset.id which now contains the PO number
  const projectId = el.dataset.id;
  document.getElementById("projectDetailsContainer").dataset.projectId = projectId;
  console.log('Selected project ID:', projectId); // Debug log
  displayProjectDetails(projectId);
}

// ===============================
// Project Details Display (Dynamic)
// ===============================

async function displayProjectDetails(projectId) {
  try {
    console.log('Fetching project details for:', projectId);

    const response = await fetch(`/get_project_details/${encodeURIComponent(projectId)}/`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data:', data);

    const container = document.getElementById('projectDetailsContainer');
    const title = document.getElementById('projectTitle');
    const po = document.getElementById('projectPo');
    const remarks = document.getElementById('projectRemarks');
    const location = document.getElementById('projectLocation');
    const date = document.getElementById('projectDate');
    const list = document.getElementById('projectListContainer');

    // Show the project details container
    container.style.display = 'block';

    // Populate details
    title.textContent = data.title || 'Untitled Project';
    po.textContent = data.po_no || 'N/A';
    remarks.textContent = data.remarks || 'No remarks yet.';
    location.textContent = data.location || 'N/A';
    date.textContent = data.date || 'N/A';

    // Clear any previous DRs
    list.innerHTML = '';

    // Check for DRs
    if (data.drs && data.drs.length > 0) {
      data.drs.forEach(dr => {
        const card = document.createElement('div');
        card.classList.add('dr-card');

        // === Build DR Images ===
        let imagesHtml = '';

        if (dr.images) {
          // ✅ Normalize images into an array, even if backend returns a single string
          const imageList = Array.isArray(dr.images)
            ? dr.images
            : (typeof dr.images === 'string' && dr.images.trim() !== '' ? [dr.images] : []);

          if (imageList.length > 0) {
            imagesHtml = '<div class="dr-images-gallery">';
            imageList.forEach(imgUrl => {
              const fullUrl = imgUrl.startsWith('http')
                ? imgUrl
                : `${window.location.origin}${imgUrl}`;
              imagesHtml += `
                <img 
                  src="${fullUrl}" 
                  alt="DR ${dr.dr_no}" 
                  class="dr-image-preview"
                  onerror="this.style.display='none';"
                >
              `;
            });
            imagesHtml += '</div>';
          } else {
            imagesHtml = '<p class="no-image">No images uploaded</p>';
          }
        } else {
          imagesHtml = '<p class="no-image">No images uploaded</p>';
        }

        // === Build DR Card HTML ===
        card.innerHTML = `
          <p><strong>DR No:</strong> ${dr.dr_no || 'N/A'}</p>
          <p><strong>P.O. No:</strong> ${dr.po_number || 'N/A'}</p>
          <p><strong>Date:</strong> ${dr.date_created || 'N/A'}</p>
          <div class="dr-image-container">
            ${imagesHtml}
          </div>
        `;

        // Add click event to open DR details
        card.addEventListener('click', () => showDrDetails(dr.dr_no));

        // Append card to the list
        list.appendChild(card);
      });
    } else {
      // If no DRs found
      list.innerHTML = `
        <div class="dr-card">
          <p>No DRs found for this project.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Failed to load project details:', err);
    alert('❌ Could not load project details: ' + err.message);

      
  }
}
  

// ===============================
// DR Details Modal Functionality
// ===============================

const drModal = document.getElementById('drDetailsModal');
const closeDrModal = document.getElementById('closeDrModal');
const drDetailsBody = document.getElementById('drDetailsBody');

if (closeDrModal) {
  closeDrModal.addEventListener('click', () => {
    drModal.classList.remove('show');
    drModal.style.display = 'none';
  });
}

async function showDrDetails(drNo) {
  try {
    const poClient = document.getElementById('projectPo').textContent.trim();
    const response = await fetch(
      `/get_dr_details/${encodeURIComponent(drNo)}/?po_client=${encodeURIComponent(poClient)}`
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    document.getElementById('modalDrNumber').textContent = `DR No: ${drNo}`;
    document.getElementById('poNumberDisplay').textContent = `P.O No: ${poClient}`;
    drDetailsBody.innerHTML = '';

    if (data.transactions && data.transactions.length > 0) {
      
      data.transactions.forEach(tx => {
        const row = document.createElement('tr');

        // ✅ "View Serials" link if serial_numbers exist
        const serialButton =
          tx.serial_numbers && tx.serial_numbers.length > 0
            ? `<div class="serials-wrapper">
                 <a href="#" class="view-serials-link" data-update-id="${tx.id}">
                   View Serials (${tx.serial_numbers.length})
                 </a>
               </div>`
            : '—';

        row.innerHTML = `
          <td>${tx.item_name || '—'}</td>
          <td>${tx.item_description || '—'}</td>
          <td>${tx.quantity || '—'}</td>
          <td>${serialButton}</td>
          <td>${tx.location || '—'}</td>
          <td>${tx.remarks || '—'}</td>
          <td>${tx.updated_by_user || '—'}</td>
        `;
        drDetailsBody.appendChild(row);
      });

      // ✅ Attach serial dropdown functionality
      if (window.SerialDropdown) {
        window.SerialDropdown.attach('.view-serials-link');
      }
    } else {
      drDetailsBody.innerHTML = `<tr><td colspan="12">No transactions found for this D.R.</td></tr>`;
    }

    drModal.classList.add('show');
    drModal.style.display = 'flex';
  } catch (err) {
    console.error('Failed to load DR details:', err);
    alert('❌ Could not load DR details.');
  }
}

// ===============================
// Load Projects List
// ===============================

document.addEventListener("DOMContentLoaded", loadProjects);

async function loadProjects() {
  try {
    console.log('Loading projects...'); // Debug log
    
    const response = await fetch('/api/projects/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    console.log('Projects loaded:', data); // Debug log

    projectList.innerHTML = '';
    const seen = new Set();

    data.projects.forEach(p => {
      const key = p.display.trim().toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);

        const li = document.createElement('li');
        li.textContent = p.display;
        li.dataset.id = p.id; // ✅ This is now the PO number (string)
        li.dataset.display = p.display;
        li.onclick = () => selectProject(p.display, li);
        projectList.appendChild(li);
      }
    });
    
    console.log('Projects list updated, total:', seen.size); // Debug log
  } catch (err) {
    console.error("Failed to load projects:", err);
    alert("❌ Failed to load projects: " + err.message);
  }
}

// ===============================
// Upload DR Modal Functionality
// ===============================

const uploadDrModal = document.getElementById('uploadDrModal');
const uploadDrForm = document.getElementById('uploadDrForm');

function openUploadDrModal() {
  if (uploadDrModal) {
    uploadDrModal.classList.add('show');
    uploadDrModal.style.display = 'flex';
  }
}

function closeUploadDrModal() {
  if (uploadDrModal) {
    uploadDrModal.classList.remove('show');
    uploadDrModal.style.display = 'none';
  }
  if (uploadDrForm) {
    uploadDrForm.reset();
  }
}

// ✅ Handle form submission
if (uploadDrForm) {
  uploadDrForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const po_number = document.getElementById('po_number')?.value.trim();
    const dr_number = document.getElementById('dr_number')?.value.trim();
    const uploaded_date = document.getElementById('uploaded_date')?.value;
    const images = document.getElementById('images')?.files;

    if (!po_number || !dr_number || !uploaded_date) {
      alert("⚠️ Please fill out all fields.");
      return;
    }

    if (!images || images.length < 1) {
      alert("⚠️ Please upload at least one image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('po_number', po_number);
      formData.append('dr_number', dr_number);
      formData.append('uploaded_date', uploaded_date);

      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }

      const csrftoken = getCookie('csrftoken');

      const response = await fetch('/upload_dr/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        credentials: 'same-origin',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ DR and Images uploaded successfully!");
        closeUploadDrModal();
        
        // Reload the current project if one is selected
        const projectContainer = document.getElementById("projectDetailsContainer");
        const selectedProjectId = projectContainer?.dataset.projectId;

      if (selectedProjectId) {
        await displayProjectDetails(selectedProjectId);
      }

      } else {
        alert("❌ Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload DR error:", err);
      alert("❌ An error occurred while uploading the D.R. — check console for details.");
    }

  });
}

// ===============================
// Image Preview Modal Functionality
// ===============================

const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const closeImagePreview = document.getElementById('closeImagePreview');

// ✅ When any DR image is clicked
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('dr-image-preview')) {
    const src = e.target.src;
    previewImage.src = src;
    imagePreviewModal.style.display = 'flex';
  }
});

// ✅ Close modal when clicking the X
if (closeImagePreview) {
  closeImagePreview.addEventListener('click', () => {
    imagePreviewModal.style.display = 'none';
    previewImage.src = '';
  });
}

// ===============================
// Global Click Events (Consolidated)
// ===============================

window.addEventListener('click', (e) => {
  // Close Add Project Modal if clicked outside
  if (e.target === addProjectModal) {
    closeAddProjectModal();
  }
  
  // Close Upload DR Modal if clicked outside
  if (e.target === uploadDrModal) {
    closeUploadDrModal();
  }
  
  // Close DR Details Modal if clicked outside
  if (e.target === drModal) {
    drModal.classList.remove('show');
    drModal.style.display = 'none';
  }
  
  // Close Image Preview Modal if clicked outside
  if (e.target === imagePreviewModal) {
    imagePreviewModal.style.display = 'none';
    previewImage.src = '';
  }
});

// ===============================
// ESC Key to Close Modals
// ===============================

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (addProjectModal && addProjectModal.classList.contains('show')) {
      closeAddProjectModal();
    }
    if (uploadDrModal && uploadDrModal.classList.contains('show')) {
      closeUploadDrModal();
    }
    if (drModal && drModal.classList.contains('show')) {
      drModal.classList.remove('show');
      drModal.style.display = 'none';
    }
    if (imagePreviewModal && imagePreviewModal.style.display === 'flex') {
      imagePreviewModal.style.display = 'none';
      previewImage.src = '';
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadIconBtn");
  const fileInput = document.getElementById("images");
  const fileCount = document.getElementById("fileCount");

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        fileCount.textContent = `${fileInput.files.length} file(s) selected`;
      } else {
        fileCount.textContent = "No files selected";
      }
    });
  }
});

// ===============================
// DR Item Search/Filter
// ===============================

function filterDrItems() {
    // Get the search input value and convert to uppercase for case-insensitive search
    const input = document.getElementById('drItemSearchInput');
    const filter = input.value.toUpperCase();
    
    // Get the table body and all its rows
    const tableBody = document.getElementById('drDetailsBody');
    const rows = tableBody.getElementsByTagName('tr');

    // Loop through all table rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Get the text content of the first two cells (Item Name and Item Description)
        const itemNameCell = row.getElementsByTagName('td')[0]; // Item Name is index 0
        const itemDescCell = row.getElementsByTagName('td')[1]; // Item Description is index 1
        
        let shouldDisplay = false;

        if (itemNameCell) {
            const itemNameText = itemNameCell.textContent || itemNameCell.innerText;
            if (itemNameText.toUpperCase().includes(filter)) {
                shouldDisplay = true;
            }
        }
        
        if (!shouldDisplay && itemDescCell) {
            const itemDescText = itemDescCell.textContent || itemDescCell.innerText;
            if (itemDescText.toUpperCase().includes(filter)) {
                shouldDisplay = true;
            }
        }

        // Show or hide the row based on the filter result
        row.style.display = shouldDisplay ? "" : "none";
    }
}