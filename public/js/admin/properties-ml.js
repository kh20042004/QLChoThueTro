/**
 * ===================================
 * ADMIN PROPERTIES WITH AI PRICE PREDICTION
 * Quản lý properties với dự đoán giá AI
 * ===================================
 */

// Pagination state
let currentPage = 1;
let itemsPerPage = 9; // 3x3 grid
let allProperties = [];
let filteredProperties = []; // Lưu kết quả filter
let propertiesData = []; // Cho modal access

// Flask API endpoint
const FLASK_PREDICT_URL = 'https://mattie-nonencyclopaedic-qualifiedly.ngrok-free.dev/predict';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Admin Properties with AI Price Prediction Module loaded');
    
    checkAdminAuth();
    initSidebar();
    await loadProperties();
    initializeFilters();
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
    }
}

/**
 * Khởi tạo sidebar toggle cho mobile
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
 * Initialize filter event listeners
 */
function initializeFilters() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilterBar');
    const sortFilter = document.getElementById('sortFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

/**
 * Debounce function for search input
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

/**
 * Apply all filters
 */
function applyFilters() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilterBar');
    const sortFilter = document.getElementById('sortFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const sortValue = sortFilter ? sortFilter.value : 'newest';

    console.log('🔍 Applying filters:', { searchTerm, typeValue, statusValue, sortValue });

    // Filter properties
    let filteredProperties = allProperties.filter(property => {
        // Search filter
        const matchSearch = !searchTerm || 
            property.title?.toLowerCase().includes(searchTerm) ||
            property.address?.city?.toLowerCase().includes(searchTerm) ||
            property.address?.district?.toLowerCase().includes(searchTerm) ||
            property.address?.ward?.toLowerCase().includes(searchTerm);

        // Type filter
        const matchType = !typeValue || property.propertyType === typeValue;

        // Status filter
        const matchStatus = !statusValue || property.status === statusValue;

        return matchSearch && matchType && matchStatus;
    });

    // Sort properties
    if (sortValue === 'newest') {
        filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortValue === 'oldest') {
        filteredProperties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === 'price-asc') {
        filteredProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortValue === 'price-desc') {
        filteredProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    console.log(`✅ Filtered: ${filteredProperties.length}/${allProperties.length} properties`);

    // Reset to page 1 when filtering
    currentPage = 1;
    
    // Display filtered results
    displayProperties(filteredProperties, true);
}

/**
 * Load danh sách properties với ML scores
 */
async function loadProperties() {
    try {
        const response = await fetch('/api/admin/properties', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load properties');
        }

        const result = await response.json();
        
        console.log('📊 Admin Properties Loaded:');
        console.log('   Total:', result.count);
        console.log('   By Status:', {
            pending: result.data.filter(p => p.status === 'pending').length,
            available: result.data.filter(p => p.status === 'available').length,
            rented: result.data.filter(p => p.status === 'rented').length,
            inactive: result.data.filter(p => p.status === 'inactive').length
        });
        console.log('   By Moderation:', {
            auto_approved: result.data.filter(p => p.moderationDecision === 'auto_approved').length,
            pending_review: result.data.filter(p => p.moderationDecision === 'pending_review').length,
            rejected: result.data.filter(p => p.moderationDecision === 'rejected').length
        });
        
        displayProperties(result.data);
    } catch (error) {
        console.error('Error loading properties:', error);
        showError('Không thể tải danh sách properties');
    }
}

/**
 * Hiển thị danh sách properties
 */
function displayProperties(properties = filteredProperties, isFilteredData = false) {
    const container = document.getElementById('propertiesGrid');
    if (!container) {
        console.error('❌ Không tìm thấy container propertiesGrid');
        return;
    }

    // CHỈ lưu vào allProperties nếu đây là data gốc từ API (không phải filtered)
    if (!isFilteredData) {
        allProperties = properties;
        filteredProperties = properties;
    } else {
        filteredProperties = properties;
    }
    
    // Luôn lưu vào propertiesData để modal có thể access
    propertiesData = properties;
    
    // Cập nhật stats
    updateStats(allProperties);

    // Không sort lại nếu đã được sort bởi applyFilters
    const sortedProperties = isFilteredData ? properties : (properties || []).sort((a, b) => {
        // Pending lên trước
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        
        // Trong cùng status, sắp xếp theo ML score giảm dần
        return (b.moderationScore || 0) - (a.moderationScore || 0);
    });

    // Calculate pagination
    const totalItems = sortedProperties.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = sortedProperties.slice(startIndex, endIndex);

    // Display current page items
    if (currentItems.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
                <p class="text-gray-500 text-lg">Không có properties nào</p>
            </div>
        `;
    } else {
        container.innerHTML = currentItems.map(property => createPropertyCard(property)).join('');
    }

    // Render pagination
    renderPagination(totalPages, totalItems);
}

/**
 * Render pagination controls
 */
function renderPagination(totalPages, totalItems) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let paginationHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <!-- Info -->
            <div class="text-sm text-gray-600">
                Hiển thị <span class="font-semibold text-gray-900">${startItem}</span> - 
                <span class="font-semibold text-gray-900">${endItem}</span> trong số 
                <span class="font-semibold text-gray-900">${totalItems}</span> properties
            </div>

            <!-- Pagination Buttons -->
            <div class="flex items-center gap-2">
                <!-- Previous Button -->
                <button onclick="goToPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-3 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors">
                    <i class="fas fa-chevron-left"></i>
                </button>

                <!-- Page Numbers -->
                <div class="flex items-center gap-1">
    `;

    // Show first page
    if (currentPage > 3) {
        paginationHTML += `
            <button onclick="goToPage(1)" class="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                1
            </button>
            ${currentPage > 4 ? '<span class="px-2 text-gray-400">...</span>' : ''}
        `;
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        paginationHTML += `
            <button onclick="goToPage(${i})" 
                    class="px-3 py-2 rounded-lg border ${i === currentPage ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors">
                ${i}
            </button>
        `;
    }

    // Show last page
    if (currentPage < totalPages - 2) {
        paginationHTML += `
            ${currentPage < totalPages - 3 ? '<span class="px-2 text-gray-400">...</span>' : ''}
            <button onclick="goToPage(${totalPages})" class="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                ${totalPages}
            </button>
        `;
    }

    paginationHTML += `
                </div>

                <!-- Next Button -->
                <button onclick="goToPage(${currentPage + 1})" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Items per page selector -->
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">Hiển thị:</span>
                <select onchange="changeItemsPerPage(this.value)" 
                        class="px-3 py-2 rounded-lg border bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option value="9" ${itemsPerPage === 9 ? 'selected' : ''}>9</option>
                    <option value="12" ${itemsPerPage === 12 ? 'selected' : ''}>12</option>
                    <option value="18" ${itemsPerPage === 18 ? 'selected' : ''}>18</option>
                    <option value="24" ${itemsPerPage === 24 ? 'selected' : ''}>24</option>
                </select>
            </div>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayProperties(filteredProperties, true);
    
    // Scroll to top of grid
    document.getElementById('propertiesGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Change items per page
 */
function changeItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1; // Reset to first page
    displayProperties(filteredProperties, true);
}

/**
 * Tạo card cho một property
 */
function createPropertyCard(property) {
    const statusBadge = getStatusBadge(property.status);
    
    // Lấy ảnh đầu tiên
    const firstImage = property.images && property.images.length > 0 
        ? property.images[0] 
        : '/images/property-placeholder.jpg';
    
    return `
        <div onclick="viewProperty('${property._id}')" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <!-- Property Image -->
            <div class="relative h-48 overflow-hidden">
                <img src="${firstImage}" alt="${property.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='/images/property-placeholder.jpg'">
                <div class="absolute top-2 right-2">
                    ${statusBadge}
                </div>
            </div>

            <!-- Property Info -->
            <div class="p-4">
                <!-- Title -->
                <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${property.title}</h3>
                <p class="text-sm text-gray-500 mb-3 flex items-center">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${formatFullAddress(property.address)}
                </p>

                <!-- Basic Info Grid -->
                <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-money-bill-wave mr-2 text-pink-500"></i>
                        <span class="font-semibold text-pink-600">${formatPrice(property.price)}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-ruler-combined mr-2"></i>
                        <span>${property.area}m²</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-bed mr-2"></i>
                        <span>${property.bedrooms} phòng ngủ</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-bath mr-2"></i>
                        <span>${property.bathrooms} phòng tắm</span>
                    </div>
                </div>

                <!-- Status Toggle Buttons - Modern UI -->
                <div class="mb-3" onclick="event.stopPropagation()">
                    <div class="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                        <i class="fas fa-circle-dot mr-1.5 text-pink-500"></i>
                        <span>Trạng thái</span>
                        ${property.status === 'pending' ? '<span class="ml-2 text-xs text-yellow-600">(Chỉ sau khi duyệt)</span>' : ''}
                    </div>
                    ${property.status === 'pending' ? `
                        <!-- Pending state - Show locked status buttons -->
                        <div class="grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
                            <div class="relative px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 flex items-center justify-center">
                                <i class="fas fa-lock mr-1.5"></i>
                                <span>Còn trống</span>
                            </div>
                            <div class="relative px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 flex items-center justify-center">
                                <i class="fas fa-lock mr-1.5"></i>
                                <span>Đã thuê</span>
                            </div>
                            <div class="relative px-3 py-2.5 rounded-lg text-xs font-medium bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/30 scale-105">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i class="fas fa-clock animate-spin"></i>
                                    <span>Chờ duyệt</span>
                                </div>
                                <div class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </div>
                            <div class="relative px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 flex items-center justify-center">
                                <i class="fas fa-lock mr-1.5"></i>
                                <span>Tạm ngưng</span>
                            </div>
                        </div>
                    ` : `
                        <!-- Approved state - Show active status buttons -->
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="updatePropertyStatus('${property._id}', 'available')" 
                                    data-status="available"
                                    class="status-btn group relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${property.status === 'available' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'}">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i class="fas fa-check-circle ${property.status === 'available' ? 'animate-pulse' : ''}"></i>
                                    <span>Còn trống</span>
                                </div>
                                ${property.status === 'available' ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>' : ''}
                            </button>
                            
                            <button onclick="updatePropertyStatus('${property._id}', 'rented')" 
                                    data-status="rented"
                                    class="status-btn group relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${property.status === 'rented' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'}">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i class="fas fa-home ${property.status === 'rented' ? 'animate-pulse' : ''}"></i>
                                    <span>Đã thuê</span>
                                </div>
                                ${property.status === 'rented' ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>' : ''}
                            </button>
                            
                            <button onclick="updatePropertyStatus('${property._id}', 'pending')" 
                                    data-status="pending"
                                    class="status-btn group relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i class="fas fa-clock"></i>
                                    <span>Chờ duyệt</span>
                                </div>
                            </button>
                            
                            <button onclick="updatePropertyStatus('${property._id}', 'inactive')" 
                                    data-status="inactive"
                                    class="status-btn group relative px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${property.status === 'inactive' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'}">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i class="fas fa-ban ${property.status === 'inactive' ? 'animate-pulse' : ''}"></i>
                                    <span>Tạm ngưng</span>
                                </div>
                                ${property.status === 'inactive' ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>' : ''}
                            </button>
                        </div>
                    `}
                </div>

                <!-- AI Price Prediction Button -->
                <button onclick="event.stopPropagation(); showPricePrediction('${property._id}')" 
                        class="w-full mb-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-lg text-sm font-medium hover:opacity-80 transition-colors flex items-center justify-center">
                    <i class="fas fa-dollar-sign mr-2"></i>
                    Dự đoán giá AI
                </button>

                <!-- Actions -->
                ${property.status === 'pending' ? `
                    <!-- Auto Moderation Button -->
                    <button onclick="event.stopPropagation(); autoModerateProperty('${property._id}')" 
                            class="w-full mb-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center">
                        <i class="fas fa-robot mr-2"></i>Xét duyệt tự động
                    </button>
                    <!-- Manual Actions -->
                    <div class="flex space-x-2 mb-2" onclick="event.stopPropagation()">
                        <button onclick="approveProperty('${property._id}')" 
                                class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-check mr-2"></i>Duyệt
                        </button>
                        <button onclick="rejectProperty('${property._id}')" 
                                class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-times mr-2"></i>Từ chối
                        </button>
                    </div>
                ` : ''}
                
                <!-- Delete Button - Always show -->
                <div onclick="event.stopPropagation()">
                    <button onclick="deleteProperty('${property._id}')" 
                            class="w-full bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                        <i class="fas fa-trash-alt mr-2"></i>Xóa bài đăng
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Show AI Price Prediction Modal
 */
async function showPricePrediction(propertyId) {
    const property = propertiesData.find(p => p._id === propertyId);
    if (!property) {
        console.error('Property not found:', propertyId);
        return;
    }

    // Show modal with loading state
    const modal = document.getElementById('mlModal');
    const modalContent = document.getElementById('mlModalContent');
    
    modalContent.innerHTML = `
        <div class="admin-modal-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Đang dự đoán giá...</p>
        </div>
    `;
    modal.classList.add('active');

    try {
        // Gọi Flask API
        const prediction = await callFlaskPrediction(property);
        displayPredictionResult(property, prediction);
    } catch (error) {
        console.error('❌ Lỗi dự đoán giá:', error);
        modalContent.innerHTML = `
            <div class="admin-modal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p class="title">Không thể dự đoán giá</p>
                <p class="message">${error.message}</p>
                <button onclick="closeMLModal()" class="admin-modal-btn secondary" style="margin-top: 1rem;">
                    Đóng
                </button>
            </div>
        `;
    }
}

/**
 * Call Flask API for price prediction
 */
async function callFlaskPrediction(property) {
    // Build full address string from property.address object or use directly if string
    let fullAddress = '';
    if (typeof property.address === 'object') {
        fullAddress = `${property.address.street || ''}, ${property.address.ward || ''}, ${property.address.district || ''}, ${property.address.city || ''}`;
    } else {
        fullAddress = property.address || '';
    }
    
    console.log('🔍 Debug property:', property);
    console.log('📍 Full address:', fullAddress);
    console.log('🎯 Amenities:', property.amenities);
    
    // Extract city code
    const cityCode = extractCityCode(fullAddress, property.address);
    console.log('🏙️ City code:', cityCode);
    
    // Validate city code
    if (!cityCode || !['HCM', 'HaNoi', 'DaNang'].includes(cityCode)) {
        throw new Error(`Không thể xác định thành phố từ địa chỉ: "${fullAddress}". Chỉ hỗ trợ HCM, Hà Nội, Đà Nẵng.`);
    }
    
    // Map amenities - fallback từ tên cũ sang has_*
    const amenities = property.amenities || {};
    
    // Build payload theo format Flask API
    const payload = {
        city: cityCode,
        district: extractDistrict(fullAddress, property.address),
        acreage: property.area || 0,
        room_type: mapPropertyTypeToRoomType(property.propertyType, property.isStudio),
        // Map từ database schema (wifi, ac, parking...) sang has_* cho AI
        has_mezzanine: amenities.has_mezzanine || amenities.mezzanine || false,
        has_wc: amenities.has_wc || false, // Không có trong DB cũ
        has_ac: amenities.has_ac || amenities.ac || false,
        has_furniture: amenities.has_furniture || false, // Không có trong DB cũ
        has_balcony: amenities.has_balcony || amenities.balcony || false,
        has_kitchen: amenities.has_kitchen || amenities.kitchen || false,
        has_parking: amenities.has_parking || amenities.parking || false,
        has_window: amenities.has_window || false, // Không có trong DB cũ
        // Thêm address và lat/lng theo yêu cầu Flask API
        address: fullAddress,
        lat: property.location?.coordinates?.[1] || null,
        lng: property.location?.coordinates?.[0] || null
    };

    console.log('📤 Flask API payload:', payload);

    const response = await fetch(FLASK_PREDICT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Flask API error response:', errorText);
        throw new Error(`Flask API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Flask API response:', data);
    return data;
}

/**
 * Check for inappropriate content
 */
function checkContentQuality(property) {
    const warnings = [];
    const title = (property.title || '').toLowerCase();
    const description = (property.description || '').toLowerCase();
    
    // Từ khóa spam/phản cảm
    const spamKeywords = [
        'spam', 'lừa đảo', 'scam', 'hack', 'cheat',
        'xxx', 'sex', 'porn', 'địt', 'đụ', 'vl', 'vcl', 'đm',
        'cút', 'đéo', 'lồn', 'buồi', 'cc', 'dm'
    ];
    
    // Kiểm tra từ khóa không phù hợp
    const foundSpamWords = spamKeywords.filter(word => 
        title.includes(word) || description.includes(word)
    );
    
    if (foundSpamWords.length > 0) {
        warnings.push({
            level: 'high',
            type: 'inappropriate_content',
            message: `Phát hiện từ ngữ không phù hợp: "${foundSpamWords.join(', ')}"`
        });
    }
    
    // === KIỂM TRA TIÊU ĐỀ SPAM/VÔ NGHĨA ===
    // 1. Ký tự lặp lại nhiều (dasdsad, asdasd, ababab...)
    const hasRepeatingPattern = /(.{3,})\1{1,}/.test(title);
    if (hasRepeatingPattern) {
        warnings.push({
            level: 'high',
            type: 'repeating_pattern',
            message: 'Tiêu đề có chuỗi ký tự lặp lại (spam pattern: "dasdsad", "asdasd"...)'
        });
    }
    
    // 2. Quá nhiều phụ âm liên tiếp (không có nguyên âm) - ví dụ: "dsdsds", "fghjkl"
    const consonantClusters = title.match(/[bcdfghjklmnpqrstvwxyz]{6,}/gi);
    if (consonantClusters && consonantClusters.length > 0) {
        warnings.push({
            level: 'high',
            type: 'consonant_spam',
            message: `Tiêu đề chứa chuỗi phụ âm dài không có nghĩa: "${consonantClusters.join(', ')}"`
        });
    }
    
    // 3. Kiểm tra tỷ lệ ký tự giống nhau trong tiêu đề (> 50% là spam)
    const charCount = {};
    for (let char of title.replace(/\s/g, '')) {
        charCount[char] = (charCount[char] || 0) + 1;
    }
    const maxCharCount = Math.max(...Object.values(charCount));
    const titleLength = title.replace(/\s/g, '').length;
    const charRepeatRatio = maxCharCount / titleLength;
    
    if (titleLength > 10 && charRepeatRatio > 0.5) {
        warnings.push({
            level: 'high',
            type: 'char_repetition',
            message: `Một ký tự xuất hiện quá nhiều (${(charRepeatRatio * 100).toFixed(0)}% tiêu đề)`
        });
    }
    
    // Kiểm tra tiêu đề quá ngắn hoặc quá dài
    if (title.length < 10) {
        warnings.push({
            level: 'medium',
            type: 'short_title',
            message: 'Tiêu đề quá ngắn (< 10 ký tự)'
        });
    }
    
    if (title.length > 200) {
        warnings.push({
            level: 'low',
            type: 'long_title',
            message: 'Tiêu đề quá dài (> 200 ký tự)'
        });
    }
    
    // Kiểm tra CAPS LOCK (spam)
    const upperCaseRatio = (title.match(/[A-Z]/g) || []).length / title.length;
    if (upperCaseRatio > 0.5 && title.length > 20) {
        warnings.push({
            level: 'medium',
            type: 'excessive_caps',
            message: 'Quá nhiều chữ IN HOA (có thể spam)'
        });
    }
    
    // Kiểm tra ký tự lặp lại (spam)
    if (/(.)\1{4,}/.test(title) || /(.)\1{4,}/.test(description)) {
        warnings.push({
            level: 'medium',
            type: 'repeated_chars',
            message: 'Ký tự lặp lại nhiều lần (vd: !!!!!!, ????)'
        });
    }
    
    // Kiểm tra mô tả quá ngắn
    if (description.length < 30) {
        warnings.push({
            level: 'medium',
            type: 'short_description',
            message: 'Mô tả quá ngắn (< 30 ký tự)'
        });
    }
    
    // Kiểm tra số điện thoại trong tiêu đề (spam)
    if (/\d{9,11}/.test(title)) {
        warnings.push({
            level: 'medium',
            type: 'phone_in_title',
            message: 'Phát hiện số điện thoại trong tiêu đề'
        });
    }
    
    // Kiểm tra link/URL spam
    if (/https?:\/\/|www\./i.test(title)) {
        warnings.push({
            level: 'high',
            type: 'url_in_title',
            message: 'Phát hiện link/URL trong tiêu đề'
        });
    }
    
    // Calculate score based on warnings
    const highWarnings = warnings.filter(w => w.level === 'high').length;
    const mediumWarnings = warnings.filter(w => w.level === 'medium').length;
    const lowWarnings = warnings.filter(w => w.level === 'low').length;
    
    // Scoring (nghiêm khắc hơn):
    // - Start with 100 points
    // - High warning: -40 points (tăng từ -30)
    // - Medium warning: -20 points (tăng từ -15)
    // - Low warning: -10 points (tăng từ -5)
    let score = 100 - (highWarnings * 40) - (mediumWarnings * 20) - (lowWarnings * 10);
    score = Math.max(0, score); // Không cho điểm âm
    
    const hasIssues = score < 70; // Fail if score < 70
    
    let reason;
    if (hasIssues) {
        reason = `Phát hiện ${warnings.length} vấn đề về chất lượng nội dung`;
    } else {
        reason = 'Nội dung đạt tiêu chuẩn chất lượng';
    }
    
    return {
        hasIssues,
        score,
        reason,
        details: warnings.map(w => w.message)
    };
}

/**
 * Display prediction result in modal
 */
function displayPredictionResult(property, prediction) {
    const modalContent = document.getElementById('mlModalContent');
    
    // Check content quality - returns { hasIssues, score, reason, details }
    const contentCheck = checkContentQuality(property);
    const contentWarnings = contentCheck.details || []; // Array of warning messages
    
    // Flask API trả về predicted_price_vnd
    const predictedPrice = prediction.predicted_price_vnd || prediction.predicted_price || 0;
    const currentPrice = property.price || 0;
    const difference = currentPrice - predictedPrice; // Giá hiện tại - Giá dự đoán
    const differencePercent = predictedPrice > 0 ? (difference / predictedPrice * 100) : 0;
    
    console.log('💰 Predicted price:', predictedPrice);
    console.log('💵 Current price:', currentPrice);
    console.log('📊 Difference:', difference, `(${differencePercent.toFixed(1)}%)`);
    
    const comparisonType = difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral';

    modalContent.innerHTML = `
        <!-- Header -->
        <div class="admin-modal-header">
            <h2 class="admin-modal-title">
                <i class="fas fa-dollar-sign"></i>
                Kết quả dự đoán giá AI
            </h2>
            <button onclick="closeMLModal()" class="admin-modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Property Info -->
        <div class="admin-property-info">
            <h3>${property.title}</h3>
            <p>${typeof property.address === 'object' ? 
                `${property.address.street || ''}, ${property.address.ward || ''}, ${property.address.district || ''}, ${property.address.city || ''}` : 
                property.address || 'N/A'}</p>
            <p>Diện tích: ${property.area}m² | Loại: ${property.propertyType} | ${property.bedrooms} PN | ${property.bathrooms} WC</p>
        </div>

        <!-- Amenities -->
        <div class="admin-property-amenities" style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-list-check" style="color: #667eea;"></i>
                Tiện nghi (theo AI Model)
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem;">
                ${(() => {
                    // ✅ Map từ MongoDB schema sang Flask schema
                    const dbAmenities = property.amenities || {};
                    console.log('🏠 Property amenities từ MongoDB:', dbAmenities);
                    console.log('🤖 Prediction response:', prediction);
                    
                    // Tạo object Flask-compatible từ MongoDB data
                    const flaskAmenities = {
                        has_mezzanine: dbAmenities.has_mezzanine || dbAmenities.mezzanine || false,
                        has_wc: (property.bathrooms || 0) > 0 || dbAmenities.has_wc || dbAmenities.wc || false,
                        has_ac: dbAmenities.has_ac || dbAmenities.ac || false,
                        has_furniture: dbAmenities.has_furniture || dbAmenities.furniture || false,
                        has_balcony: dbAmenities.has_balcony || dbAmenities.balcony || false,
                        has_kitchen: dbAmenities.has_kitchen || dbAmenities.kitchen || false,
                        has_parking: dbAmenities.has_parking || dbAmenities.parking || false,
                        has_window: dbAmenities.has_window || dbAmenities.window || false
                    };
                    
                    console.log('✅ Flask-mapped amenities:', flaskAmenities);
                    
                    // Danh sách tiện nghi theo Flask AI Model
                    const amenityList = [
                        { key: 'has_mezzanine', name: 'Gác lửng', icon: 'fa-layer-group' },
                        { key: 'has_wc', name: 'WC riêng', icon: 'fa-toilet' },
                        { key: 'has_ac', name: 'Điều hòa', icon: 'fa-wind' },
                        { key: 'has_furniture', name: 'Nội thất', icon: 'fa-couch' },
                        { key: 'has_balcony', name: 'Ban công', icon: 'fa-building' },
                        { key: 'has_kitchen', name: 'Bếp', icon: 'fa-utensils' },
                        { key: 'has_parking', name: 'Chỗ đậu xe', icon: 'fa-car' },
                        { key: 'has_window', name: 'Cửa sổ', icon: 'fa-window-maximize' }
                    ];
                    
                    return amenityList.map(({ key, name, icon }) => {
                        const has = flaskAmenities[key] === true || flaskAmenities[key] === 1;
                        return `
                            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: ${has ? '#dcfce7' : '#f3f4f6'}; border: 1px solid ${has ? '#86efac' : '#e5e7eb'}; border-radius: 0.375rem;">
                                <i class="fas ${icon}" style="color: ${has ? '#16a34a' : '#9ca3af'}; font-size: 0.875rem;"></i>
                                <span style="font-size: 0.75rem; color: ${has ? '#166534' : '#6b7280'}; font-weight: ${has ? '600' : '400'};">${name}</span>
                            </div>
                        `;
                    }).join('');
                })()}
            </div>
        </div>

        <!-- Price Prediction -->
        <div class="admin-price-prediction">
            <p class="label">Giá dự đoán AI</p>
            <p class="price">${predictedPrice.toLocaleString('vi-VN')} đ</p>
            <p class="unit">/tháng</p>
        </div>

        <!-- Price Comparison -->
        <div class="admin-price-comparison">
            <h3>So sánh giá</h3>
            <div class="admin-comparison-grid">
                <div class="admin-comparison-item">
                    <p class="label">Giá hiện tại</p>
                    <p class="value">${currentPrice.toLocaleString('vi-VN')} đ</p>
                </div>
                <div class="admin-comparison-item ${comparisonType}">
                    <p class="label">Chênh lệch</p>
                    <p class="value">
                        <i class="fas ${difference > 0 ? 'fa-arrow-up' : difference < 0 ? 'fa-arrow-down' : 'fa-equals'}"></i>
                        ${Math.abs(difference).toLocaleString('vi-VN')} đ
                    </p>
                    <p class="percent">(${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}%)</p>
                </div>
            </div>
            ${difference > 0 ? `
                <div class="admin-alert success">
                    <i class="fas fa-info-circle"></i> Giá có thể tăng thêm ${Math.abs(differencePercent).toFixed(1)}%
                </div>
            ` : difference < 0 ? `
                <div class="admin-alert error">
                    <i class="fas fa-info-circle"></i> Giá đang cao hơn dự đoán ${Math.abs(differencePercent).toFixed(1)}%
                </div>
            ` : `
                <div class="admin-alert info">
                    <i class="fas fa-check-circle"></i> Giá phù hợp với thị trường
                </div>
            `}
        </div>

        <!-- Content Quality Check -->
        ${contentWarnings.length > 0 ? `
            <div class="admin-quality-warnings ${contentCheck.hasIssues ? 'high-severity' : 'medium-severity'}">
                <h3>
                    <i class="fas fa-exclamation-triangle"></i>
                    Cảnh báo nội dung
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${contentWarnings.map(warningText => `
                        <div class="admin-warning-item medium">
                            <i class="fas fa-exclamation-circle"></i>
                            <p class="message">${warningText}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="admin-alert ${contentCheck.hasIssues ? 'error' : 'warning'}" style="margin-top: 1rem;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">
                        <i class="fas fa-user-shield"></i>
                        Khuyến nghị:
                    </p>
                    <ul class="admin-suggestion-list">
                        ${contentCheck.hasIssues ? 
                            '<li>Xem xét <strong>TỪ CHỐI</strong> bài đăng này</li>' : 
                            '<li>Liên hệ người đăng để chỉnh sửa</li>'
                        }
                        <li>Kiểm tra kỹ tiêu đề và mô tả trước khi duyệt</li>
                        <li>Xác minh thông tin liên hệ của người đăng</li>
                    </ul>
                </div>
            </div>
        ` : `
            <div class="admin-alert success">
                <i class="fas fa-check-circle"></i>
                Nội dung bài đăng hợp lệ, không phát hiện vấn đề
            </div>
        `}

        <!-- AI Decision -->
        <div class="admin-decision-box">
            <h3>
                <i class="fas fa-robot"></i>
                Kết quả xét duyệt AI
            </h3>
            ${(() => {
                const hasContentIssues = contentCheck.hasIssues; // score < 70
                const priceDifferenceHigh = Math.abs(differencePercent) > 30;
                
                if (hasContentIssues || priceDifferenceHigh) {
                    return `
                        <span class="admin-decision-status auto-reject">
                            <i class="fas fa-times-circle"></i>
                            ĐỀ XUẤT TỪ CHỐI
                        </span>
                        <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                            ${hasContentIssues ? `Chất lượng nội dung kém (${contentCheck.score}%). ` : ''}
                            ${priceDifferenceHigh ? `Giá chênh lệch quá lớn (${differencePercent.toFixed(1)}%).` : ''}
                        </p>
                    `;
                } else if (contentWarnings.length > 0 || Math.abs(differencePercent) > 15) {
                    return `
                        <span class="admin-decision-status manual-review">
                            <i class="fas fa-clock"></i>
                            CẦN KIỂM TRA THỦ CÔNG
                        </span>
                        <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                            ${contentWarnings.length > 0 ? `Phát hiện ${contentWarnings.length} cảnh báo về nội dung. ` : ''}
                            ${Math.abs(differencePercent) > 15 ? `Giá có sự chênh lệch (${differencePercent.toFixed(1)}%).` : ''}
                        </p>
                    `;
                } else {
                    return `
                        <span class="admin-decision-status auto-approve">
                            <i class="fas fa-check-circle"></i>
                            CÓ THỂ TỰ ĐỘNG DUYỆT
                        </span>
                        <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                            Bài đăng đạt tiêu chuẩn, không phát hiện vấn đề.
                        </p>
                    `;
                }
            })()}
        </div>

        <!-- Action Buttons -->
        <div class="admin-modal-actions">
            <button onclick="window.location.href='/properties/${property._id}'" class="admin-modal-btn view">
                <i class="fas fa-eye"></i>
                Xem chi tiết
            </button>
            <button onclick="closeMLModal()" class="admin-modal-btn secondary">
                Đóng
            </button>
        </div>
    `;
}

/**
 * Helper: Render amenity badge
 */
function renderAmenityBadge(name, hasAmenity) {
    return `
        <div class="flex items-center gap-2 p-2 ${hasAmenity ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'} rounded">
            <i class="fas ${hasAmenity ? 'fa-check-circle text-green-600' : 'fa-times-circle text-gray-400'}"></i>
            <span class="text-sm ${hasAmenity ? 'text-green-800' : 'text-gray-500'}">${name}</span>
        </div>
    `;
}

/**
 * Close ML Analysis Modal
 */
function closeMLModal() {
    document.getElementById('mlModal').classList.remove('active');
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ Chờ duyệt</span>',
        'available': '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Đã duyệt</span>',
        'rejected': '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">❌ Đã từ chối</span>',
        'inactive': '<span class="px-3 py-1 bg-gray-400 text-gray-700 rounded-full text-xs font-semibold">⏸️ Tạm ngưng</span>',
        'rented': '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">🏠 Đã cho thuê</span>'
    };
    return badges[status] || '<span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">❓ Không xác định</span>';
}

/**
 * Format price
 */
function formatPrice(price) {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

/**
 * Format full address
 */
function formatFullAddress(address) {
    if (!address) return 'N/A';
    
    // Nếu address là string thì return luôn
    if (typeof address === 'string') return address;
    
    // Nếu address là object thì ghép các phần lại
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Approve property
 */
async function approveProperty(id) {
    if (!confirm('Bạn có chắc muốn duyệt property này?')) return;

    try {
        const response = await fetch(`/api/admin/properties/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to approve property');
        }

        const result = await response.json();
        
        showSuccess('Đã duyệt property thành công!');
        
        // Cập nhật property trong memory (KHÔNG reload)
        updatePropertyInMemory(id, { 
            status: 'available', 
            moderatedAt: new Date(),
            moderationDecision: 'auto_approved'
        });
        
        // Re-apply filter hiện tại
        applyFilters();
    } catch (error) {
        console.error('Error approving property:', error);
        showError('Không thể duyệt property');
    }
}

/**
 * Reject property
 */
async function rejectProperty(id) {
    if (!confirm('Bạn có chắc muốn từ chối property này?')) return;

    try {
        const response = await fetch(`/api/admin/properties/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to reject property');
        }

        const result = await response.json();
        
        showSuccess('Đã từ chối property thành công!');
        
        // Cập nhật property trong memory (KHÔNG reload)
        updatePropertyInMemory(id, { 
            status: 'inactive',
            moderationDecision: 'rejected'
        });
        
        // Re-apply filter hiện tại
        applyFilters();
    } catch (error) {
        console.error('Error rejecting property:', error);
        showError('Không thể từ chối property');
    }
}

/**
 * Delete property
 */
async function deleteProperty(id) {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này? Hành động này không thể hoàn tác!')) return;

    try {
        const response = await fetch(`/api/admin/properties/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete property');
        }

        const result = await response.json();
        
        showSuccess('Đã xóa bài đăng thành công!');
        
        // Remove property from all arrays
        const propertyIndex = propertiesData.findIndex(p => p._id === id);
        if (propertyIndex !== -1) {
            propertiesData.splice(propertyIndex, 1);
        }
        
        const allIndex = allProperties.findIndex(p => p._id === id);
        if (allIndex !== -1) {
            allProperties.splice(allIndex, 1);
        }
        
        const filteredIndex = filteredProperties.findIndex(p => p._id === id);
        if (filteredIndex !== -1) {
            filteredProperties.splice(filteredIndex, 1);
        }
        
        // Re-render display immediately
        displayProperties();
    } catch (error) {
        console.error('Error deleting property:', error);
        showError('Không thể xóa bài đăng');
    }
}

/**
 * View property details
 */
function viewProperty(id) {
    window.open(`/property/${id}`, '_blank');
}

/**
 * Show success message
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * Show error message
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-0 opacity-100 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            } text-xl"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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

    // Tìm tất cả buttons của property này
    const allButtons = document.querySelectorAll(`button[data-status]`);
    const currentPropertyButtons = Array.from(allButtons).filter(btn => {
        const onclick = btn.getAttribute('onclick');
        return onclick && onclick.includes(propertyId);
    });

    // Lưu trạng thái ban đầu để rollback nếu lỗi
    const originalStates = currentPropertyButtons.map(btn => ({
        btn,
        originalClass: btn.className,
        originalHTML: btn.innerHTML
    }));

    // Disable tất cả buttons và show loading
    currentPropertyButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });

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
            
            // Cập nhật property trong memory
            updatePropertyInMemory(propertyId, { status: newStatus });
            
            // Re-apply filter hiện tại
            applyFilters();
        } else {
            throw new Error(result.error || 'Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showNotification('error', error.message || 'Lỗi khi cập nhật trạng thái!');
        
        // Rollback về trạng thái ban đầu
        originalStates.forEach(({ btn, originalClass, originalHTML }) => {
            btn.className = originalClass;
            btn.innerHTML = originalHTML;
        });
    } finally {
        // Enable lại tất cả buttons
        currentPropertyButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    }
}

/**
 * Cập nhật property trong memory (không reload từ API)
 */
function updatePropertyInMemory(propertyId, updates) {
    // Tìm property trong allProperties
    const propertyIndex = allProperties.findIndex(p => p._id === propertyId);
    
    if (propertyIndex !== -1) {
        // Merge updates vào property
        allProperties[propertyIndex] = {
            ...allProperties[propertyIndex],
            ...updates
        };
        
        console.log(`🔄 Updated property ${propertyId} in memory:`, updates);
    }
}

/**
 * Cập nhật thống kê
 */
function updateStats(properties) {
    // Kiểm tra properties có hợp lệ không
    if (!properties || !Array.isArray(properties)) {
        console.warn('updateStats: properties is undefined or not an array');
        return;
    }
    
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

// ============================================
// AUTO MODERATION FUNCTIONS
// ============================================

/**
 * Auto Moderation - Main Function
 */
async function autoModerateProperty(propertyId) {
    const property = propertiesData.find(p => p._id === propertyId);
    if (!property) {
        showNotification('Không tìm thấy bài đăng', 'error');
        return;
    }

    // Show loading
    showNotification('Đang xét duyệt tự động...', 'info');

    try {
        // Layer 1: Rule-Based Check
        const ruleCheck = checkBasicRules(property);
        
        // Layer 2: Content Quality Check (AI) - Luôn chạy
        const contentCheck = await checkContentQuality(property);
        
        // Layer 3: Price Validation - Luôn chạy
        const priceCheck = await validatePriceWithAI(property);

        // Calculate final score
        const finalScore = (ruleCheck.score + contentCheck.score + priceCheck.score) / 3;

        // === LOGIC PHÂN LOẠI THEO YÊU CẦU ===
        // 1. Điểm < 50: TỰ ĐỘNG TỪ CHỐI (chất lượng quá kém)
        // 2. Điểm 50-85: DUYỆT THỦ CÔNG (cần admin xem xét)
        // 3. Điểm > 85: TỰ ĐỘNG DUYỆT (chất lượng tốt)
        
        let approved = false;
        let autoApprove = false;
        let failedLayer = 'All Layers';
        let failedReason = 'Đạt tất cả tiêu chí';
        
        if (finalScore > 85) {
            // === TỰ ĐỘNG DUYỆT ===
            approved = true;
            autoApprove = true;
            failedLayer = 'All Layers';
            failedReason = `Chất lượng xuất sắc (${finalScore.toFixed(1)}% > 85%) - Tự động duyệt`;
        } else if (finalScore >= 50) {
            // === DUYỆT THỦ CÔNG ===
            approved = false;
            failedLayer = 'Manual Review';
            failedReason = `Điểm trung bình (${finalScore.toFixed(1)}%) - Cần admin xem xét thủ công`;
        } else {
            // === TỰ ĐỘNG TỪ CHỐI ===
            approved = false;
            
            // Xác định layer có vấn đề nghiêm trọng nhất
            if (ruleCheck.score < 50) {
                failedLayer = 'Rule-Based';
                failedReason = `Không đạt tiêu chuẩn cơ bản (${ruleCheck.score.toFixed(0)}%): ${ruleCheck.reason}`;
            } else if (contentCheck.score < 50) {
                failedLayer = 'Content AI';
                failedReason = `Chất lượng nội dung rất kém (${contentCheck.score.toFixed(0)}%): ${contentCheck.reason}`;
            } else if (priceCheck.score < 50) {
                failedLayer = 'Price AI';
                failedReason = `Giá hoàn toàn không hợp lý (${priceCheck.score.toFixed(0)}%): ${priceCheck.reason}`;
            } else {
                failedLayer = 'Overall Score';
                failedReason = `Điểm tổng thể quá thấp (${finalScore.toFixed(1)}% < 50%) - Tự động từ chối`;
            }
        }

        // Show result with all analysis data
        showAutoModerationResult(property, {
            approved: approved,
            layer: failedLayer,
            reason: failedReason,
            score: finalScore,
            details: contentCheck.details,
            predictedPrice: priceCheck.predictedPrice,
            deviation: priceCheck.deviation,
            actualPrice: priceCheck.actualPrice,
            autoApprove: approved, // Chỉ auto approve nếu đạt cả 3 layers
            analysis: {
                ruleCheck: ruleCheck,
                contentCheck: contentCheck,
                priceCheck: priceCheck
            }
        });

    } catch (error) {
        console.error('❌ Auto moderation error:', error);
        showNotification('Lỗi khi xét duyệt tự động: ' + error.message, 'error');
    }
}

/**
 * Layer 1: Rule-Based Check
 */
function checkBasicRules(property) {
    const rules = {
        hasImages: {
            check: (property.images?.length || 0) >= 3,
            weight: 20,
            message: 'Thiếu ảnh (cần >= 3 ảnh)'
        },
        hasDescription: {
            check: (property.description?.length || 0) >= 100,
            weight: 15,
            message: 'Mô tả quá ngắn (cần >= 100 ký tự)'
        },
        validPrice: {
            check: property.price >= 500000 && property.price <= 100000000,
            weight: 20,
            message: 'Giá không hợp lý (500k - 100tr)'
        },
        validArea: {
            check: property.area >= 10 && property.area <= 200,
            weight: 15,
            message: 'Diện tích không hợp lý (10-200m²)'
        },
        hasCoordinates: {
            check: property.location?.coordinates?.length === 2,
            weight: 15,
            message: 'Thiếu tọa độ địa chỉ'
        },
        hasContact: {
            check: property.contact?.phone?.length >= 10,
            weight: 15,
            message: 'Thiếu số điện thoại hợp lệ'
        }
    };

    let totalScore = 0;
    let maxScore = 0;
    const failedRules = [];

    for (const [key, rule] of Object.entries(rules)) {
        maxScore += rule.weight;
        if (rule.check) {
            totalScore += rule.weight;
        } else {
            failedRules.push(rule.message);
        }
    }

    const scorePercent = (totalScore / maxScore) * 100;
    const pass = scorePercent >= 70; // Cần đạt 70% để pass

    return {
        pass,
        score: scorePercent,
        reason: pass ? 'Đạt tiêu chuẩn cơ bản' : `Không đạt: ${failedRules.join(', ')}`,
        failedRules
    };
}

/**
 * Layer 3: Price Validation with AI
 */
async function validatePriceWithAI(property) {
    try {
        console.log('💰 Starting price validation for property:', property._id);
        const prediction = await callFlaskPrediction(property);
        const actualPrice = property.price;
        const predictedPrice = prediction.predicted_price_vnd || prediction.predicted_price;

        console.log('💵 Actual price:', actualPrice);
        console.log('🤖 Predicted price:', predictedPrice);

        if (!predictedPrice) {
            console.warn('⚠️ No predicted price returned from API');
            return {
                reasonable: true, // Không reject nếu không có dự đoán
                score: 70,
                reason: 'Không thể dự đoán giá để so sánh (bỏ qua bước này)',
                predictedPrice: null,
                actualPrice: actualPrice,
                deviation: null
            };
        }

        // Calculate deviation (% chênh lệch)
        const deviation = ((actualPrice - predictedPrice) / predictedPrice) * 100;
        const absDeviation = Math.abs(deviation);

        console.log('📊 Price deviation:', deviation.toFixed(2) + '%');

        // Score based on deviation
        let score;
        if (absDeviation <= 15) {
            score = 100; // Excellent - chênh lệch <= 15%
        } else if (absDeviation <= 25) {
            score = 90; // Very Good - chênh lệch 15-25%
        } else if (absDeviation <= 35) {
            score = 80; // Good - chênh lệch 25-35%
        } else if (absDeviation <= 50) {
            score = 70; // Acceptable - chênh lệch 35-50%
        } else {
            score = 50; // Poor - chênh lệch > 50%
        }

        const reasonable = absDeviation <= 40; // Accept if within 40%

        let reason;
        if (reasonable) {
            if (absDeviation <= 15) {
                reason = `Giá rất hợp lý với thị trường (chênh lệch chỉ ${absDeviation.toFixed(1)}%)`;
            } else if (absDeviation <= 25) {
                reason = `Giá khá hợp lý với thị trường (chênh lệch ${absDeviation.toFixed(1)}%)`;
            } else {
                reason = `Giá chấp nhận được (chênh lệch ${absDeviation.toFixed(1)}%)`;
            }
        } else {
            reason = `Giá chênh lệch quá lớn so với thị trường (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%). ` +
                     `${deviation > 0 ? 'Giá đăng cao hơn dự đoán AI' : 'Giá đăng thấp hơn dự đoán AI'}`;
        }

        console.log('✅ Price validation result:', { reasonable, score, deviation: deviation.toFixed(1) });

        return {
            reasonable,
            score,
            predictedPrice,
            actualPrice,
            deviation,
            reason
        };
    } catch (error) {
        console.error('❌ Price validation error:', error);
        // Không reject nếu API lỗi, chỉ log warning
        return {
            reasonable: true,
            score: 70,
            reason: 'Không thể kết nối đến AI dự đoán giá (bỏ qua bước này)',
            predictedPrice: null,
            actualPrice: property.price,
            deviation: null,
            error: error.message
        };
    }
}

/**
 * Show Auto Moderation Result Modal
 */
function showAutoModerationResult(property, result) {
    const modal = document.getElementById('mlModal');
    const modalContent = document.getElementById('mlModalContent');

    const statusColor = result.approved ? 'green' : 'red';
    const statusIcon = result.approved ? 'check-circle' : 'times-circle';
    const statusText = result.approved ? 'ĐỀ XUẤT DUYỆT' : 'ĐỀ XUẤT TỪ CHỐI';

    modalContent.innerHTML = `
        <!-- Header với gradient -->
        <div style="background: linear-gradient(135deg, ${statusColor === 'green' ? '#10b981, #059669' : '#ef4444, #dc2626'}); 
                    color: white; 
                    padding: 2rem; 
                    margin: -1.5rem -1.5rem 0 -1.5rem; 
                    border-radius: 12px 12px 0 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <i class="fas fa-robot" style="font-size: 1.75rem;"></i>
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0;">Kết quả xét duyệt tự động</h2>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.15); 
                                padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
                        <i class="fas fa-${statusIcon}" style="font-size: 3rem;"></i>
                        <div>
                            <p style="font-size: 0.875rem; opacity: 0.95; margin: 0;">Kết luận</p>
                            <p style="font-size: 1.75rem; font-weight: 700; margin: 0.25rem 0 0 0;">${statusText}</p>
                            <p style="font-size: 0.875rem; opacity: 0.9; margin: 0.25rem 0 0 0;">Điểm: ${result.score ? result.score.toFixed(1) : '0'}/100</p>
                        </div>
                    </div>
                </div>
                <button onclick="closeMLModal()" 
                        style="background: rgba(255,255,255,0.2); 
                               border: 2px solid rgba(255,255,255,0.3);
                               color: white; 
                               cursor: pointer; 
                               font-size: 1.5rem; 
                               width: 2.5rem;
                               height: 2.5rem;
                               border-radius: 50%;
                               display: flex;
                               align-items: center;
                               justify-content: center;
                               transition: all 0.2s;
                               margin-left: 1rem;"
                        onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <!-- Content Container -->
        <div style="padding: 1.5rem;">
            
            <!-- Property Info Card -->
            <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); 
                        border-left: 4px solid #3b82f6;
                        padding: 1.25rem; 
                        border-radius: 8px; 
                        margin-bottom: 1.5rem;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: start; gap: 1rem;">
                    <i class="fas fa-home" style="color: #3b82f6; font-size: 1.5rem; margin-top: 0.25rem;"></i>
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">${property.title}</h3>
                        <p style="font-size: 0.875rem; color: #64748b; margin: 0.25rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-map-marker-alt" style="color: #94a3b8;"></i>
                            ${formatFullAddress(property.address)}
                        </p>
                        <p style="font-size: 1rem; font-weight: 700; color: #10b981; margin: 0.5rem 0 0 0; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-tag" style="font-size: 0.875rem;"></i>
                            ${formatPrice(property.price)} VNĐ/tháng
                        </p>
                    </div>
                </div>
            </div>

            <!-- Score Progress -->
            <div style="background: white; 
                        padding: 1.25rem; 
                        border-radius: 8px; 
                        margin-bottom: 1.5rem;
                        border: 2px solid ${statusColor === 'green' ? '#d1fae5' : '#fee2e2'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.875rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                        <i class="fas fa-chart-line" style="margin-right: 0.5rem;"></i>
                        Điểm đánh giá tổng thể
                    </span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: ${statusColor === 'green' ? '#059669' : '#dc2626'};">
                        ${result.score ? result.score.toFixed(1) : '0'}<span style="font-size: 1rem; color: #94a3b8;">/100</span>
                    </span>
                </div>
                <div style="width: 100%; background-color: #e5e7eb; border-radius: 9999px; height: 1rem; overflow: hidden; position: relative;">
                    <div style="background: linear-gradient(90deg, ${statusColor === 'green' ? '#10b981, #059669' : '#ef4444, #dc2626'}); 
                                height: 1rem; 
                                border-radius: 9999px; 
                                width: ${result.score}%; 
                                transition: width 0.8s ease-out;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                </div>
            </div>

            <!-- Layer Info -->
            <div style="background: ${statusColor === 'green' ? '#d1fae5' : '#fee2e2'}; 
                        border-left: 4px solid ${statusColor === 'green' ? '#059669' : '#dc2626'}; 
                        padding: 1.25rem; 
                        border-radius: 8px;
                        margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: start; gap: 1rem;">
                    <i class="fas fa-layer-group" style="color: ${statusColor === 'green' ? '#059669' : '#dc2626'}; font-size: 1.25rem; margin-top: 0.125rem;"></i>
                    <div style="flex: 1;">
                        <p style="font-size: 0.75rem; color: ${statusColor === 'green' ? '#065f46' : '#991b1b'}; margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
                            Lớp kiểm tra
                        </p>
                        <p style="font-weight: 700; color: ${statusColor === 'green' ? '#047857' : '#b91c1c'}; margin: 0 0 0.5rem 0; font-size: 1rem;">
                            ${result.layer}
                        </p>
                        <p style="font-size: 0.875rem; color: ${statusColor === 'green' ? '#065f46' : '#991b1b'}; margin: 0; line-height: 1.5;">
                            ${result.reason}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Details -->
            ${result.details ? `
                <div style="background: #fffbeb; 
                            border: 2px solid #fcd34d;
                            border-radius: 8px; 
                            padding: 1.25rem;
                            margin-bottom: 1.5rem;">
                    <h4 style="font-weight: 700; color: #78350f; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Chi tiết phát hiện
                    </h4>
                    <ul style="margin: 0; padding: 0; list-style: none;">
                        ${result.details.map(detail => `
                            <li style="padding: 0.5rem 0; 
                                       padding-left: 1.75rem; 
                                       position: relative; 
                                       font-size: 0.875rem; 
                                       color: #92400e;
                                       border-bottom: 1px solid #fef3c7;
                                       line-height: 1.5;">
                                <i class="fas fa-circle" style="position: absolute; left: 0.5rem; top: 0.875rem; font-size: 0.375rem; color: #f59e0b;"></i>
                                ${detail}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Detailed Analysis Section -->
            ${result.analysis ? `
                <div style="background: white; 
                            border: 2px solid #e5e7eb;
                            border-radius: 8px; 
                            padding: 1.5rem;
                            margin-bottom: 1.5rem;">
                    <h4 style="font-weight: 700; color: #1e293b; margin: 0 0 1.25rem 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem;">
                        <i class="fas fa-microscope" style="color: #3b82f6;"></i>
                        Phân tích chi tiết từ AI
                    </h4>
                    
                    <!-- Layer 1: Rule-Based -->
                    ${result.analysis.ruleCheck ? `
                        <div style="margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #f1f5f9;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                                <h5 style="font-weight: 600; color: #475569; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem;">
                                    <span style="background: ${result.analysis.ruleCheck.pass ? '#d1fae5' : '#fee2e2'}; 
                                                 color: ${result.analysis.ruleCheck.pass ? '#065f46' : '#991b1b'};
                                                 width: 1.5rem;
                                                 height: 1.5rem;
                                                 border-radius: 50%;
                                                 display: inline-flex;
                                                 align-items: center;
                                                 justify-content: center;
                                                 font-size: 0.75rem;">
                                        ${result.analysis.ruleCheck.pass ? '✓' : '✗'}
                                    </span>
                                    Layer 1: Kiểm tra quy tắc cơ bản
                                </h5>
                                <span style="font-weight: 700; color: ${result.analysis.ruleCheck.pass ? '#059669' : '#dc2626'}; font-size: 0.875rem;">
                                    ${result.analysis.ruleCheck.score ? result.analysis.ruleCheck.score.toFixed(0) : '0'}%
                                </span>
                            </div>
                            <div style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; border-left: 3px solid ${result.analysis.ruleCheck.pass ? '#10b981' : '#ef4444'};">
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; line-height: 1.6;">
                                    ${result.analysis.ruleCheck.reason}
                                </p>
                                ${result.analysis.ruleCheck.failedRules && result.analysis.ruleCheck.failedRules.length > 0 ? `
                                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.25rem; list-style: disc;">
                                        ${result.analysis.ruleCheck.failedRules.map(rule => `
                                            <li style="color: #dc2626; font-size: 0.8125rem; margin: 0.25rem 0;">${rule}</li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Layer 2: Content Quality -->
                    ${result.analysis.contentCheck ? `
                        <div style="margin-bottom: 1.25rem; padding-bottom: 1.25rem; ${result.analysis.priceCheck ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                                <h5 style="font-weight: 600; color: #475569; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem;">
                                    <span style="background: ${!result.analysis.contentCheck.hasIssues ? '#d1fae5' : '#fee2e2'}; 
                                                 color: ${!result.analysis.contentCheck.hasIssues ? '#065f46' : '#991b1b'};
                                                 width: 1.5rem;
                                                 height: 1.5rem;
                                                 border-radius: 50%;
                                                 display: inline-flex;
                                                 align-items: center;
                                                 justify-content: center;
                                                 font-size: 0.75rem;">
                                        ${!result.analysis.contentCheck.hasIssues ? '✓' : '✗'}
                                    </span>
                                    Layer 2: Kiểm tra chất lượng nội dung (AI)
                                </h5>
                                <span style="font-weight: 700; color: ${!result.analysis.contentCheck.hasIssues ? '#059669' : '#dc2626'}; font-size: 0.875rem;">
                                    ${result.analysis.contentCheck.score ? result.analysis.contentCheck.score.toFixed(0) : '0'}%
                                </span>
                            </div>
                            <div style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; border-left: 3px solid ${!result.analysis.contentCheck.hasIssues ? '#10b981' : '#ef4444'};">
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; line-height: 1.6;">
                                    ${result.analysis.contentCheck.reason}
                                </p>
                                ${result.analysis.contentCheck.details && result.analysis.contentCheck.details.length > 0 ? `
                                    <div style="margin-top: 0.75rem;">
                                        <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.5rem 0; font-weight: 600; text-transform: uppercase;">
                                            Vấn đề phát hiện:
                                        </p>
                                        <ul style="margin: 0; padding-left: 1.25rem; list-style: disc;">
                                            ${result.analysis.contentCheck.details.map(detail => `
                                                <li style="color: #f59e0b; font-size: 0.8125rem; margin: 0.25rem 0;">${detail}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Layer 3: Price Validation -->
                    ${result.analysis.priceCheck ? `
                        <div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                                <h5 style="font-weight: 600; color: #475569; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem;">
                                    <span style="background: ${result.analysis.priceCheck.reasonable ? '#d1fae5' : '#fee2e2'}; 
                                                 color: ${result.analysis.priceCheck.reasonable ? '#065f46' : '#991b1b'};
                                                 width: 1.5rem;
                                                 height: 1.5rem;
                                                 border-radius: 50%;
                                                 display: inline-flex;
                                                 align-items: center;
                                                 justify-content: center;
                                                 font-size: 0.75rem;">
                                        ${result.analysis.priceCheck.reasonable ? '✓' : '✗'}
                                    </span>
                                    Layer 3: Kiểm tra giá cả (AI)
                                </h5>
                                <span style="font-weight: 700; color: ${result.analysis.priceCheck.reasonable ? '#059669' : '#dc2626'}; font-size: 0.875rem;">
                                    ${result.analysis.priceCheck.score ? result.analysis.priceCheck.score.toFixed(0) : '0'}%
                                </span>
                            </div>
                            <div style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; border-left: 3px solid ${result.analysis.priceCheck.reasonable ? '#10b981' : '#ef4444'};">
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; line-height: 1.6;">
                                    ${result.analysis.priceCheck.reason}
                                </p>
                                ${result.analysis.priceCheck.predictedPrice ? `
                                    <div style="margin-top: 0.75rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                                        <div style="background: white; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                            <p style="font-size: 0.6875rem; color: #94a3b8; margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">
                                                Giá đăng
                                            </p>
                                            <p style="font-size: 0.9375rem; font-weight: 700; color: #1e293b; margin: 0;">
                                                ${formatPrice(result.analysis.priceCheck.actualPrice || property.price)}
                                            </p>
                                        </div>
                                        <div style="background: white; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                            <p style="font-size: 0.6875rem; color: #94a3b8; margin: 0 0 0.25rem 0; text-transform: uppercase; font-weight: 600;">
                                                Giá AI dự đoán
                                            </p>
                                            <p style="font-size: 0.9375rem; font-weight: 700; color: #2563eb; margin: 0;">
                                                ${formatPrice(result.analysis.priceCheck.predictedPrice)}
                                            </p>
                                        </div>
                                    </div>
                                    ${result.analysis.priceCheck.deviation !== null && result.analysis.priceCheck.deviation !== undefined ? `
                                        <div style="margin-top: 0.75rem; background: ${Math.abs(result.analysis.priceCheck.deviation) > 30 ? '#fef2f2' : '#f0fdf4'}; 
                                                    padding: 0.5rem; 
                                                    border-radius: 4px;
                                                    text-align: center;
                                                    border: 1px solid ${Math.abs(result.analysis.priceCheck.deviation) > 30 ? '#fecaca' : '#bbf7d0'};">
                                            <p style="font-size: 0.8125rem; color: ${Math.abs(result.analysis.priceCheck.deviation) > 30 ? '#991b1b' : '#065f46'}; margin: 0;">
                                                <i class="fas fa-${Math.abs(result.analysis.priceCheck.deviation) > 30 ? 'exclamation-triangle' : 'check-circle'}" 
                                                   style="margin-right: 0.375rem;"></i>
                                                Chênh lệch: <strong>${result.analysis.priceCheck.deviation > 0 ? '+' : ''}${result.analysis.priceCheck.deviation.toFixed(1)}%</strong>
                                                ${Math.abs(result.analysis.priceCheck.deviation) > 30 ? ' (Cao hơn ngưỡng 30%)' : ' (Trong ngưỡng chấp nhận)'}
                                            </p>
                                        </div>
                                    ` : `
                                        <div style="margin-top: 0.75rem; background: #fef3c7; 
                                                    padding: 0.5rem; 
                                                    border-radius: 4px;
                                                    text-align: center;
                                                    border: 1px solid #fcd34d;">
                                            <p style="font-size: 0.8125rem; color: #92400e; margin: 0;">
                                                <i class="fas fa-info-circle" style="margin-right: 0.375rem;"></i>
                                                Không có dữ liệu so sánh giá
                                            </p>
                                        </div>
                                    `}
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Overall Conclusion -->
                    <div style="margin-top: 1.5rem; 
                                padding: 1rem; 
                                background: linear-gradient(135deg, ${result.approved ? '#d1fae5, #a7f3d0' : '#fee2e2, #fecaca'}); 
                                border-radius: 8px;
                                border: 2px solid ${result.approved ? '#6ee7b7' : '#fca5a5'};">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-${result.approved ? 'check-circle' : 'times-circle'}" 
                               style="font-size: 2rem; color: ${result.approved ? '#059669' : '#dc2626'};"></i>
                            <div>
                                <p style="font-weight: 700; color: ${result.approved ? '#065f46' : '#991b1b'}; margin: 0; font-size: 0.9375rem;">
                                    Kết luận AI
                                </p>
                                <p style="font-size: 0.8125rem; color: ${result.approved ? '#047857' : '#b91c1c'}; margin: 0.25rem 0 0 0; line-height: 1.5;">
                                    ${result.approved 
                                        ? 'Bài đăng đạt tất cả tiêu chuẩn và có thể được tự động duyệt.' 
                                        : `Bài đăng không đạt tiêu chuẩn tại lớp kiểm tra "${result.layer}". Cần xem xét thủ công hoặc từ chối.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

        </div>

        <!-- Action Buttons -->
        <div style="background: #f8fafc; 
                    padding: 1.5rem; 
                    margin: 0 -1.5rem -1.5rem -1.5rem; 
                    border-radius: 0 0 12px 12px; 
                    border-top: 2px solid #e2e8f0;
                    display: flex; 
                    gap: 0.75rem; 
                    justify-content: flex-end;">
            ${result.approved && result.autoApprove ? `
                <button onclick="autoApproveProperty('${property._id}')" 
                        style="background: linear-gradient(135deg, #10b981, #059669); 
                               color: white;
                               padding: 0.875rem 1.75rem;
                               border-radius: 8px;
                               font-weight: 600;
                               font-size: 0.875rem;
                               cursor: pointer;
                               border: none;
                               display: inline-flex;
                               align-items: center;
                               gap: 0.5rem;
                               transition: all 0.2s;
                               box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px -2px rgba(16, 185, 129, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.3)'">
                    <i class="fas fa-check-circle"></i>
                    Tự động duyệt bài
                </button>
            ` : ''}
            ${!result.approved ? `
                <button onclick="rejectProperty('${property._id}')" 
                        style="background: linear-gradient(135deg, #ef4444, #dc2626); 
                               color: white;
                               padding: 0.875rem 1.75rem;
                               border-radius: 8px;
                               font-weight: 600;
                               font-size: 0.875rem;
                               cursor: pointer;
                               border: none;
                               display: inline-flex;
                               align-items: center;
                               gap: 0.5rem;
                               transition: all 0.2s;
                               box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px -2px rgba(239, 68, 68, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(239, 68, 68, 0.3)'">
                    <i class="fas fa-times-circle"></i>
                    Từ chối bài đăng
                </button>
            ` : ''}
            <button onclick="closeMLModal()" 
                    style="background: linear-gradient(135deg, #64748b, #475569); 
                           color: white;
                           padding: 0.875rem 1.75rem;
                           border-radius: 8px;
                           font-weight: 600;
                           font-size: 0.875rem;
                           cursor: pointer;
                           border: none;
                           display: inline-flex;
                           align-items: center;
                           gap: 0.5rem;
                           transition: all 0.2s;
                           box-shadow: 0 4px 6px -1px rgba(100, 116, 139, 0.3);"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px -2px rgba(100, 116, 139, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(100, 116, 139, 0.3)'">
                <i class="fas fa-eye"></i>
                Xem xét thủ công
            </button>
        </div>
    `;

    modal.classList.add('active');
}

/**
 * Auto Approve Property
 */
async function autoApproveProperty(propertyId) {
    try {
        await updatePropertyStatus(propertyId, 'available');
        showNotification('Đã tự động duyệt bài đăng', 'success');
        closeMLModal();
        await loadProperties();
    } catch (error) {
        showNotification('Lỗi khi duyệt bài: ' + error.message, 'error');
    }
}

/**
 * Reject Property
 */
async function rejectProperty(propertyId) {
    const reason = prompt('Nhập lý do từ chối (tùy chọn):');
    
    if (reason === null) return; // User cancelled

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/properties/${propertyId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                status: 'rejected',
                reason: reason || 'Bài đăng không đạt tiêu chuẩn'
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Đã từ chối bài đăng và gửi thông báo cho người đăng', 'success');
            closeMLModal();
            await loadProperties();
        } else {
            showNotification('Lỗi khi từ chối bài: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error rejecting property:', error);
        showNotification('Lỗi khi từ chối bài: ' + error.message, 'error');
    }
}

/**
 * Bulk Auto Moderation - Process all pending properties
 */
async function bulkAutoModeration() {
    const pendingProperties = propertiesData.filter(p => p.status === 'pending');
    
    if (pendingProperties.length === 0) {
        showNotification('Không có bài đăng nào chờ duyệt', 'info');
        return;
    }

    if (!confirm(`Xét duyệt tự động ${pendingProperties.length} bài đăng chờ duyệt?`)) {
        return;
    }

    showNotification(`Đang xét duyệt ${pendingProperties.length} bài đăng...`, 'info');

    let approved = 0;
    let rejected = 0;
    let errors = 0;

    for (const property of pendingProperties) {
        try {
            // Quick rule check only (no AI for bulk)
            const ruleCheck = checkBasicRules(property);
            
            if (ruleCheck.pass && ruleCheck.score >= 85) {
                await updatePropertyStatus(property._id, 'available');
                approved++;
            } else {
                rejected++;
            }
        } catch (error) {
            console.error('Error processing:', property._id, error);
            errors++;
        }
    }

    await loadProperties();
    showNotification(
        `Hoàn thành: ${approved} duyệt, ${rejected} từ chối, ${errors} lỗi`,
        'success'
    );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper: Extract city code from address
 */
function extractCityCode(addressString, addressObj) {
    // Ưu tiên dùng addressObj.city nếu có
    if (addressObj && typeof addressObj === 'object' && addressObj.city) {
        const city = addressObj.city.toLowerCase();
        if (city.includes('hồ chí minh') || city.includes('hcm') || city.includes('tp.hcm')) {
            return 'HCM';
        } else if (city.includes('hà nội') || city.includes('hanoi')) {
            return 'HaNoi';
        } else if (city.includes('đà nẵng') || city.includes('da nang')) {
            return 'DaNang';
        }
    }
    
    // Fallback: parse từ string
    if (!addressString || typeof addressString !== 'string') return '';
    
    const addressLower = addressString.toLowerCase();
    if (addressLower.includes('hồ chí minh') || addressLower.includes('hcm') || addressLower.includes('tp.hcm')) {
        return 'HCM';
    } else if (addressLower.includes('hà nội') || addressLower.includes('hanoi')) {
        return 'HaNoi';
    } else if (addressLower.includes('đà nẵng') || addressLower.includes('da nang')) {
        return 'DaNang';
    }
    return '';
}

/**
 * Helper: Extract district from address
 */
function extractDistrict(addressString, addressObj) {
    // Ưu tiên dùng addressObj.district nếu có
    if (addressObj && typeof addressObj === 'object' && addressObj.district) {
        return addressObj.district;
    }
    
    // Fallback: parse từ string
    if (!addressString || typeof addressString !== 'string') return '';
    
    // Parse "..., Quận 1, TP.HCM" -> "Quận 1"
    const parts = addressString.split(',').map(p => p.trim());
    for (let part of parts) {
        if (part.toLowerCase().includes('quận') || part.toLowerCase().includes('huyện')) {
            return part;
        }
    }
    return '';
}

/**
 * Helper: Map propertyType to room_type for Flask API
 */
function mapPropertyTypeToRoomType(propertyType, isStudio) {
    if (isStudio) {
        return 'Studio';
    }
    
    const type = (propertyType || '').toLowerCase();
    if (type.includes('phong-tro') || type.includes('homestay')) {
        return 'Phòng trọ';
    } else if (type.includes('can-ho') || type.includes('chung-cu') || type.includes('nha-nguyen-can')) {
        return 'Căn hộ dịch vụ';
    }
    return 'Phòng trọ'; // Default
}
