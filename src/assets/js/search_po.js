document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("poSearchInput");
  const tableBody = document.getElementById("poTableBody");
  const searchForm = document.getElementById("poSearchForm");

  if (!searchInput || !tableBody) {
    console.error("Missing DOM elements: poSearchInput or poTableBody.");
    return;
  }

  let debounceTimer = null;
  let controller = null; // for aborting previous fetches
  const DEBOUNCE_MS = 300;

  // helper to render "empty" / hint row
  function showHintRow() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; color: gray;">
          Type a P.O Number or DR No. above to begin searching
        </td>
      </tr>
    `;
  }

  // perform the ajax search
  function performSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = (searchInput.value || "").trim();

      // if query empty, show hint and don't request
      if (!query) {
        showHintRow();
        return;
      }

      // abort previous fetch if any
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      const signal = controller.signal;

      // add timestamp to avoid aggressive mobile caching
      const url = `/ajax/search-po/?q=${encodeURIComponent(query)}&t=${Date.now()}`;

      // optional: show simple loading row
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #64748b;">Searching...</td></tr>`;

      fetch(url, { cache: "no-store", signal })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          // server should return { html: "<tr>...</tr>" }
          if (data && data.html !== undefined) {
            tableBody.innerHTML = data.html || `<tr><td colspan="9" style="text-align:center; color: gray;">No results</td></tr>`;
          } else {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: gray;">No results</td></tr>`;
          }
        })
        .catch(err => {
          if (err.name === "AbortError") {
            // aborted: ignore
            return;
          }
          console.error("Search error:", err);
          tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: red;">Search failed</td></tr>`;
        });
    }, DEBOUNCE_MS);
  }

  // handle composition events for IME (important for Android/iOS non-Latin keyboards)
  let isComposing = false;
  searchInput.addEventListener("compositionstart", () => { isComposing = true; });
  searchInput.addEventListener("compositionend", () => { isComposing = false; performSearch(); });

  // listen to multiple events to be robust on mobile:
  searchInput.addEventListener("input", () => { if (!isComposing) performSearch(); });
  searchInput.addEventListener("keyup", (e) => { 
    // If user pressed Enter, do an immediate search
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    } else {
      if (!isComposing) performSearch();
    }
  });
  searchInput.addEventListener("change", performSearch);

  // Some mobile browsers/HTML overlays intercept taps; ensure the input receives focus on touch
  const ensureFocus = (ev) => {
    // if the input isn't focused, focus it (helps some Android/iOS cases)
    if (document.activeElement !== searchInput) {
      searchInput.focus({ preventScroll: true });
    }
  };
  // pointerdown covers mouse + touch; touchstart added for older browsers
  searchInput.addEventListener("pointerdown", ensureFocus, { passive: true });
  searchInput.addEventListener("touchstart", ensureFocus, { passive: true });

  // If you wrapped in a form, prevent default submission and call search
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      performSearch();
    });
  }

  // initial hint row
  if (!searchInput.value || !searchInput.value.trim()) {
    showHintRow();
  } else {
    // if there's an initial value, run search on load
    performSearch();
  }
});
