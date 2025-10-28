document.addEventListener("DOMContentLoaded", () => {
    // Serial number toggle
    const allDropdowns = document.querySelectorAll(".serials-list-container");
    window.toggleSerials = function(id) {
        const dropdown = document.getElementById(`serials-${id}`);
        if (!dropdown) return;
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            return;
        }
        allDropdowns.forEach(el => el.classList.remove("show"));
        dropdown.classList.add("show");
    }

    window.filterSerials = function(id) {
        const input = document.querySelector(`#serials-${id} .serial-search`);
        const filter = input.value.toLowerCase();
        const items = document.querySelectorAll(`#serials-${id} .serials-list li`);
        items.forEach(li => {
            li.style.display = li.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
    }

    document.addEventListener("click", (e) => {
        const inside = e.target.closest(".serials-wrapper");
        if (!inside) allDropdowns.forEach(el => el.classList.remove("show"));
    });

 


    const btn = document.getElementById('toggleHistoryBtn');
    const undoneRows = document.querySelectorAll('.undone');

    // Hide undone rows initially
    undoneRows.forEach(el => el.style.display = 'none');

    btn.addEventListener('click', () => {
        undoneRows.forEach(el => {
            el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
        });
    });

    document.querySelectorAll('.convert-allocate').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const url = e.target.getAttribute('data-url');
      if (confirm("Convert this ALLOCATE transaction into an OUT transaction?\n\nThis will:\n- Deduct from total stock\n- Decrease allocated quantity\n- Mark serials as OUT")) {
        fetch(url, {
          method: "POST",
          headers: {
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
          }
        }).then(() => location.reload());
      }
    });
  });
});

