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

    // Fill thông tin user vào header dropdown
    try {
        const user = JSON.parse(userData);
        
        // Avatar và tên trong button
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userAvatar && user.avatar) {
            userAvatar.src = user.avatar;
        }
        if (userName && user.name) {
            userName.textContent = user.name;
        }
        
        // Avatar, tên và email trong dropdown
        const userAvatarDropdown = document.getElementById('userAvatarDropdown');
        const userNameDropdown = document.getElementById('userNameDropdown');
        const userEmailDropdown = document.getElementById('userEmailDropdown');
        
        if (userAvatarDropdown && user.avatar) {
            userAvatarDropdown.src = user.avatar;
        }
        if (userNameDropdown && user.name) {
            userNameDropdown.textContent = user.name;
        }
        if (userEmailDropdown && user.email) {
            userEmailDropdown.textContent = user.email;
        }
    } catch (error) {
        console.error('Error filling user data:', error);
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

async function loadProperties() {
    const searchValue = document.getElementById('searchInput')?.value || '';
    const statusValue = document.getElementById('statusFilter')?.value || '';
    const sortValue = document.getElementById('sortFilter')?.value || 'newest';

    try {
        // Lấy token
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (!token || !userData) {
            window.location.href = '/auth/login';
            return;
        }

        console.log('🔍 Loading properties for user:', userData.id);

        // Gọi API lấy properties của user (sử dụng endpoint chuyên dụng)
        const response = await fetch('/api/properties/my-properties', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách bài đăng');
        }

        const result = await response.json();
        console.log('📦 API Response:', result);
        
        let properties = result.data || [];
        console.log('📋 Total properties from API:', properties.length);
        
        // Lọc theo tìm kiếm
        if (searchValue) {
            properties = properties.filter(prop => 
                prop.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                prop.description.toLowerCase().includes(searchValue.toLowerCase())
            );
        }
        
        // Lọc theo trạng thái
        if (statusValue) {
            properties = properties.filter(prop => prop.status === statusValue);
        }
        
        // Sắp xếp
        if (sortValue === 'newest') {
            properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortValue === 'oldest') {
            properties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortValue === 'most-viewed') {
            properties.sort((a, b) => (b.views || 0) - (a.views || 0));
        }
        
        // Hiển thị kết quả
        displayProperties(properties);
        
        // Cập nhật số lượng
        const countElement = document.getElementById('propertyCount');
        if (countElement) {
            countElement.textContent = `${properties.length} bài đăng`;
        }
        
        console.log('✅ Loaded properties:', properties.length);
    } catch (error) {
        console.error('❌ Error loading properties:', error);
        showAlert('Không thể tải danh sách bài đăng', 'danger');
    }
}

function displayProperties(properties) {
    const container = document.getElementById('propertiesContainer');
    
    if (!container) {
        console.warn('Properties container not found');
        return;
    }
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div class="col-span-full">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <i class="fas fa-home text-5xl text-blue-300 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Chưa có bài đăng nào</h3>
                    <p class="text-gray-600 mb-4">Bắt đầu đăng tin ngay để cho thuê nhà/phòng của bạn</p>
                    <a href="/property/create" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Đăng tin ngay
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = properties.map(prop => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <!-- Ảnh -->
            <div class="relative overflow-hidden h-48 bg-gray-200">
                <img src="${prop.images && prop.images[0] ? prop.images[0] : 'https://via.placeholder.com/400x300/6B7280/ffffff?text=Chưa+có+ảnh'}" 
                     alt="${prop.title}" 
                     class="w-full h-full object-cover">
                <span class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBgColor(prop.status)}">
                    ${getStatusLabel(prop.status)}
                </span>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p class="text-white text-sm">
                        <i class="fas fa-eye mr-1"></i>${prop.views || 0} lượt xem
                    </p>
                </div>
            </div>
            
            <!-- Nội dung -->
            <div class="p-5">
                <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                    ${prop.title}
                </h3>
                
                <div class="flex items-center text-gray-600 text-sm mb-3">
                    <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>
                    <span class="line-clamp-1">${prop.address?.ward}, ${prop.address?.district}</span>
                </div>
                
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                    <div class="text-2xl font-bold text-blue-600">
                        ${formatPrice(prop.price)}
                    </div>
                    <div class="text-sm text-gray-500">
                        / tháng
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                    <div class="bg-gray-50 rounded py-2">
                        <i class="fas fa-expand-arrows-alt text-gray-600"></i>
                        <p class="text-gray-800 font-semibold">${prop.area} m²</p>
                    </div>
                    <div class="bg-gray-50 rounded py-2">
                        <i class="fas fa-bed text-gray-600"></i>
                        <p class="text-gray-800 font-semibold">${prop.bedrooms} phòng</p>
                    </div>
                    <div class="bg-gray-50 rounded py-2">
                        <i class="fas fa-bath text-gray-600"></i>
                        <p class="text-gray-800 font-semibold">${prop.bathrooms} WC</p>
                    </div>
                </div>
                
                <p class="text-gray-600 text-sm line-clamp-2 mb-4">
                    ${prop.description}
                </p>
                
                <!-- Actions -->
                <div class="grid grid-cols-3 gap-2">
                    <a href="/property/${prop._id}" 
                       class="flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <i class="fas fa-eye mr-1"></i> Xem
                    </a>
                    <button onclick="editProperty('${prop._id}')" 
                            class="flex items-center justify-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">
                        <i class="fas fa-edit mr-1"></i> Sửa
                    </button>
                    <button onclick="deleteProperty('${prop._id}')" 
                            class="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                        <i class="fas fa-trash mr-1"></i> Xóa
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + ' triệu';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

function getStatusBgColor(status) {
    const colors = {
        'pending': 'bg-yellow-500',
        'available': 'bg-green-500',
        'rented': 'bg-blue-500',
        'inactive': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'available': 'success',
        'rented': 'info',
        'inactive': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Chờ duyệt',
        'available': 'Có sẵn',
        'rented': 'Đã cho thuê',
        'inactive': 'Không hoạt động'
    };
    return labels[status] || status;
}

function editProperty(propertyId) {
    // Redirect đến trang edit với property ID
    window.location.href = `/property/edit/${propertyId}`;
}

async function deleteProperty(propertyId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
        return;
    }

    try {
        // Lấy token
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }

        // Gọi API xóa
        const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Không thể xóa bài đăng');
        }

        // Reload danh sách từ server
        await loadProperties();
        
        showAlert('Đã xóa bài đăng thành công', 'success');
    } catch (error) {
        console.error('❌ Error deleting property:', error);
        showAlert(error.message || 'Không thể xóa bài đăng', 'danger');
    }
}

function showAlert(message, type = 'info') {
    // Tạo thông báo
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white animate-slideDown ${
        type === 'success' ? 'bg-green-500' : 
        type === 'danger' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-blue-500'
    }`;
    alertDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'times-circle' : 'info-circle'} text-xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        setTimeout(() => alertDiv.remove(), 300);
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
