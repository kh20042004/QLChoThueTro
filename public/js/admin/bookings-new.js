/**
 * Admin Bookings Management  
 */

let bookings = [];
let currentPage = 1;
let totalPages = 1;
let filters = {
    status: '',
    search: '',
    date: ''
};

// Load bookings on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadBookings();
    setupEventListeners();
});

/**
 * Check Admin Auth
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
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Search
    document.getElementById('searchInput')?.addEventListener('input', debounce(function(e) {
        filters.search = e.target.value;
        currentPage = 1;
        loadBookings();
    }, 500));

    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        filters.status = e.target.value;
        currentPage = 1;
        loadBookings();
    });

    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        filters.date = e.target.value;
        currentPage = 1;
        loadBookings();
    });

    // Sidebar toggle
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
 * Load Bookings
 */
async function loadBookings() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }

        // Build query string
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });
        
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.date) params.append('date', filters.date);

        const response = await fetch(`/api/bookings/admin/all?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const result = await response.json();

        if (result.success) {
            bookings = result.data;
            totalPages = result.pagination.pages;
            
            // Update stats
            updateStats(result.stats);
            
            // Display bookings
            displayBookings(bookings);
            
            // Update pagination
            updatePagination(result.pagination);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Lỗi khi tải danh sách đặt phòng', 'error');
    }
}

/**
 * Update Stats Cards
 */
function updateStats(stats) {
    if (!stats) return;
    
    document.getElementById('totalBookings').textContent = stats.total || 0;
    document.getElementById('pendingBookings').textContent = stats.pending || 0;
    document.getElementById('confirmedBookings').textContent = stats.confirmed || 0;
    document.getElementById('cancelledBookings').textContent = stats.cancelled || 0;
}

/**
 * Display Bookings in Table
 */
function displayBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (!tbody) return;
    
    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
                    <p>Không có đặt phòng nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(booking => {
        const statusConfig = getStatusConfig(booking.status);
        const propertyTitle = booking.property?.title || 'Đã xóa';
        const userName = booking.name || booking.tenant?.name || 'N/A';
        const userEmail = booking.tenant?.email || 'N/A';
        const viewingDate = new Date(booking.viewingDate).toLocaleDateString('vi-VN');
        const startDate = booking.startDate ? new Date(booking.startDate).toLocaleDateString('vi-VN') : '-';
        const endDate = booking.endDate ? new Date(booking.endDate).toLocaleDateString('vi-VN') : '-';
        const totalAmount = booking.monthlyRent ? `${(booking.monthlyRent / 1000000).toFixed(1)}tr` : '-';
        const avatarUrl = booking.tenant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff`;

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <span class="text-xs font-mono text-gray-600">#${booking._id.slice(-6)}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${avatarUrl}" 
                             alt="${userName}" 
                             class="w-8 h-8 rounded-full mr-3 object-cover">
                        <div>
                            <div class="font-medium text-gray-900">${userName}</div>
                            <div class="text-xs text-gray-500">${booking.phone || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">${propertyTitle}</div>
                    <div class="text-xs text-gray-500">${booking.property?.address?.district || ''}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${viewingDate}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${startDate}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${endDate}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${totalAmount}</td>
                <td class="px-6 py-4">
                    <select class="text-xs px-3 py-1 rounded-full font-medium ${statusConfig.bgClass} ${statusConfig.textClass} border-0 cursor-pointer"
                            onchange="updateStatus('${booking._id}', this.value)">
                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                    </select>
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="viewBooking('${booking._id}')" 
                                class="text-blue-600 hover:text-blue-800" 
                                title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteBooking('${booking._id}')" 
                                class="text-red-600 hover:text-red-800" 
                                title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Get Status Configuration
 */
function getStatusConfig(status) {
    const configs = {
        pending: { bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' },
        confirmed: { bgClass: 'bg-green-100', textClass: 'text-green-700' },
        cancelled: { bgClass: 'bg-red-100', textClass: 'text-red-700' },
        completed: { bgClass: 'bg-blue-100', textClass: 'text-blue-700' }
    };
    return configs[status] || configs.pending;
}

/**
 * Update Pagination
 */
function updatePagination(pagination) {
    document.getElementById('showingFrom').textContent = ((pagination.page - 1) * pagination.limit + 1);
    document.getElementById('showingTo').textContent = Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('totalCount').textContent = pagination.total;

    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    
    let paginationHTML = '';

    // Previous button
    if (pagination.page > 1) {
        paginationHTML += `
            <button onclick="changePage(${pagination.page - 1})" 
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === pagination.page) {
            paginationHTML += `
                <button class="px-3 py-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg">
                    ${i}
                </button>
            `;
        } else if (i === 1 || i === pagination.pages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
            paginationHTML += `
                <button onclick="changePage(${i})" 
                        class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                    ${i}
                </button>
            `;
        } else if (i === pagination.page - 2 || i === pagination.page + 2) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
    }

    // Next button
    if (pagination.page < pagination.pages) {
        paginationHTML += `
            <button onclick="changePage(${pagination.page + 1})" 
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationDiv.innerHTML = paginationHTML;
}

/**
 * Change Page
 */
function changePage(page) {
    currentPage = page;
    loadBookings();
}

/**
 * Update Booking Status
 */
async function updateStatus(bookingId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Cập nhật trạng thái thành công', 'success');
            loadBookings();
        } else {
            showNotification(result.message || 'Lỗi khi cập nhật trạng thái', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
}

/**
 * View Booking Details
 */
async function viewBooking(bookingId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showBookingModal(result.data);
        }
    } catch (error) {
        console.error('Error loading booking:', error);
        showNotification('Lỗi khi tải thông tin đặt phòng', 'error');
    }
}

/**
 * Show Booking Modal
 */
function showBookingModal(booking) {
    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('bookingModalContent');

    if (!modal || !content) return;

    const statusConfig = getStatusConfig(booking.status);
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- User Info -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">Thông tin người đặt</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-medium">Tên:</span> ${booking.name || booking.tenant?.name || 'N/A'}</p>
                    <p><span class="font-medium">Email:</span> ${booking.tenant?.email || 'N/A'}</p>
                    <p><span class="font-medium">SĐT:</span> ${booking.phone || 'N/A'}</p>
                </div>
            </div>

            <!-- Property Info -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">Thông tin phòng</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-medium">Tên:</span> ${booking.property?.title || 'N/A'}</p>
                    <p><span class="font-medium">Địa chỉ:</span> ${booking.property?.address?.street || ''}, ${booking.property?.address?.district || ''}</p>
                    <p><span class="font-medium">Giá:</span> ${booking.property?.price ? (booking.property.price / 1000000).toFixed(1) + ' triệu/tháng' : 'N/A'}</p>
                </div>
            </div>

            <!-- Booking Info -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">Thông tin đặt lịch</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-medium">Ngày xem:</span> ${new Date(booking.viewingDate).toLocaleDateString('vi-VN')}</p>
                    <p><span class="font-medium">Giờ xem:</span> ${booking.viewingTime || 'N/A'}</p>
                    ${booking.startDate ? `<p><span class="font-medium">Check-in:</span> ${new Date(booking.startDate).toLocaleDateString('vi-VN')}</p>` : ''}
                    ${booking.endDate ? `<p><span class="font-medium">Check-out:</span> ${new Date(booking.endDate).toLocaleDateString('vi-VN')}</p>` : ''}
                    <p><span class="font-medium">Trạng thái:</span> 
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgClass} ${statusConfig.textClass}">
                            ${getStatusText(booking.status)}
                        </span>
                    </p>
                    ${booking.note ? `<p><span class="font-medium">Ghi chú:</span> ${booking.note}</p>` : ''}
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Close Booking Modal
 */
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Get Status Text
 */
function getStatusText(status) {
    const texts = {
        pending: 'Chờ duyệt',
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã hủy',
        completed: 'Hoàn thành'
    };
    return texts[status] || status;
}

/**
 * Delete Booking
 */
async function deleteBooking(bookingId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đặt phòng này?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/bookings/${bookingId}/delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Xóa đặt phòng thành công', 'success');
            loadBookings();
        } else {
            showNotification(result.message || 'Lỗi khi xóa đặt phòng', 'error');
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showNotification('Lỗi khi xóa đặt phòng', 'error');
    }
}

/**
 * Show Notification
 */
function showNotification(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideDown`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Debounce Function
 */
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
