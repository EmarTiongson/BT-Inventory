// Store billing data for navigation
let currentBillingIndex = 0;
let billingData = [];

// Filter projects in the dropdown
function filterProjects() {
  const input = document.getElementById('projectSearchInput');
  const filter = input.value.toUpperCase();
  const ul = document.getElementById('projectList');
  const li = ul.getElementsByTagName('li');

  // Show dropdown when typing
  if (filter.length > 0) {
    ul.style.display = 'block';
  }

  // Loop through all list items and hide those that don't match
  for (let i = 0; i < li.length; i++) {
    const txtValue = li[i].textContent || li[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = '';
    } else {
      li[i].style.display = 'none';
    }
  }
}

// Show all projects when clicking on input
function showAllProjects() {
  const ul = document.getElementById('projectList');
  const li = ul.getElementsByTagName('li');
  
  // Show all items
  for (let i = 0; i < li.length; i++) {
    li[i].style.display = '';
  }
  
  ul.style.display = 'block';
}

// Hide dropdown when clicking outside
document.addEventListener('click', function(event) {
  const searchContainer = document.querySelector('.dropdown-search');
  const input = document.getElementById('projectSearchInput');
  const ul = document.getElementById('projectList');
  
  if (!searchContainer.contains(event.target)) {
    ul.style.display = 'none';
  }
});

// Select a project and display its details
function selectProject(projectName) {
  const input = document.getElementById('projectSearchInput');
  const ul = document.getElementById('projectList');
  const detailsContainer = document.getElementById('projectDetailsContainer');
  
  // Set the input value to the selected project
  input.value = projectName;
  
  // Hide the dropdown
  ul.style.display = 'none';
  
  // Show the project details container
  detailsContainer.style.display = 'block';
  
  // Update project title (you can fetch actual data from your backend here)
  const projectTitle = projectName.substring(projectName.indexOf(' ') + 1);
  document.getElementById('projectTitle').textContent = projectTitle;
  
  // Initialize billing data for this project
  initializeBillingData();
  
  // Scroll to the details section
  detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize billing data from the cards
function initializeBillingData() {
  billingData = [
    {
      bsNumber: '4670',
      type: 'DOWN PAYMENT',
      typeClass: 'down-payment',
      bsDate: '5/25/2023',
      aging: '6/24/2023',
      billedAmount: '₱49,370.15',
      status: true,
      projectTitle: '4120100131 PHC PLANT 1 CCTV VIEWING (CANTEEN...)',
      projectShortTitle: 'PHC PLANT 1 CCTV VIEWING (...',
      projectPo: '4120100135'
    },
    {
      bsNumber: '4823',
      type: 'PROGRESS BILLING 1',
      typeClass: 'progress-billing',
      bsDate: '10/23/2023',
      aging: '11/22/2023',
      billedAmount: '₱49,370.15',
      status: true,
      projectTitle: '4120100131 PHC PLANT 1 CCTV VIEWING (CANTEEN...)',
      projectShortTitle: 'PHC PLANT 1 CCTV VIEWING (...',
      projectPo: '4120100135'
    },
    {
      bsNumber: '2622',
      type: 'RETENTION',
      typeClass: 'retention',
      bsDate: '5/14/2024',
      aging: '6/13/2024',
      billedAmount: '₱49,370.15',
      status: true,
      projectTitle: '4120100131 PHC PLANT 1 CCTV VIEWING (CANTEEN...)',
      projectShortTitle: 'PHC PLANT 1 CCTV VIEWING (...',
      projectPo: '4120100135'
    },
    {
      bsNumber: '4849',
      type: 'FULL PAYMENT',
      typeClass: 'full-payment',
      bsDate: '11/22/2023',
      aging: '12/22/2023',
      billedAmount: '₱49,370.15',
      status: true,
      projectTitle: '4120100131 PHC PLANT 1 CCTV VIEWING (CANTEEN...)',
      projectShortTitle: 'PHC PLANT 1 CCTV VIEWING (...',
      projectPo: '4120100135'
    }
  ];
}

// Open billing modal
function openBillingModal(bsNumber, type, bsDate, aging, billedAmount, status, projectTitle, projectShortTitle, projectPo) {
  // Find the index of this billing in the data array
  currentBillingIndex = billingData.findIndex(b => b.bsNumber === bsNumber);
  
  // Update modal content
  updateModalContent(currentBillingIndex);
  
  // Show modal
  const modal = document.getElementById('billingModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Update modal content
function updateModalContent(index) {
  if (index < 0 || index >= billingData.length) return;
  
  const billing = billingData[index];
  
  document.getElementById('modalBsNumber').textContent = billing.bsNumber;
  document.getElementById('modalBsNumberValue').textContent = billing.bsNumber;
  document.getElementById('modalProjectTitle').textContent = billing.projectTitle;
  document.getElementById('modalProjectShortTitle').textContent = billing.projectShortTitle;
  document.getElementById('modalProjectPo').textContent = billing.projectPo;
  document.getElementById('modalBsDate').textContent = billing.bsDate;
  document.getElementById('modalAging').textContent = billing.aging;
  document.getElementById('modalBilledAmount').textContent = billing.billedAmount;
  
  // Update status
  const statusElement = document.getElementById('modalStatus');
  statusElement.textContent = billing.status ? '✓' : '';
  
  // Update billing type
  const billingTypeElement = document.getElementById('modalBillingType');
  billingTypeElement.textContent = billing.type;
  billingTypeElement.className = 'billing-type ' + billing.typeClass;
}

// Close billing modal
function closeBillingModal() {
  const modal = document.getElementById('billingModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

// Navigate to previous billing
function previousBilling() {
  if (currentBillingIndex > 0) {
    currentBillingIndex--;
    updateModalContent(currentBillingIndex);
  }
}

// Navigate to next billing
function nextBilling() {
  if (currentBillingIndex < billingData.length - 1) {
    currentBillingIndex++;
    updateModalContent(currentBillingIndex);
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const modal = document.getElementById('billingModal');
  if (event.target === modal) {
    closeBillingModal();
  }
});

// Close modal with ESC key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeBillingModal();
  }
});

// Example function to dynamically load billing data (you can connect this to your Django backend)
function loadBillingData(billingArray) {
  billingData = billingArray;
  const billingList = document.getElementById('billingList');
  billingList.innerHTML = '';
  
  billingArray.forEach((billing, index) => {
    const card = document.createElement('div');
    card.className = 'billing-card' + (billing.unnamed ? ' unnamed' : '');
    card.onclick = function() {
      currentBillingIndex = index;
      updateModalContent(index);
      const modal = document.getElementById('billingModal');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    
    card.innerHTML = `
      <div class="billing-number">${billing.bsNumber}</div>
      <div class="billing-details">
        <div class="billing-row">
          <span class="billing-label">STATUS</span>
          <span class="billing-label">TYPE OF BILLING</span>
          <span class="billing-label">BS DATE</span>
          <span class="billing-label">AGING</span>
        </div>
        <div class="billing-row">
          <span class="status-icon">${billing.status ? '✓' : ''}</span>
          <span class="billing-type ${billing.typeClass}">${billing.type}</span>
          <span>${billing.bsDate}</span>
          <span ${billing.aging === '#ERROR' ? 'class="error-text"' : ''}>${billing.aging}</span>
        </div>
      </div>
    `;
    
    billingList.appendChild(card);
  });
}