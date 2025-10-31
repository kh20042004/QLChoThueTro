/* ===================================
   PROPERTY-DETAIL.JS - Chi tiết bài đăng
   =================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Lấy property ID từ URL
    const pathParts = window.location.pathname.split('/');
    const propertyId = pathParts[pathParts.length - 1];
    
    if (!propertyId) {
        showError('Không tìm thấy ID bài đăng');
        return;
    }
    
    // Load thông tin property
    loadPropertyDetail(propertyId);
});

async function loadPropertyDetail(propertyId) {
    try {
        showLoading();
        
        // Thử load từ API trước
        const response = await fetch(`/api/properties/${propertyId}`);
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                displayPropertyDetail(result.data);
                return;
            }
        }
        
        // Nếu API fail, thử load từ localStorage
        const myProperties = JSON.parse(localStorage.getItem('myProperties')) || [];
        const property = myProperties.find(p => p._id === propertyId);
        
        if (property) {
            displayPropertyDetail(property);
        } else {
            showError('Không tìm thấy thông tin bài đăng');
        }
    } catch (error) {
        console.error('Error loading property:', error);
        
        // Fallback: Load từ localStorage
        const myProperties = JSON.parse(localStorage.getItem('myProperties')) || [];
        const property = myProperties.find(p => p._id === propertyId);
        
        if (property) {
            displayPropertyDetail(property);
        } else {
            showError('Không thể tải thông tin bài đăng');
        }
    }
}

function displayPropertyDetail(property) {
    hideLoading();
    
    // Cập nhật title
    document.title = `${property.title} - HomeRent`;
    
    // Hiển thị property detail container
    const detailContainer = document.getElementById('property-detail');
    const loadingContainer = document.getElementById('loading');
    
    if (detailContainer) {
        detailContainer.classList.remove('hidden');
    }
    if (loadingContainer) {
        loadingContainer.classList.add('hidden');
    }
    
    // Hiển thị tiêu đề
    const titleElement = document.getElementById('property-title');
    if (titleElement) {
        titleElement.textContent = property.title;
    }
    
    // Hiển thị breadcrumb
    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = property.title;
    }
    
    // Hiển thị loại property
    const typeElement = document.getElementById('property-type');
    if (typeElement) {
        const typeLabels = {
            'phong-tro': 'Phòng trọ',
            'nha-nguyen-can': 'Nhà nguyên căn',
            'can-ho': 'Căn hộ',
            'chung-cu-mini': 'Chung cư mini',
            'homestay': 'Homestay'
        };
        typeElement.textContent = typeLabels[property.propertyType] || property.propertyType;
    }
    
    // Hiển thị giá
    const priceElement = document.getElementById('property-price');
    if (priceElement) {
        priceElement.textContent = formatPrice(property.price);
    }
    
    // Hiển thị địa chỉ
    const addressElement = document.getElementById('property-address');
    if (addressElement) {
        addressElement.innerHTML = `
            <i class="fas fa-map-marker-alt mr-2"></i>
            ${property.address?.street || ''}, ${property.address?.ward || ''}, 
            ${property.address?.district || ''}, ${property.address?.city || ''}
        `;
    }
    
    // Hiển thị mô tả
    const descElement = document.getElementById('property-description');
    if (descElement) {
        descElement.textContent = property.description;
    }
    
    // Hiển thị thông tin cơ bản
    const areaElement = document.getElementById('property-area');
    if (areaElement) {
        areaElement.textContent = `${property.area} m²`;
    }
    
    const bedroomsElement = document.getElementById('property-bedrooms');
    if (bedroomsElement) {
        bedroomsElement.textContent = `${property.bedrooms} phòng`;
    }
    
    const bathroomsElement = document.getElementById('property-bathrooms');
    if (bathroomsElement) {
        bathroomsElement.textContent = `${property.bathrooms} WC`;
    }
    
    // Hiển thị ảnh
    displayImages(property.images || []);
    
    // Hiển thị tiện nghi
    displayAmenities(property.amenities || {});
    
    console.log('✅ Property detail loaded:', property);
}

function displayImages(images) {
    const mainImageContainer = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-gallery');
    
    if (images.length === 0) {
        if (mainImageContainer) {
            mainImageContainer.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                    <p class="text-gray-500">Chưa có ảnh</p>
                </div>
            `;
        }
        return;
    }
    
    // Hiển thị ảnh chính
    if (mainImageContainer) {
        mainImageContainer.innerHTML = `
            <img id="mainImage" 
                 src="${images[0]}" 
                 alt="Property Image" 
                 class="w-full h-full object-cover">
        `;
    }
    
    // Hiển thị thumbnails
    if (thumbnailContainer && images.length > 1) {
        thumbnailContainer.innerHTML = images.map((img, index) => `
            <div class="relative overflow-hidden rounded-lg cursor-pointer hover:opacity-75 transition-opacity ${index === 0 ? 'ring-2 ring-blue-500' : ''}"
                 onclick="changeMainImage('${img}', this)">
                <img src="${img}" 
                     alt="Thumbnail ${index + 1}" 
                     class="w-full h-20 object-cover">
            </div>
        `).join('');
    }
}

function changeMainImage(imageSrc, thumbnailElement) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
    
    // Remove active ring từ tất cả thumbnails
    document.querySelectorAll('#thumbnail-gallery > div').forEach(div => {
        div.classList.remove('ring-2', 'ring-blue-500');
    });
    
    // Add active ring cho thumbnail được click
    thumbnailElement.classList.add('ring-2', 'ring-blue-500');
}

function displayAmenities(amenities) {
    const amenitiesElement = document.getElementById('property-amenities');
    if (!amenitiesElement) return;
    
    const amenitiesData = [
        { key: 'wifi', label: 'WiFi', icon: 'wifi' },
        { key: 'ac', label: 'Điều hòa', icon: 'fan' },
        { key: 'parking', label: 'Chỗ đậu xe', icon: 'parking' },
        { key: 'kitchen', label: 'Nhà bếp', icon: 'utensils' },
        { key: 'water', label: 'Nước nóng', icon: 'tint' },
        { key: 'laundry', label: 'Máy giặt', icon: 'soap' },
        { key: 'balcony', label: 'Ban công', icon: 'building' },
        { key: 'security', label: 'An ninh', icon: 'shield-alt' }
    ];
    
    amenitiesElement.innerHTML = amenitiesData.map(item => {
        const hasAmenity = amenities[item.key];
        return `
            <div class="flex items-center gap-2 p-3 rounded-lg ${hasAmenity ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}">
                <i class="fas fa-${item.icon} text-lg"></i>
                <span class="flex-1">${item.label}</span>
                ${hasAmenity ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
            </div>
        `;
    }).join('');
}

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + ' triệu';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
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

function getStatusBgColor(status) {
    const colors = {
        'pending': 'bg-yellow-500',
        'available': 'bg-green-500',
        'rented': 'bg-blue-500',
        'inactive': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    const detailElement = document.getElementById('property-detail');
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
    if (detailElement) {
        detailElement.classList.add('hidden');
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

function showError(message) {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="max-w-2xl mx-auto py-20">
                <div class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Lỗi</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex gap-3 justify-center">
                        <a href="/properties" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-home mr-2"></i>Về trang danh sách
                        </a>
                        <a href="/my-properties" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fas fa-list mr-2"></i>Bài đăng của tôi
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}
