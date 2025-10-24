/* ===================================
   RECHARGE-HISTORY.JS - Lịch sử nạp tiền
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
    loadRechargeHistory();
});

function initFilterListeners() {
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const searchBtn = document.querySelector('button:contains("Tìm kiếm")');

    // Find search button
    const buttons = document.querySelectorAll('button');
    const searchButton = Array.from(buttons).find(btn => btn.textContent.includes('Tìm kiếm'));
    
    if (searchButton) {
        searchButton.addEventListener('click', loadRechargeHistory);
    }
}

function loadRechargeHistory() {
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';

    // TODO: Fetch từ API khi backend sẵn sàng
    console.log('Loading recharge history:', { dateFrom, dateTo });
}
