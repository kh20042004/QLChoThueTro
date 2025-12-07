/**
 * ===================================
 * ADMIN PROPERTIES JS
 * Quản lý bất động sản
 * ===================================
 */

// Biến lưu trữ dữ liệu
let allProperties = [];

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    loadProperties();
    checkAdminAuth();
    initFilters();
});

/**
 * Khởi tạo filters
 */
function initFilters() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const selects = document.querySelectorAll('select');
    const typeFilter = selects[0]; // Loại hình
    const statusFilter = selects[1]; // Trạng thái
    const sortFilter = selects[2]; // Sắp xếp

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProperties, 300));
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', filterProperties);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterProperties);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', filterProperties);
    }
}

// Debounce function
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

/**
 * Lọc properties
 */
function filterProperties() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const selects = document.querySelectorAll('select');
    const typeFilter = selects[0]; // Loại hình
    const statusFilter = selects[1]; // Trạng thái
    const sortFilter = selects[2]; // Sắp xếp

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const sortValue = sortFilter ? sortFilter.value : 'newest';

    console.log('🔍 Filtering:', { searchTerm, typeValue, statusValue, sortValue });

    let filteredProperties = allProperties.filter(property => {
        const matchSearch = !searchTerm || 
            property.title.toLowerCase().includes(searchTerm) ||
            property.address?.city?.toLowerCase().includes(searchTerm) ||
            property.address?.district?.toLowerCase().includes(searchTerm) ||
            property.landlord?.name?.toLowerCase().includes(searchTerm) ||
            property.landlord?.email?.toLowerCase().includes(searchTerm);

        const matchType = !typeValue || property.propertyType === typeValue;
        const matchStatus = !statusValue || property.status === statusValue;

        return matchSearch && matchType && matchStatus;
    });

    // Sắp xếp
    if (sortValue === 'newest') {
        filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortValue === 'oldest') {
        filteredProperties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === 'price-asc') {
        filteredProperties.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price-desc') {
        filteredProperties.sort((a, b) => b.price - a.price);
    }

    console.log('✅ Filtered properties:', filteredProperties.length);
    renderPropertiesGrid(filteredProperties);
}

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
    }
}

async function loadProperties() {
    const grid = document.getElementById('propertiesGrid');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    // Hiển thị loading
    grid.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p class="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/properties', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/auth/login';
                return;
            }
            throw new Error('Failed to load properties');
        }

        const result = await response.json();

        if (result.success) {
            allProperties = result.data; // Lưu vào biến global
            renderPropertiesGrid(allProperties);

            // Cập nhật stats
            updateStats(allProperties);
        } else {
            throw new Error(result.error || 'Failed to load properties');
        }

    } catch (error) {
        console.error('Error loading properties:', error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
                <p class="text-red-500">Lỗi tải dữ liệu. Vui lòng thử lại!</p>
            </div>
        `;
    }
}

function renderPropertiesGrid(properties) {
    const grid = document.getElementById('propertiesGrid');
    
    if (properties.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-home text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Không tìm thấy bất động sản nào</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = properties.map(property => {
        const landlordName = property.landlord?.name || property.landlord?.email || 'Không rõ';
        const imageUrl = (property.images && property.images.length > 0) 
            ? property.images[0] 
            : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400';
        
        return `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer property-card" 
             onclick="viewProperty('${property._id}')"
             data-property-id="${property._id}">
            <div class="relative h-48">
                <img src="${imageUrl}" 
                     alt="${property.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'">
                <div class="absolute top-3 right-3">
                    <span class="px-3 py-1 ${getStatusBadgeClass(property.status)} text-xs rounded-full font-semibold">
                        ${getStatusLabel(property.status)}
                    </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <div class="flex items-center justify-between text-white text-xs">
                        <div class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            <span class="font-medium">${landlordName}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-eye mr-1"></i>
                            <span>${property.views || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-pink-600 transition-colors">${property.title}</h3>
                <div class="flex items-baseline justify-between mb-3">
                    <p class="text-pink-600 font-bold text-xl">${formatPrice(property.price)}</p>
                    <p class="text-xs text-gray-500">${property.area || 0}m²</p>
                </div>
                <p class="text-sm text-gray-600 mb-2">
                    <i class="fas fa-map-marker-alt text-red-500 mr-1"></i>
                    ${property.address?.district || 'N/A'}, ${property.address?.city || 'N/A'}
                </p>
                <p class="text-xs text-gray-500 mb-3">
                    <i class="fas fa-calendar mr-1"></i>
                    ${formatDate(property.createdAt)}
                </p>
                
                <!-- Dropdown chọn trạng thái -->
                <div class="mb-3" onclick="event.stopPropagation()">
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-toggle-on mr-1"></i>Trạng thái:
                    </label>
                    <select onchange="updatePropertyStatus('${property._id}', this.value)" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                            style="cursor: pointer;">
                        <option value="available" ${property.status === 'available' ? 'selected' : ''}>✅ Còn trống</option>
                        <option value="rented" ${property.status === 'rented' ? 'selected' : ''}>🏠 Đã thuê</option>
                        <option value="pending" ${property.status === 'pending' ? 'selected' : ''}>⏳ Chờ duyệt</option>
                        <option value="inactive" ${property.status === 'inactive' ? 'selected' : ''}>🔘 Tạm ngưng</option>
                    </select>
                </div>
                
                <div class="flex gap-2" onclick="event.stopPropagation()">
                    <button onclick="event.stopPropagation(); viewProperty('${property._id}')" 
                            class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            title="Xem chi tiết">
                        <i class="fas fa-eye mr-1"></i>Xem
                    </button>
                    <button onclick="event.stopPropagation(); deleteProperty('${property._id}')" 
                            class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            title="Xóa vĩnh viễn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Chờ duyệt',
        'available': 'Sẵn sàng',
        'rented': 'Đã thuê',
        'inactive': 'Không hoạt động'
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30',
        'available': 'bg-green-500/20 text-green-700 border border-green-500/30',
        'rented': 'bg-blue-500/20 text-blue-700 border border-blue-500/30',
        'inactive': 'bg-red-500/20 text-red-700 border border-red-500/30'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-700 border border-gray-500/30';
}

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + ' triệu/tháng';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

async function approveProperty(id) {
    if (!confirm('Duyệt bất động sản này?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/admin/properties/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to approve property');
        }

        const result = await response.json();

        if (result.success) {
            alert('Đã duyệt bất động sản thành công!');
            loadProperties(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to approve property');
        }
    } catch (error) {
        console.error('Error approving property:', error);
        alert('Lỗi khi duyệt bất động sản. Vui lòng thử lại!');
    }
}

async function rejectProperty(id) {
    if (!confirm('Từ chối bất động sản này?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/admin/properties/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to reject property');
        }

        const result = await response.json();

        if (result.success) {
            alert('Đã từ chối bất động sản!');
            loadProperties(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to reject property');
        }
    } catch (error) {
        console.error('Error rejecting property:', error);
        alert('Lỗi khi từ chối bất động sản. Vui lòng thử lại!');
    }
}

function viewProperty(id) {
    window.open('/properties/' + id, '_blank');
}

async function deleteProperty(id) {
    if (!confirm('Xóa bất động sản này? Hành động này không thể hoàn tác!')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/admin/properties/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete property');
        }

        const result = await response.json();

        if (result.success) {
            alert('Đã xóa bất động sản thành công!');
            loadProperties(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to delete property');
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Lỗi khi xóa bất động sản. Vui lòng thử lại!');
    }
}

/**
 * Cập nhật thống kê
 */
function updateStats(properties) {
    const total = properties.length;
    const pending = properties.filter(p => p.status === 'pending').length;
    const available = properties.filter(p => p.status === 'available').length;
    const inactive = properties.filter(p => p.status === 'inactive').length;

    // Cập nhật các số liệu
    const statCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-4 .bg-white\\/90');
    
    if (statCards.length >= 4) {
        // Tổng BĐS
        const totalEl = statCards[0].querySelector('.text-2xl.font-bold');
        if (totalEl) totalEl.textContent = total;

        // Chờ duyệt
        const pendingEl = statCards[1].querySelector('.text-2xl.font-bold');
        if (pendingEl) pendingEl.textContent = pending;

        // Đã duyệt (available)
        const availableEl = statCards[2].querySelector('.text-2xl.font-bold');
        if (availableEl) availableEl.textContent = available;

        // Đã khóa (inactive)
        const inactiveEl = statCards[3].querySelector('.text-2xl.font-bold');
        if (inactiveEl) inactiveEl.textContent = inactive;
    }

    console.log('📊 Stats updated:', { total, pending, available, inactive });
}

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
 * Cập nhật trạng thái property
 */
async function updatePropertyStatus(propertyId, newStatus) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Vui lòng đăng nhập lại!');
        window.location.href = '/auth/login';
        return;
    }

    // Hiển thị loading trên dropdown
    const select = event.target;
    const originalValue = select.dataset.originalValue || select.value;
    select.disabled = true;
    select.style.opacity = '0.6';

    try {
        console.log(`🔄 Updating property ${propertyId} status to: ${newStatus}`);

        const response = await fetch(`/api/properties/${propertyId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Không thể cập nhật trạng thái');
        }

        if (result.success) {
            console.log('✅ Status updated successfully:', result.message);
            
            // Hiển thị thông báo thành công
            showNotification('success', result.message || 'Đã cập nhật trạng thái thành công!');
            
            // Cập nhật originalValue
            select.dataset.originalValue = newStatus;
            
            // Reload danh sách để cập nhật badge và stats
            setTimeout(() => {
                loadProperties();
            }, 500);
        } else {
            throw new Error(result.error || 'Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showNotification('error', error.message || 'Lỗi khi cập nhật trạng thái!');
        
        // Khôi phục giá trị cũ
        select.value = originalValue;
    } finally {
        select.disabled = false;
        select.style.opacity = '1';
    }
}

/**
 * Hiển thị thông báo toast
 */
function showNotification(type, message) {
    // Tạo container nếu chưa có
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }

    // Tạo notification
    const notification = document.createElement('div');
    notification.className = `px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-0 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;

    container.appendChild(notification);

    // Tự động xóa sau 3 giây
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
