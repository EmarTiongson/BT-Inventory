/* base.js
   Purpose: global UI behavior for base.html
   - sidebar collapse/expand (persisted)
   - dark-mode toggle (persisted)
   - active nav highlighting
   - RESPONSIVE MOBILE TOGGLE
*/

document.addEventListener('DOMContentLoaded', function () {
  
  // Elements (IDs must match base.html)
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const themeToggle = document.getElementById('themeToggle');     
  const darkModeIcon = document.getElementById('darkModeIcon');   
  
  // Responsive Sidebar Elements
  const desktopToggleBtn = document.getElementById('desktopSidebarToggle'); 
  const mobileToggleBtn = document.getElementById('mobileSidebarToggle');    
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  /* --------------------------------------------- */
  /* ---------- Sidebar Collapse Persistence (Desktop Logic) ---------- */
  /* --------------------------------------------- */
  try {
    const collapsedKey = 'brite_sidebar_collapsed';
    const collapsedStored = localStorage.getItem(collapsedKey);

    // Apply persistence state only on desktop view
    if (window.innerWidth > 900 && collapsedStored === 'true') {
      sidebar.classList.add('collapsed');
      // Apply body class for robust margin control
      document.body.classList.add('sidebar-is-collapsed'); 
    }

    if (desktopToggleBtn) { // This is the desktop collapse button
      desktopToggleBtn.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-is-collapsed', collapsed);
        
        localStorage.setItem(collapsedKey, collapsed ? 'true' : 'false');
      });

      // keyboard accessible
      desktopToggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); desktopToggleBtn.click(); }
      });
    }
  } catch (err) {
    console.warn('Sidebar persistence failed:', err);
  }

  /* --------------------------------------------- */
  /* ---------- Mobile Sidebar Toggle Logic ---------- */
  /* --------------------------------------------- */
  
  // Open sidebar on mobile toggle click
  if (mobileToggleBtn && sidebar && sidebarOverlay) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });
  }

  // Close sidebar on overlay click
  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Close sidebar when resizing from mobile to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    }
  });


  /* --------------------------------------------- */
  /* ---------- Theme Persistence + Toggle ---------- */
  /* --------------------------------------------- */
  try {
    const themeKey = 'brite_theme';
    const saved = localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = (saved === 'dark') || (saved === null && prefersDark);

    function setDarkMode(isDark) {
      if (isDark) {
        // Dark mode
        document.body.classList.add('dark-mode');
        if (darkModeIcon) {
          darkModeIcon.classList.remove('bi-moon-fill');
          darkModeIcon.classList.add('bi-sun-fill');
        }
        if (themeToggle) themeToggle.setAttribute('aria-pressed', 'true');
        localStorage.setItem(themeKey, 'dark');
      } else {
        // Light mode
        document.body.classList.remove('dark-mode');
        if (darkModeIcon) {
          darkModeIcon.classList.remove('bi-sun-fill');
          darkModeIcon.classList.add('bi-moon-fill');
        }
        if (themeToggle) themeToggle.setAttribute('aria-pressed', 'false');
        localStorage.setItem(themeKey, 'light');
      }
    }

    // Set initial theme
    setDarkMode(initialDark);

    // Toggle theme on button click
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-mode');
        setDarkMode(isDark);
      });
    }
  } catch (err) {
    console.warn('Theme toggle failed:', err);
  }

  /* --------------------------------------------- */
  /* ---------- Active Nav Highlighting ---------- */
  /* --------------------------------------------- */
  try {
    const navItems = Array.from(document.querySelectorAll('.sidebar .nav-item'));
    const current = window.location.pathname;
    navItems.forEach(a => {
      // rely on href for anchor tags, or data-path attribute if button/form
      try {
        const link = a.getAttribute('href') || a.dataset.path;
        if (!link) return;
        // Normalize: remove trailing slash for compare
        const normLink = link.replace(/\/+$/, '');
        const normCurrent = current.replace(/\/+$/, '');
        if (normLink && (normLink === normCurrent || normLink === current || link === window.location.pathname)) {
          a.classList.add('active');
        }
      } catch (e) {}
    });
  } catch (err) {
    console.warn('Active nav failed:', err);
  }
});
