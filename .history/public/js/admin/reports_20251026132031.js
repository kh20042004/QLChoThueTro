/**
 * ===================================
 * ADMIN REPORTS JS
 * JavaScript cho trang Báo cáo & Thống kê
 * ===================================
 */

let revenueChart, bookingsChart, userGrowthChart, propertyTypesChart;

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    checkAdminAuth();
    loadReportData();
    initCharts();
    initCounterAnimation();
});

/**
 * Kiểm tra quyền admin
 */
function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    
    if (!userData) {
        window.location.href = '/auth/login';
        return;
    }

    const user = JSON.parse(userData);
    
    if (user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '/';
        return;
    }
}

/**
 * Khởi tạo sidebar toggle
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('-left-64');
            sidebar.classList.toggle('left-0');
        });
    }
}

/**
 * Khởi tạo counter animation
 */
function initCounterAnimation() {
    setTimeout(() => {
        animateCounter(document.getElementById('newUsers'), 142);
        animateCounter(document.getElementById('totalBookings'), 89);
        animateCounter(document.getElementById('newProperties'), 37);
    }, 500);
}

function animateCounter(element, target) {
    if (!element) return;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}

/**
 * Load report data
 */
async function loadReportData() {
    try {
        // TODO: Replace with actual API calls
        // Mock data for now
        updateOverviewStats();
        loadTopProperties();
        loadTopUsers();
    } catch (error) {
        console.error('Error loading report data:', error);
    }
}

/**
 * Update overview statistics
 */
function updateOverviewStats() {
    const totalRevenue = 450000000;
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
}

/**
 * Initialize all charts
 */
function initCharts() {
    initRevenueChart();
    initBookingsChart();
    initUserGrowthChart();
    initPropertyTypesChart();
}

/**
 * Revenue Chart - Line Chart
 */
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Hủy chart cũ nếu tồn tại
    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            datasets: [{
                label: 'Doanh thu (triệu VNĐ)',
                data: [350, 380, 420, 390, 450, 480, 510, 490, 530, 560, 520, 580],
                borderColor: 'rgb(255, 0, 100)',
                backgroundColor: 'rgba(255, 0, 100, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Bookings Chart - Doughnut Chart
 */
function initBookingsChart() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;

    bookingsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chờ duyệt', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy'],
            datasets: [{
                data: [15, 45, 30, 10],
                backgroundColor: [
                    'rgb(234, 179, 8)',
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * User Growth Chart - Bar Chart
 */
function initUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;

    userGrowthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            datasets: [{
                label: 'Người dùng mới',
                data: [85, 92, 105, 98, 115, 128, 142, 135, 150, 165, 158, 175],
                backgroundColor: 'rgba(255, 107, 53, 0.8)',
                borderColor: 'rgb(255, 107, 53)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Property Types Chart - Pie Chart
 */
function initPropertyTypesChart() {
    const ctx = document.getElementById('propertyTypesChart');
    if (!ctx) return;

    propertyTypesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Phòng trọ', 'Căn hộ', 'Nhà nguyên căn', 'Studio', 'Ký túc xá'],
            datasets: [{
                data: [40, 25, 20, 10, 5],
                backgroundColor: [
                    'rgb(255, 0, 100)',
                    'rgb(255, 107, 53)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)',
                    'rgb(168, 85, 247)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Load top properties
 */
function loadTopProperties() {
    const mockData = [
        { rank: 1, name: 'Phòng trọ Q.1 - Gần ĐH KH Tự nhiên', landlord: 'Nguyễn Văn A', bookings: 45, revenue: 157500000, rating: 4.8 },
        { rank: 2, name: 'Căn hộ Tân Bình - Full nội thất', landlord: 'Trần Thị B', bookings: 38, revenue: 190000000, rating: 4.7 },
        { rank: 3, name: 'Studio Q.7 - View sông', landlord: 'Lê Văn C', bookings: 32, revenue: 208000000, rating: 4.9 },
        { rank: 4, name: 'Nhà nguyên căn Thủ Đức', landlord: 'Phạm Thị D', bookings: 28, revenue: 336000000, rating: 4.6 },
        { rank: 5, name: 'Phòng Q.3 - Gần chợ Tân Định', landlord: 'Hoàng Văn E', bookings: 25, revenue: 100000000, rating: 4.5 },
        { rank: 6, name: 'Căn hộ Q.2 - An ninh 24/7', landlord: 'Võ Thị F', bookings: 22, revenue: 132000000, rating: 4.7 },
        { rank: 7, name: 'Phòng Q.10 - Gần BX Miền Tây', landlord: 'Đặng Văn G', bookings: 20, revenue: 70000000, rating: 4.4 },
        { rank: 8, name: 'Studio Q.Bình Thạnh - Có ban công', landlord: 'Bùi Thị H', bookings: 18, revenue: 99000000, rating: 4.6 },
        { rank: 9, name: 'Nhà trọ Q.Gò Vấp - Giá rẻ', landlord: 'Phan Văn I', bookings: 16, revenue: 48000000, rating: 4.3 },
        { rank: 10, name: 'Căn hộ Q.Phú Nhuận - Trung tâm', landlord: 'Lý Thị K', bookings: 15, revenue: 82500000, rating: 4.5 }
    ];

    const tbody = document.getElementById('topPropertiesTable');
    if (!tbody) return;

    tbody.innerHTML = mockData.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.rank}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.name}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${item.landlord}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${item.bookings}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${formatPrice(item.revenue)}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex items-center">
                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                    <span class="font-medium text-gray-900">${item.rating}</span>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Load top users
 */
function loadTopUsers() {
    const mockData = [
        { rank: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', properties: 12, bookings: 156, revenue: 545000000, rating: 4.7 },
        { rank: 2, name: 'Trần Thị B', email: 'tranthib@gmail.com', properties: 8, bookings: 124, revenue: 432000000, rating: 4.6 },
        { rank: 3, name: 'Lê Văn C', email: 'levanc@gmail.com', properties: 10, bookings: 118, revenue: 398000000, rating: 4.8 },
        { rank: 4, name: 'Phạm Thị D', email: 'phamthid@gmail.com', properties: 6, bookings: 98, revenue: 356000000, rating: 4.5 },
        { rank: 5, name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', properties: 7, bookings: 89, revenue: 312000000, rating: 4.6 },
        { rank: 6, name: 'Võ Thị F', email: 'vothif@gmail.com', properties: 5, bookings: 76, revenue: 287000000, rating: 4.7 },
        { rank: 7, name: 'Đặng Văn G', email: 'dangvang@gmail.com', properties: 9, bookings: 72, revenue: 245000000, rating: 4.4 },
        { rank: 8, name: 'Bùi Thị H', email: 'buithih@gmail.com', properties: 4, bookings: 65, revenue: 198000000, rating: 4.5 },
        { rank: 9, name: 'Phan Văn I', email: 'phanvani@gmail.com', properties: 6, bookings: 58, revenue: 176000000, rating: 4.3 },
        { rank: 10, name: 'Lý Thị K', email: 'lythik@gmail.com', properties: 3, bookings: 52, revenue: 165000000, rating: 4.6 }
    ];

    const tbody = document.getElementById('topUsersTable');
    if (!tbody) return;

    tbody.innerHTML = mockData.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.rank}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.name}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${item.email}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.properties}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${item.bookings}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${formatPrice(item.revenue)}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex items-center">
                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                    <span class="font-medium text-gray-900">${item.rating}</span>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Format price
 */
function formatPrice(price) {
    if (price >= 1000000000) {
        return (price / 1000000000).toFixed(1) + ' tỷ';
    } else if (price >= 1000000) {
        return (price / 1000000).toFixed(0) + ' triệu';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

/**
 * Set time range
 */
function setTimeRange(range) {
    // Update active button
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('bg-pink-500', 'text-white');
        btn.classList.add('border', 'border-gray-300');
    });
    
    event.target.classList.add('bg-pink-500', 'text-white');
    event.target.classList.remove('border', 'border-gray-300');

    // TODO: Load data for selected time range
    console.log('Loading data for:', range);
}

/**
 * Apply custom date range
 */
function applyCustomRange() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    if (!fromDate || !toDate) {
        alert('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!');
        return;
    }

    // TODO: Load data for custom date range
    console.log('Loading data from', fromDate, 'to', toDate);
}

/**
 * Export report
 */
function exportReport() {
    // TODO: Implement export functionality (PDF/Excel)
    alert('Xuất báo cáo... (Tính năng đang phát triển)');
}
