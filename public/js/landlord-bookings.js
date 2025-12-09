/* ===================================
   LANDLORD-BOOKINGS.JS - Quản lý lịch hẹn xem phòng
   =================================== */

let allBookings = [];
let filteredBookings = [];

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        window.location.href = '/auth/login';
        return;
    }

    // Fill thông tin user
    fillUserInfo(userData);
    
    // Load bookings
    loadBookings();
    
    // Event listeners
    initEventListeners();
});

// Fill thông tin user vào header
function fillUserInfo(userData) {
    try {
        const user = JSON.parse(userData);
        
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userAvatar && user.avatar) {
            userAvatar.src = user.avatar;
        }
        if (userName && user.name) {
            userName.textContent = user.name;
        }
    } catch (error) {
        console.error('Error filling user data:', error);
    }
}

// Khởi tạo event listeners
function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

// Load bookings from API
async function loadBookings() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/bookings/landlord', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách lịch hẹn');
        }

        const result = await response.json();
        allBookings = result.data || [];
        
        // Update stats
        updateStats();
        
        // Apply filters
        applyFilters();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        showAlert('Không thể tải danh sách lịch hẹn: ' + error.message, 'danger');
    }
}

// Update statistics
function updateStats() {
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('confirmedCount').textContent = confirmed;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('cancelledCount').textContent = cancelled;
}

// Apply filters
function applyFilters() {
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusValue = document.getElementById('statusFilter')?.value || '';
    const sortValue = document.getElementById('sortFilter')?.value || 'newest';
    
    // Filter bookings
    filteredBookings = allBookings.filter(booking => {
        // Search filter
        const searchMatch = !searchValue || 
            booking.visitorName?.toLowerCase().includes(searchValue) ||
            booking.visitorPhone?.toLowerCase().includes(searchValue) ||
            booking.property?.title?.toLowerCase().includes(searchValue) ||
            booking.property?.address?.street?.toLowerCase().includes(searchValue);
        
        // Status filter
        const statusMatch = !statusValue || booking.status === statusValue;
        
        return searchMatch && statusMatch;
    });
    
    // Sort bookings
    sortBookings(sortValue);
    
    // Display bookings
    displayBookings();
}

// Sort bookings
function sortBookings(sortType) {
    switch(sortType) {
        case 'newest':
            filteredBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredBookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'date-asc':
            filteredBookings.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
            break;
        case 'date-desc':
            filteredBookings.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
            break;
    }
}

// Display bookings
function displayBookings() {
    const bookingsList = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = '';
        emptyState.style.display = 'block';
        
        // Update count
        if (typeof updateBookingsCount === 'function') {
            updateBookingsCount(0);
        }
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Update count
    if (typeof updateBookingsCount === 'function') {
        updateBookingsCount(filteredBookings.length);
    }
    
    bookingsList.innerHTML = filteredBookings.map(booking => createBookingCard(booking)).join('');
}

// Create booking card HTML
function createBookingCard(booking) {
    const statusText = getStatusText(booking.status);
    const statusClass = `status-${booking.status}`;
    const property = booking.property || {};
    const visitDate = new Date(booking.visitDate);
    const createdDate = new Date(booking.createdAt);
    
    const propertyImage = property.images && property.images.length > 0 
        ? property.images[0] 
        : 'https://via.placeholder.com/120x90?text=No+Image';
    
    return `
        <div class="booking-card">
            <div class="booking-header">
                <div class="property-info">
                    <img src="${propertyImage}" alt="Property" class="property-img">
                    <div>
                        <h5 class="mb-1">${property.title || 'Chưa có tiêu đề'}</h5>
                        <p class="text-muted mb-1">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${property.address?.street || ''}, ${property.address?.ward || ''}, ${property.address?.district || ''}
                        </p>
                        <p class="text-primary fw-semibold mb-0">
                            ${formatPrice(property.price)} ${property.priceUnit === 'trieu-thang' ? 'triệu/tháng' : 'VNĐ/tháng'}
                        </p>
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="booking-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span>${booking.visitorName || 'Chưa có tên'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${booking.visitorPhone || 'Chưa có SĐT'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(visitDate)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${booking.visitTime || 'Chưa có giờ'}</span>
                </div>
            </div>
            
            ${booking.message ? `
                <div class="alert alert-info mb-3">
                    <i class="fas fa-comment me-2"></i>
                    <strong>Lời nhắn:</strong> ${booking.message}
                </div>
            ` : ''}
            
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    Tạo lúc: ${formatDateTime(createdDate)}
                </small>
                
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-success btn-sm btn-action" onclick="updateBookingStatus('${booking._id}', 'confirmed')">
                            <i class="fas fa-check me-1"></i>Xác nhận
                        </button>
                        <button class="btn btn-danger btn-sm btn-action" onclick="updateBookingStatus('${booking._id}', 'cancelled')">
                            <i class="fas fa-times me-1"></i>Từ chối
                        </button>
                    ` : ''}
                    
                    ${booking.status === 'confirmed' ? `
                        <button class="btn btn-primary btn-sm btn-action" onclick="updateBookingStatus('${booking._id}', 'completed')">
                            <i class="fas fa-check-double me-1"></i>Hoàn thành
                        </button>
                        <button class="btn btn-warning btn-sm btn-action" onclick="updateBookingStatus('${booking._id}', 'cancelled')">
                            <i class="fas fa-times me-1"></i>Hủy
                        </button>
                    ` : ''}
                    
                    <a href="tel:${booking.visitorPhone}" class="btn btn-outline-primary btn-sm btn-action">
                        <i class="fas fa-phone me-1"></i>Gọi điện
                    </a>
                    
                    <button class="btn btn-outline-danger btn-sm btn-action" onclick="deleteBooking('${booking._id}')">
                        <i class="fas fa-trash me-1"></i>Xóa
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
    if (!confirm('Bạn có chắc chắn muốn thay đổi trạng thái lịch hẹn này?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật trạng thái');
        }

        showAlert('Cập nhật trạng thái thành công!', 'success');
        
        // Reload bookings
        await loadBookings();
        
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('Lỗi: ' + error.message, 'danger');
    }
}

// Delete booking
async function deleteBooking(bookingId) {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa lịch hẹn');
        }

        showAlert('Xóa lịch hẹn thành công!', 'success');
        
        // Reload bookings
        await loadBookings();
        
    } catch (error) {
        console.error('Error deleting booking:', error);
        showAlert('Lỗi: ' + error.message, 'danger');
    }
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('vi-VN', options);
}

function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('vi-VN', options);
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
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

// Logout handler
function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '/auth/login';
}
