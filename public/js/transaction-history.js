/* ===================================
   TRANSACTION-HISTORY.JS - Lịch sử giao dịch
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
    loadTransactionHistory();
});

function initFilterListeners() {
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    // Find search button
    const buttons = document.querySelectorAll('button');
    const searchButton = Array.from(buttons).find(btn => btn.textContent.includes('Tìm kiếm'));
    
    if (searchButton) {
        searchButton.addEventListener('click', loadTransactionHistory);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', loadTransactionHistory);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', loadTransactionHistory);
    }
}

function loadTransactionHistory() {
    const typeValue = document.getElementById('typeFilter')?.value || '';
    const statusValue = document.getElementById('statusFilter')?.value || '';
    const dateValue = document.getElementById('dateFilter')?.value || '';

    // TODO: Fetch từ API khi backend sẵn sàng
    console.log('Loading transaction history:', { typeValue, statusValue, dateValue });
}
