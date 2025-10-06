// dark.js - dark mode toggling + persistence
(function () {
  const themeToggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  const icon = document.getElementById('darkModeIcon');
  const STORAGE_KEY = 'theme'; // values: 'dark' or 'light'

  function applyTheme(theme) {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if (icon) icon.className = 'bi bi-sun-fill';
      if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      body.classList.remove('dark-mode');
      if (icon) icon.className = 'bi bi-moon-fill';
      if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Load saved preference or system preference
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  }

  // Toggle and persist
  function toggleTheme() {
    const isDark = body.classList.contains('dark-mode');
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // Hook events
  window.addEventListener('DOMContentLoaded', initTheme);
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  // expose for debugging if needed
  window.setTheme = applyTheme;
})();
