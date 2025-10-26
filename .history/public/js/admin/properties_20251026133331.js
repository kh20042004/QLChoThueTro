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
    const statusFilter = document.querySelectorAll('select')[0];
    const typeFilter = document.querySelectorAll('select')[1];

    if (searchInput) {
        searchInput.addEventListener('input', filterProperties);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterProperties);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', filterProperties);
    }
}

/**
 * Lọc properties
 */
function filterProperties() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const statusFilter = document.querySelectorAll('select')[0];
    const typeFilter = document.querySelectorAll('select')[1];

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const typeValue = typeFilter ? typeFilter.value : '';

    const filteredProperties = allProperties.filter(property => {
        const matchSearch = !searchTerm || 
            property.title.toLowerCase().includes(searchTerm) ||
            property.address?.city?.toLowerCase().includes(searchTerm) ||
            property.address?.district?.toLowerCase().includes(searchTerm);

        const matchStatus = !statusValue || property.status === statusValue;
        const matchType = !typeValue || property.propertyType === typeValue;

        return matchSearch && matchStatus && matchType;
    });

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

            // Cập nhật số lượng properties
            const totalPropertiesElement = document.querySelector('.text-2xl.font-bold');
            if (totalPropertiesElement) {
                totalPropertiesElement.textContent = result.count || result.data.length;
            }
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
    
    grid.innerHTML = properties.map(property => `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div class="relative h-48">
                <img src="${property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}" 
                     alt="${property.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'">
                <div class="absolute top-3 right-3">
                    <span class="px-3 py-1 ${getStatusBadgeClass(property.status)} text-xs rounded-full font-medium backdrop-blur-sm">
                        ${getStatusLabel(property.status)}
                    </span>
                </div>
                ${property.owner ? `
                <div class="absolute bottom-3 left-3">
                    <div class="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
                        <i class="fas fa-user mr-1"></i>${property.owner.name || property.owner.email}
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${property.title}</h3>
                <p class="text-pink-600 font-bold text-lg mb-2">${formatPrice(property.price)}</p>
                <p class="text-sm text-gray-600 mb-3">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${property.address?.district || 'N/A'}, ${property.address?.city || 'N/A'}
                </p>
                <p class="text-xs text-gray-500 mb-4">
                    <i class="fas fa-calendar mr-1"></i>
                    ${formatDate(property.createdAt)}
                </p>
                <div class="flex space-x-2">
                    ${property.status === 'pending' ? `
                    <button onclick="approveProperty('${property._id}')" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                        <i class="fas fa-check mr-1"></i>Duyệt
                    </button>
                    <button onclick="rejectProperty('${property._id}')" class="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">
                        <i class="fas fa-times mr-1"></i>Từ chối
                    </button>
                    ` : `
                    <button onclick="viewProperty('${property._id}')" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <i class="fas fa-eye mr-1"></i>Xem
                    </button>
                    `}
                    <button onclick="deleteProperty('${property._id}')" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'available': 'Có sẵn',
        'rented': 'Đã thuê',
        'rejected': 'Đã từ chối',
        'inactive': 'Không hoạt động'
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-700',
        'approved': 'bg-green-100 text-green-700',
        'available': 'bg-green-100 text-green-700',
        'rented': 'bg-blue-100 text-blue-700',
        'rejected': 'bg-red-100 text-red-700',
        'inactive': 'bg-gray-100 text-gray-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
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

function deleteProperty(id) {
    if (confirm('Xóa bất động sản này?')) {
        console.log('Delete:', id);
        alert('Đã xóa!');
    }
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
