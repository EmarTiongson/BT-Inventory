// dashboard.js - sidebar toggle and small helpers

// Sidebar toggle (collapse)
const sidebarToggleBtn = document.getElementById('sidebarToggle');
const sidebarEl = document.getElementById('sidebar');
const mainContentEl = document.getElementById('mainContent');

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('collapsed');
    mainContentEl.classList.toggle('expanded');
  });
}

// For small screens, allow opening sidebar by adding/removing .open
// (Example: you can add a button elsewhere to toggle the mobile sidebar)
function openSidebarMobile() {
  sidebarEl.classList.add('open');
}
function closeSidebarMobile() {
  sidebarEl.classList.remove('open');
}

// Expose functions if you want to call them from inline handlers (optional)
window.toggleSidebar = () => {
  sidebarEl.classList.toggle('collapsed');
  mainContentEl.classList.toggle('expanded');
};
