/**
 * ===================================
 * ADMIN BOOKINGS JS
 * JavaScript cho trang Quản lý Đặt phòng
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    checkAdminAuth();
    loadBookings();
    initFilters();
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
    const counters = document.querySelectorAll('[id$="Bookings"]');
    counters.forEach(counter => {
        if (counter.textContent !== '0') {
            animateCounter(counter, parseInt(counter.textContent));
        }
    });
}

function animateCounter(element, target) {
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
 * Load bookings data
 */
async function loadBookings() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/bookings');
        // const data = await response.json();
        
        // Mock data for now
        const mockBookings = [
            {
                id: 'BK001',
                userName: 'Nguyễn Văn A',
                userEmail: 'nguyenvana@gmail.com',
                propertyName: 'Phòng trọ Q.1 - Gần ĐH Khoa học Tự nhiên',
                bookingDate: '2025-10-20',
                checkIn: '2025-11-01',
                checkOut: '2025-11-30',
                totalPrice: 3500000,
                status: 'pending'
            },
            {
                id: 'BK002',
                userName: 'Trần Thị B',
                userEmail: 'tranthib@gmail.com',
                propertyName: 'Căn hộ Tân Bình - Full nội thất',
                bookingDate: '2025-10-18',
                checkIn: '2025-11-05',
                checkOut: '2025-12-05',
                totalPrice: 5000000,
                status: 'confirmed'
            },
            {
                id: 'BK003',
                userName: 'Lê Văn C',
                userEmail: 'levanc@gmail.com',
                propertyName: 'Nhà nguyên căn Thủ Đức',
                bookingDate: '2025-10-15',
                checkIn: '2025-10-25',
                checkOut: '2025-11-25',
                totalPrice: 12000000,
                status: 'cancelled'
            },
            {
                id: 'BK004',
                userName: 'Phạm Thị D',
                userEmail: 'phamthid@gmail.com',
                propertyName: 'Phòng Q.3 - Gần chợ Tân Định',
                bookingDate: '2025-10-22',
                checkIn: '2025-11-10',
                checkOut: '2025-12-10',
                totalPrice: 4000000,
                status: 'confirmed'
            },
            {
                id: 'BK005',
                userName: 'Hoàng Văn E',
                userEmail: 'hoangvane@gmail.com',
                propertyName: 'Studio Q.7 - View sông',
                bookingDate: '2025-10-25',
                checkIn: '2025-11-15',
                checkOut: '2025-12-15',
                totalPrice: 6500000,
                status: 'pending'
            }
        ];

        renderBookings(mockBookings);
        updateStats(mockBookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

/**
 * Render bookings table
 */
function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (!tbody) return;

    tbody.innerHTML = bookings.map(booking => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">${booking.id}</td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${booking.userName}</div>
                <div class="text-sm text-gray-500">${booking.userEmail}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">${booking.propertyName}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${formatDate(booking.bookingDate)}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${formatDate(booking.checkIn)}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${formatDate(booking.checkOut)}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">${formatPrice(booking.totalPrice)}</td>
            <td class="px-6 py-4">
                ${getStatusBadge(booking.status)}
            </td>
            <td class="px-6 py-4 text-sm">
                <div class="flex items-center space-x-2">
                    <button onclick="viewBooking('${booking.id}')" class="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${booking.status === 'pending' ? `
                        <button onclick="approveBooking('${booking.id}')" class="text-green-600 hover:text-green-800" title="Duyệt">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectBooking('${booking.id}')" class="text-red-600 hover:text-red-800" title="Từ chối">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update statistics
 */
function updateStats(bookings) {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;

    document.getElementById('totalBookings').textContent = total;
    document.getElementById('pendingBookings').textContent = pending;
    document.getElementById('confirmedBookings').textContent = confirmed;
    document.getElementById('cancelledBookings').textContent = cancelled;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Chờ duyệt</span>',
        'confirmed': '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Đã xác nhận</span>',
        'cancelled': '<span class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full">Đã hủy</span>',
        'completed': '<span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Hoàn thành</span>'
    };
    
    return badges[status] || status;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

/**
 * Format price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

/**
 * Initialize filters
 */
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterBookings);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterBookings);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterBookings);
    }
}

/**
 * Filter bookings
 */
function filterBookings() {
    // TODO: Implement filtering logic
    console.log('Filtering bookings...');
}

/**
 * View booking details
 */
function viewBooking(bookingId) {
    // TODO: Show modal with booking details
    alert(`Xem chi tiết đặt phòng: ${bookingId}`);
}

/**
 * Approve booking
 */
function approveBooking(bookingId) {
    if (confirm(`Bạn có chắc muốn duyệt đặt phòng ${bookingId}?`)) {
        // TODO: Call API to approve booking
        alert(`Đã duyệt đặt phòng: ${bookingId}`);
        loadBookings();
    }
}

/**
 * Reject booking
 */
function rejectBooking(bookingId) {
    if (confirm(`Bạn có chắc muốn từ chối đặt phòng ${bookingId}?`)) {
        // TODO: Call API to reject booking
        alert(`Đã từ chối đặt phòng: ${bookingId}`);
        loadBookings();
    }
}

/**
 * Close booking modal
 */
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
