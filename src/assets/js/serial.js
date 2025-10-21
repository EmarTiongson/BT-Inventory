document.addEventListener("DOMContentLoaded", () => {
  const allDropdowns = document.querySelectorAll(".serials-list-container");

  // === EXISTING SERIAL DROPDOWN LOGIC ===
  window.toggleSerials = function (id) {
    const dropdown = document.getElementById(`serials-${id}`);

    if (dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
      return;
    }

    // Close all open dropdowns
    allDropdowns.forEach(el => el.classList.remove("show"));

    // Open the selected one
    dropdown.classList.add("show");
  };

  window.filterSerials = function (id) {
    const input = document.querySelector(`#serials-${id} .serial-search`);
    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll(`#serials-${id} .serials-list li`);
    items.forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
  };

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".serials-wrapper");
    if (!inside) {
      allDropdowns.forEach(el => el.classList.remove("show"));
    }
  });

  // === MODAL SERIAL MANAGEMENT ===
  const serialModal = document.getElementById("serialModal");
  const serialInput = document.getElementById("serialInput");
  const serialList = document.getElementById("serialList");
  const serialSearch = document.getElementById("serialSearch");

  window.openSerialModal = function (id) {
    serialModal.classList.add("show");
  };

  window.closeSerialModal = function () {
    serialModal.classList.remove("show");
  };

  // Add serial + numbering
  window.addSerial = function () {
    const value = serialInput.value.trim();
    if (value === "") return;

    const li = document.createElement("li");
    const index = serialList.children.len
