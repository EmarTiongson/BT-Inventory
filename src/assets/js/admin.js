document.addEventListener('DOMContentLoaded', function () {
    const userTableBody = document.getElementById('userTableBody');
    if (!userTableBody) return;

    const deleteButtons = document.querySelectorAll('.delete-btn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const deleteMessage = document.getElementById('deleteMessage');
    const searchInput = document.getElementById('searchInput');

    let currentUserId = null;

    // ===========================
    // SEARCH FUNCTIONALITY
    // ===========================
    function searchUser() {
        const filter = searchInput.value.toLowerCase().trim();
        const rows = userTableBody.getElementsByTagName('tr');
        let visibleCount = 0;

        for (let row of rows) {
            if (row.querySelector('.no-data') || row.classList.contains('no-results-row')) continue;
            const cells = row.getElementsByTagName('td');
            const searchableIndices = [1,2,3,4,5,6];
            let found = false;

            for (let index of searchableIndices) {
                if (cells[index] && cells[index].textContent.toLowerCase().includes(filter)) {
                    found = true;
                    break;
                }
            }

            row.style.display = (found || filter === '') ? '' : 'none';
            if (found) visibleCount++;
        }

        const noResultsRow = userTableBody.querySelector('.no-results-row');
        if (visibleCount === 0 && filter !== '') {
            if (!noResultsRow) {
                const newRow = document.createElement('tr');
                newRow.className = 'no-results-row';
                newRow.innerHTML = '<td colspan="8" class="no-data">No matching users found.</td>';
                userTableBody.appendChild(newRow);
            }
        } else if (noResultsRow) noResultsRow.remove();
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', searchUser);
        searchInput.addEventListener('input', searchUser);
        searchInput.addEventListener('search', searchUser);
    }

    // ===========================
    // DELETE MODAL
    // ===========================
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            currentUserId = this.dataset.userId;
            const userName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            deleteMessage.textContent = `Are you sure you want to delete ${userName}?`;
            deleteModal.style.display = 'flex';
        });
    });

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => deleteModal.style.display='none');

    if (deleteModal) deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) deleteModal.style.display='none';
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (!currentUserId) return;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';

            fetch(`/accounts/delete-user/${currentUserId}/`, {
                method: 'DELETE',
                headers: {'X-CSRFToken': getCookie('csrftoken'), 'Content-Type':'application/json'},
                credentials: 'same-origin'
            })
            .then(res => res.ok ? res.json() : res.json().then(data => {throw new Error(data.error || 'Failed');}))
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`#user-row-${currentUserId}`);
                    if (row) { row.style.opacity='0'; setTimeout(()=>row.remove(),300);}
                    deleteModal.style.display='none';
                    showNotification('User deleted successfully','success');
                } else throw new Error(data.error || 'Failed');
            })
            .catch(err => { console.error(err); showNotification('Error: '+err.message,'error'); deleteModal.style.display='none'; })
            .finally(() => { confirmDeleteBtn.disabled=false; confirmDeleteBtn.textContent='Yes, delete'; currentUserId=null; });
        });
    }

    function getCookie(name){
        let cookieValue=null;
        if (document.cookie && document.cookie!=='') {
            document.cookie.split(';').forEach(cookie=>{
                if(cookie.trim().startsWith(name+'=')) cookieValue=decodeURIComponent(cookie.trim().substring(name.length+1));
            });
        }
        return cookieValue;
    }

    function showNotification(message,type){
        const notification=document.createElement('div');
        notification.className=`notification ${type}`;
        notification.textContent=message;
        document.body.appendChild(notification);
        setTimeout(()=>notification.classList.add('show'),10);
        setTimeout(()=>{ notification.classList.remove('show'); setTimeout(()=>notification.remove(),300); },3000);
    }
});
