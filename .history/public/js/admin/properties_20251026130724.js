/**
 * ===================================
 * ADMIN PROPERTIES JS
 * Quản lý bất động sản
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    loadProperties();
    checkAdminAuth();
});

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

    try {
        // Giả lập dữ liệu
        setTimeout(() => {
            const sampleProperties = [
                {
                    _id: '1',
                    title: 'Phòng Trọ Cao Cấp Quận 1',
                    propertyType: 'phong-tro',
                    price: 3500000,
                    address: { city: 'TP. Hồ Chí Minh', district: 'Quận 1' },
                    status: 'pending',
                    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400']
                },
                {
                    _id: '2',
                    title: 'Căn Hộ Mini Tân Bình',
                    propertyType: 'can-ho',
                    price: 5000000,
                    address: { city: 'TP. Hồ Chí Minh', district: 'Quận Tân Bình' },
                    status: 'available',
                    images: ['https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80?w=400']
                },
                {
                    _id: '3',
                    title: 'Nhà Nguyên Căn Thủ Đức',
                    propertyType: 'nha-nguyen-can',
                    price: 12000000,
                    address: { city: 'TP. Hồ Chí Minh', district: 'Quận Thủ Đức' },
                    status: 'rented',
                    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400']
                }
            ];

            renderPropertiesGrid(sampleProperties);
        }, 1000);

    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

function renderPropertiesGrid(properties) {
    const grid = document.getElementById('propertiesGrid');
    
    grid.innerHTML = properties.map(property => `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div class="relative h-48">
                <img src="${property.images[0]}" alt="${property.title}" class="w-full h-full object-cover">
                <div class="absolute top-3 right-3">
                    <span class="px-3 py-1 ${getStatusBadgeClass(property.status)} text-xs rounded-full font-medium backdrop-blur-sm">
                        ${getStatusLabel(property.status)}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${property.title}</h3>
                <p class="text-pink-600 font-bold text-lg mb-2">${formatPrice(property.price)}</p>
                <p class="text-sm text-gray-600 mb-4">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${property.address.district}, ${property.address.city}
                </p>
                <div class="flex space-x-2">
                    <button onclick="approveProperty('${property._id}')" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                        <i class="fas fa-check mr-1"></i>Duyệt
                    </button>
                    <button onclick="viewProperty('${property._id}')" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <i class="fas fa-eye"></i>
                    </button>
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
        'available': 'Có sẵn',
        'rented': 'Đã thuê',
        'inactive': 'Không hoạt động'
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-700',
        'available': 'bg-green-100 text-green-700',
        'rented': 'bg-blue-100 text-blue-700',
        'inactive': 'bg-gray-100 text-gray-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
}

function formatPrice(price) {
    return (price / 1000000).toFixed(1) + ' triệu/tháng';
}

function approveProperty(id) {
    if (confirm('Duyệt bất động sản này?')) {
        console.log('Approve:', id);
        alert('Đã duyệt!');
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
