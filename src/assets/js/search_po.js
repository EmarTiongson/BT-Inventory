document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("poSearchInput");
  const tableBody = document.getElementById("poTableBody");
  let timer = null;

  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const query = searchInput.value.trim();

      fetch(`/ajax/search-po/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          tableBody.innerHTML = data.html;
        })
        .catch(error => console.error('Error fetching data:', error));
    }, 300); // 300ms debounce
  });
});