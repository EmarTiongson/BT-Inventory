// Theme toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const moonIcon = document.getElementById("moonIcon");
const sunIcon = document.getElementById("sunIcon");
const themeText = document.getElementById("themeText");

function setTheme(mode) {
  if (mode === "dark") {
    body.classList.add("dark-mode");
    moonIcon.classList.add("hidden");
    sunIcon.classList.remove("hidden");
    themeText.textContent = "Light Mode";
  } else {
    body.classList.remove("dark-mode");
    moonIcon.classList.remove("hidden");
    sunIcon.classList.add("hidden");
    themeText.textContent = "Dark Mode";
  }
}

if (localStorage.getItem("theme")) {
  setTheme(localStorage.getItem("theme"));
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setTheme("dark");
}

themeToggle.addEventListener("click", () => {
  const mode = body.classList.contains("dark-mode") ? "light" : "dark";
  setTheme(mode);
  localStorage.setItem("theme", mode);
});
