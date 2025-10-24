/* ===================================
   MY-PROPERTIES.JS - Quản lý bài đăng
   =================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        window.location.href = '/auth/login';
        return;
    }

    // Khởi tạo
    initFilterListeners();
    loadProperties();
});

function initFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');
    const filterBtn = document.getElementById('filterBtn');

    if (filterBtn) {
        filterBtn.addEventListener('click', loadProperties);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadProperties, 300));
    }
}

function loadProperties() {
    const searchValue = document.getElementById('searchInput')?.value || '';
    const statusValue = document.getElementById('statusFilter')?.value || '';
    const sortValue = document.getElementById('sortFilter')?.value || 'newest';

    // TODO: Fetch từ API khi backend sẵn sàng
    console.log('Loading properties:', { searchValue, statusValue, sortValue });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
