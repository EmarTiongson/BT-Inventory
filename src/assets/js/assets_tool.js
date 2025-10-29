/* ==========================================================
 * ASSETS & TOOLS PAGE SCRIPT
 * Based on inventory.js
 * ========================================================== */

// ===========================
// SEARCH FUNCTIONALITY
// ===========================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#assetsToolsTableBody tr");

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  });
}

// ===========================
// IMAGE LIGHTBOX
// ===========================
function showImagePopup(imageUrl) {
  const overlay = document.getElementById("imageLightboxOverlay");
  const image = document.getElementById("imageLightboxImg");

  if (overlay && image) {
    image.src = imageUrl;
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }
}

function closeImagePopup() {
  const overlay = document.getElementById("imageLightboxOverlay");
  if (overlay) {
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("imageLightboxClose");
  if (closeBtn) closeBtn.addEventListener("click", closeImagePopup);

  // Close when clicking outside the image
  const overlay = document.getElementById("imageLightboxOverlay");
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeImagePopup();
    });
  }
});

// ===========================
// BUTTON ACTIONS (Optional)
// ===========================
// Add any specific button behavior for assets/tools here
// Example: confirmation before delete
document.querySelectorAll(".delete-btn").forEach(button => {
  button.addEventListener("click", function () {
    const confirmDelete = confirm("Are you sure you want to delete this asset/tool?");
    if (!confirmDelete) return;
    alert("Dummy delete action — implement server-side logic later!");
  });
});

