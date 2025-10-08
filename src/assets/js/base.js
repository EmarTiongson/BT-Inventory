/* base.js
   Purpose: global UI behavior for base.html
   - sidebar collapse/expand (persisted)
   - dark-mode toggle (persisted)
   - active nav highlighting
   - optional typing greeting (reads data-username attr)
*/

document.addEventListener('DOMContentLoaded', function () {
  // Elements (IDs must match base.html)
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle'); // toggle button inside sidebar
  const themeToggle = document.getElementById('themeToggle');     // button in header
  const darkModeIcon = document.getElementById('darkModeIcon');   // icon inside toggle
  const mainContent = document.querySelector('.main-content');

  /* ---------- Sidebar persistence ---------- */
  try {
    const collapsedKey = 'brite_sidebar_collapsed';
    const collapsedStored = localStorage.getItem(collapsedKey);
    if (collapsedStored === 'true') {
      sidebar.classList.add('collapsed');
      if (mainContent) mainContent.classList.add('collapsed');
    }

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('collapsed');
        localStorage.setItem(collapsedKey, collapsed ? 'true' : 'false');
      });

      // keyboard accessible
      sidebarToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sidebarToggle.click(); }
      });
    }
  } catch (err) {
    console.warn('Sidebar persistence failed:', err);
  }

  /* ---------- Theme persistence + toggle ---------- */
  try {
    const themeKey = 'brite_theme';
    const saved = localStorage.getItem(themeKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = (saved === 'dark') || (saved === null && prefersDark);

    function setDarkMode(isDark) {
      if (isDark) {
        // Dark mode: dark background, dark sidebar
        document.body.classList.add('dark-mode');
        if (darkModeIcon) {
          darkModeIcon.classList.remove('bi-moon-fill');
          darkModeIcon.classList.add('bi-sun-fill');
          darkModeIcon.style.color = 'white';
        }
        if (themeToggle) themeToggle.setAttribute('aria-pressed', 'true');
        localStorage.setItem(themeKey, 'dark');
      } else {
        // Light mode: light background, light grey sidebar
        document.body.classList.remove('dark-mode');
        if (darkModeIcon) {
          darkModeIcon.classList.remove('bi-sun-fill');
          darkModeIcon.classList.add('bi-moon-fill');
          darkModeIcon.style.color = '';
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

  /* ---------- Active nav highlighting ---------- */
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