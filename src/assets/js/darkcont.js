document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");

  // Load saved theme preference
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    darkModeIcon.classList.remove("bi-moon-fill");
    darkModeIcon.classList.add("bi-sun-fill");
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.body.classList.remove("dark-mode");
    darkModeIcon.classList.remove("bi-sun-fill");
    darkModeIcon.classList.add("bi-moon-fill");
    themeToggle.setAttribute("aria-pressed", "false");
  }

  // Toggle theme when button clicked
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDarkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");

      if (isDarkMode) {
        darkModeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
        themeToggle.setAttribute("aria-pressed", "true");
      } else {
        darkModeIcon.classList.replace("bi-sun-fill", "bi-moon-fill");
        themeToggle.setAttribute("aria-pressed", "false");
      }
    });
  }
});
