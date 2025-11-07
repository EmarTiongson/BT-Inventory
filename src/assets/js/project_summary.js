// ===============================
// Modal Functionality
// ===============================

const addProjectModal = document.getElementById('addProjectModal');
const addProjectForm = document.getElementById('addProjectForm');
const projectList = document.getElementById('projectList');
const projectSearchInput = document.getElementById('projectSearchInput');

function openAddProjectModal() {
  addProjectModal.style.display = 'flex';
}

function closeAddProjectModal() {
  addProjectModal.style.display = 'none';
  addProjectForm.reset();
}

window.addEventListener('click', function (e) {
  if (e.target === addProjectModal) closeAddProjectModal();
});

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
      console.error('Error response:', errorData);
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

    container.style.display = 'block';

    title.textContent = data.title;
    po.textContent = data.po_no;
    remarks.textContent = data.remarks || 'No remarks yet.';
    location.textContent = data.location || 'N/A';
    date.textContent = data.date || 'N/A';

    // Clear old DRs
    list.innerHTML = '';

    if (data.drs && data.drs.length > 0) {
      data.drs.forEach(dr => {
        const card = document.createElement('div');
        card.classList.add('dr-card');

        // Build images HTML
        let imagesHtml = '';
        if (dr.images && dr.images.length > 0) {
          imagesHtml = '<div class="dr-images-gallery">';
          dr.images.forEach(imgUrl => {
            imagesHtml += `<img src="${imgUrl}" alt="DR ${dr.dr_no}" class="dr-image-preview">`;
          });
          imagesHtml += '</div>';
        } else {
          imagesHtml = '<p class="no-image">No images uploaded</p>';
        }

        card.innerHTML = `
          <p><strong>DR No:</strong> ${dr.dr_no}</p>
          <p><strong>P.O. No:</strong> ${dr.po_number}</p>
          <p><strong>Date:</strong> ${dr.date_created}</p>
          <div class="dr-image-container">
            ${imagesHtml}
          </div>
        `;

        // Open DR details modal when clicked
        card.addEventListener('click', () => showDrDetails(dr.dr_no));

        list.appendChild(card);
      });
    } else {
      list.innerHTML = `<div class="dr-card"><p>No DRs found for this project.</p></div>`;
    }
  } catch (err) {
    console.error("Failed to load project details:", err);
    alert("❌ Could not load project details: " + err.message);
  }
}

// ===============================
// DR Details Modal Functionality
// ===============================

const drModal = document.getElementById('drDetailsModal');
const closeDrModal = document.getElementById('closeDrModal');
const drDetailsBody = document.getElementById('drDetailsBody');

if (closeDrModal) {
  closeDrModal.addEventListener('click', () => drModal.style.display = 'none');
}

window.addEventListener('click', e => {
  if (e.target === drModal) drModal.style.display = 'none';
});

async function showDrDetails(drNo) {
  try {
    const poClient = document.getElementById('projectPo').textContent.trim();
    const response = await fetch(
      `/get_dr_details/${encodeURIComponent(drNo)}/?po_client=${encodeURIComponent(poClient)}`
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

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
          <td>${tx.date || '—'}</td>
          <td>${tx.item__item_name || '—'}</td>
          <td>${tx.transaction_type || '—'}</td>
          <td>${tx.quantity || '—'}</td>
          <td>${tx.stock_after_transaction || '—'}</td>
          <td>${serialButton}</td>
          <td>${tx.location || '—'}</td>
          <td>${tx.po_supplier || '—'}</td>
          <td>${tx.po_client || '—'}</td>
          <td>${tx.dr_no || '—'}</td>
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
// Upload DR Modal + Form Handling (Safe)
// ===============================

const uploadDrModal = document.getElementById('uploadDrModal');
const openUploadDrModalBtn = document.getElementById('openUploadDrModalBtn');
const closeUploadDrModal = document.getElementById('closeUploadDrModal');
const uploadDrForm = document.getElementById('uploadDrForm');

// ✅ Open modal safely
if (openUploadDrModalBtn && uploadDrModal) {
  openUploadDrModalBtn.addEventListener('click', () => {
    uploadDrModal.style.display = 'flex';
  });
}

// ✅ Close modal safely
if (closeUploadDrModal && uploadDrModal && uploadDrForm) {
  closeUploadDrModal.addEventListener('click', () => {
    uploadDrModal.style.display = 'none';
    uploadDrForm.reset();
  });
}

// ✅ Close when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === uploadDrModal) {
    uploadDrModal.style.display = 'none';
    if (uploadDrForm) uploadDrForm.reset();
  }
});

// ✅ Handle form submission safely
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
        uploadDrModal.style.display = 'none';
        uploadDrForm.reset();
        
        // Reload the current project if one is selected
        const selectedPo = document.getElementById('projectPo')?.textContent.trim();
        if (selectedPo) {
          displayProjectDetails(selectedPo);
        }
      } else {
        alert("❌ Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ An error occurred while uploading the D.R.");
    }
  });
}

function openUploadDrModal() {
  const uploadDrModal = document.getElementById('uploadDrModal');
  if (uploadDrModal) {
    uploadDrModal.style.display = 'flex';
  }
}