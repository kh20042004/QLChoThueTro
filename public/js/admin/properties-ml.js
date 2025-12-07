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
        <div class="p-8 text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p class="text-gray-600">Đang dự đoán giá...</p>
        </div>
    `;
    modal.classList.remove('hidden');

    try {
        // Gọi Flask API
        const prediction = await callFlaskPrediction(property);
        displayPredictionResult(property, prediction);
    } catch (error) {
        console.error('❌ Lỗi dự đoán giá:', error);
        modalContent.innerHTML = `
            <div class="p-8 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                <p class="text-gray-800 font-semibold mb-2">Không thể dự đoán giá</p>
                <p class="text-gray-600 text-sm">${error.message}</p>
                <button onclick="closeMLModal()" class="mt-4 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
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
    
    return warnings;
}

/**
 * Display prediction result in modal
 */
function displayPredictionResult(property, prediction) {
    const modalContent = document.getElementById('mlModalContent');
    
    // Check content quality
    const contentWarnings = checkContentQuality(property);
    
    // Flask API trả về predicted_price_vnd
    const predictedPrice = prediction.predicted_price_vnd || prediction.predicted_price || 0;
    const currentPrice = property.price || 0;
    const difference = predictedPrice - currentPrice;
    const differencePercent = currentPrice > 0 ? (difference / currentPrice * 100) : 0;
    
    console.log('💰 Predicted price:', predictedPrice);
    console.log('💵 Current price:', currentPrice);
    console.log('📊 Difference:', difference, `(${differencePercent.toFixed(1)}%)`);
    
    const comparisonClass = difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600';
    const comparisonIcon = difference > 0 ? 'fa-arrow-up' : difference < 0 ? 'fa-arrow-down' : 'fa-equals';

    modalContent.innerHTML = `
        <div class="p-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center">
                    <i class="fas fa-dollar-sign mr-3 text-blue-600"></i>
                    Dự đoán giá AI
                </h2>
                <button onclick="closeMLModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Property Info -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-800 mb-2">${property.title}</h3>
                <p class="text-sm text-gray-600">${typeof property.address === 'object' ? 
                    `${property.address.street || ''}, ${property.address.ward || ''}, ${property.address.district || ''}, ${property.address.city || ''}` : 
                    property.address || 'N/A'}</p>
                <p class="text-sm text-gray-600 mt-1">Diện tích: ${property.area}m² | Loại: ${property.propertyType}</p>
            </div>

            <!-- Price Prediction -->
            <div class="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div class="text-center mb-4">
                    <p class="text-sm text-gray-600 mb-2">Giá dự đoán AI</p>
                    <p class="text-4xl font-bold text-blue-600">${predictedPrice.toLocaleString('vi-VN')} đ</p>
                    <p class="text-sm text-gray-500 mt-1">/tháng</p>
                </div>
            </div>

            <!-- Price Comparison -->
            <div class="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">So sánh giá</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center p-3 bg-gray-50 rounded">
                        <p class="text-xs text-gray-500 mb-1">Giá hiện tại</p>
                        <p class="text-xl font-bold text-gray-800">${currentPrice.toLocaleString('vi-VN')} đ</p>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded">
                        <p class="text-xs text-gray-500 mb-1">Chênh lệch</p>
                        <p class="text-xl font-bold ${comparisonClass}">
                            <i class="fas ${comparisonIcon} text-sm mr-1"></i>
                            ${Math.abs(difference).toLocaleString('vi-VN')} đ
                        </p>
                        <p class="text-xs ${comparisonClass} mt-1">(${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}%)</p>
                    </div>
                </div>
                ${difference > 0 ? `
                    <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p class="text-sm text-green-800"><i class="fas fa-info-circle mr-1"></i> Giá có thể tăng thêm ${Math.abs(differencePercent).toFixed(1)}%</p>
                    </div>
                ` : difference < 0 ? `
                    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p class="text-sm text-red-800"><i class="fas fa-info-circle mr-1"></i> Giá đang cao hơn dự đoán ${Math.abs(differencePercent).toFixed(1)}%</p>
                    </div>
                ` : `
                    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p class="text-sm text-blue-800"><i class="fas fa-check-circle mr-1"></i> Giá phù hợp với thị trường</p>
                    </div>
                `}
            </div>

            <!-- Content Quality Check -->
            ${contentWarnings.length > 0 ? `
                <div class="mb-6 p-4 ${contentWarnings.some(w => w.level === 'high') ? 'bg-red-50 border-2 border-red-300' : 'bg-yellow-50 border-2 border-yellow-300'} rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center">
                        <i class="fas fa-exclamation-triangle mr-2 ${contentWarnings.some(w => w.level === 'high') ? 'text-red-600' : 'text-yellow-600'}"></i>
                        <span class="${contentWarnings.some(w => w.level === 'high') ? 'text-red-900' : 'text-yellow-900'}">
                            Cảnh báo nội dung
                        </span>
                    </h3>
                    <div class="space-y-2">
                        ${contentWarnings.map(warning => `
                            <div class="flex items-start space-x-2 p-2 bg-white rounded">
                                <i class="fas ${
                                    warning.level === 'high' ? 'fa-times-circle text-red-600' : 
                                    warning.level === 'medium' ? 'fa-exclamation-circle text-yellow-600' : 
                                    'fa-info-circle text-blue-600'
                                } mt-0.5"></i>
                                <div class="flex-1">
                                    <p class="text-sm font-medium ${
                                        warning.level === 'high' ? 'text-red-800' : 
                                        warning.level === 'medium' ? 'text-yellow-800' : 
                                        'text-blue-800'
                                    }">${warning.message}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-3 p-3 bg-white rounded border-l-4 ${contentWarnings.some(w => w.level === 'high') ? 'border-red-500' : 'border-yellow-500'}">
                        <p class="text-sm font-semibold ${contentWarnings.some(w => w.level === 'high') ? 'text-red-900' : 'text-yellow-900'} mb-1">
                            <i class="fas fa-user-shield mr-1"></i>
                            Khuyến nghị cho Admin:
                        </p>
                        <ul class="text-xs ${contentWarnings.some(w => w.level === 'high') ? 'text-red-800' : 'text-yellow-800'} space-y-1 ml-5 list-disc">
                            ${contentWarnings.some(w => w.level === 'high') ? 
                                '<li>Xem xét <strong>TỪ CHỐI</strong> bài đăng này</li>' : 
                                '<li>Liên hệ người đăng để chỉnh sửa</li>'
                            }
                            <li>Kiểm tra kỹ tiêu đề và mô tả trước khi duyệt</li>
                            <li>Xác minh thông tin liên hệ của người đăng</li>
                        </ul>
                    </div>
                </div>
            ` : `
                <div class="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg">
                    <p class="text-sm text-green-800 flex items-center">
                        <i class="fas fa-check-circle mr-2 text-green-600"></i>
                        Nội dung bài đăng hợp lệ, không phát hiện vấn đề
                    </p>
                </div>
            `}

            

            <!-- AI Features Analysis -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Tiện nghi được phân tích</h3>
                <p class="text-xs text-gray-500 mb-2">✅ = Có tiện nghi này | ❌ = Không có</p>
                <div class="grid grid-cols-2 gap-3">
                    ${renderAmenityBadge('Gác', property.amenities?.has_mezzanine || property.amenities?.mezzanine)}
                    ${renderAmenityBadge('WC riêng', property.amenities?.has_wc)}
                    ${renderAmenityBadge('Điều hòa', property.amenities?.has_ac || property.amenities?.ac)}
                    ${renderAmenityBadge('Nội thất', property.amenities?.has_furniture)}
                    ${renderAmenityBadge('Ban công', property.amenities?.has_balcony || property.amenities?.balcony)}
                    ${renderAmenityBadge('Bếp', property.amenities?.has_kitchen || property.amenities?.kitchen)}
                    ${renderAmenityBadge('Chỗ đậu xe', property.amenities?.has_parking || property.amenities?.parking)}
                    ${renderAmenityBadge('Cửa sổ', property.amenities?.has_window)}
                </div>
                <p class="text-xs text-orange-600 mt-3">
                    <i class="fas fa-info-circle mr-1"></i>
                    Lưu ý: Property cũ có thể thiếu thông tin tiện nghi. Vui lòng cập nhật khi đăng tin mới!
                </p>
                </div>
            </div>

            <!-- AI Explanation -->
            ${prediction.explanation ? `
                <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-yellow-600"></i>
                        Giải thích dự đoán
                    </h3>
                    <p class="text-sm text-gray-700">${prediction.explanation}</p>
                    ${prediction.flags && prediction.flags.length > 0 ? `
                        <div class="mt-3">
                            <p class="text-xs font-semibold text-gray-600 mb-1">Cảnh báo:</p>
                            <ul class="list-disc list-inside text-xs text-orange-700 space-y-1">
                                ${prediction.flags.map(flag => `<li>${flag}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <!-- Debug Info (Collapsible) -->
            ${prediction.debug ? `
                <details class="mb-6">
                    <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                        <i class="fas fa-code mr-1"></i> Chi tiết kỹ thuật
                    </summary>
                    <div class="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        <pre class="text-xs text-gray-700 whitespace-pre-wrap">${JSON.stringify(prediction.debug, null, 2)}</pre>
                    </div>
                </details>
            ` : ''}

            <!-- Close Button -->
            <div class="flex justify-end">
                <button onclick="closeMLModal()" class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium">
                    Đóng
                </button>
            </div>
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
    
    // Update modal content
    modalContent.innerHTML = modalHTML;
}

/**
 * Close ML Analysis Modal
 */
function closeMLModal() {
    document.getElementById('mlModal').classList.add('hidden');
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ Chờ duyệt</span>',
        'available': '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Đã duyệt</span>',
        'inactive': '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">❌ Từ chối</span>',
        'rented': '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">🏠 Đã cho thuê</span>'
    };
    return badges[status] || '<span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">❓ N/A</span>';
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
        if (!ruleCheck.pass) {
            showAutoModerationResult(property, {
                approved: false,
                layer: 'Rule-Based',
                reason: ruleCheck.reason,
                score: ruleCheck.score
            });
            return;
        }

        // Layer 2: Content Quality Check (AI)
        const contentCheck = await checkContentQuality(property);
        if (contentCheck.hasIssues) {
            showAutoModerationResult(property, {
                approved: false,
                layer: 'Content AI',
                reason: contentCheck.reason,
                score: contentCheck.score,
                details: contentCheck.details
            });
            return;
        }

        // Layer 3: Price Validation
        const priceCheck = await validatePriceWithAI(property);
        if (!priceCheck.reasonable) {
            showAutoModerationResult(property, {
                approved: false,
                layer: 'Price AI',
                reason: priceCheck.reason,
                score: priceCheck.score,
                predictedPrice: priceCheck.predictedPrice
            });
            return;
        }

        // All checks passed - Auto Approve
        const finalScore = (ruleCheck.score + contentCheck.score + priceCheck.score) / 3;
        showAutoModerationResult(property, {
            approved: true,
            layer: 'All Layers',
            reason: 'Đạt tất cả tiêu chí',
            score: finalScore,
            autoApprove: true
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
        const prediction = await callFlaskPrediction(property);
        const actualPrice = property.price;
        const predictedPrice = prediction.predicted_price_vnd || prediction.predicted_price;

        if (!predictedPrice) {
            return {
                reasonable: false,
                score: 50,
                reason: 'Không thể dự đoán giá để so sánh'
            };
        }

        // Calculate deviation
        const deviation = Math.abs(actualPrice - predictedPrice) / predictedPrice;
        const deviationPercent = deviation * 100;

        // Score based on deviation
        let score;
        if (deviationPercent <= 20) {
            score = 100; // Excellent
        } else if (deviationPercent <= 30) {
            score = 85; // Good
        } else if (deviationPercent <= 50) {
            score = 70; // Acceptable
        } else {
            score = 50; // Poor
        }

        const reasonable = deviationPercent <= 40; // Accept if within 40%

        return {
            reasonable,
            score,
            predictedPrice,
            actualPrice,
            deviation: deviationPercent,
            reason: reasonable 
                ? `Giá hợp lý (chênh lệch ${deviationPercent.toFixed(1)}%)` 
                : `Giá chênh lệch quá lớn (${deviationPercent.toFixed(1)}% so với thị trường)`
        };
    } catch (error) {
        console.error('Price validation error:', error);
        return {
            reasonable: true, // Không reject nếu API lỗi
            score: 70,
            reason: 'Không thể kiểm tra giá (bỏ qua bước này)'
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
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-${statusColor}-600 to-${statusColor}-700 p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold">
                        <i class="fas fa-robot mr-2"></i>
                        Xét duyệt tự động
                    </h2>
                    <button onclick="closeMLModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-${statusIcon} text-4xl mr-4"></i>
                    <div>
                        <p class="text-sm opacity-90">Kết quả</p>
                        <p class="text-2xl font-bold">${statusText}</p>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6">
                <!-- Property Info -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-semibold text-gray-800 mb-2">${property.title}</h3>
                    <p class="text-sm text-gray-600">${formatFullAddress(property.address)}</p>
                    <p class="text-sm text-gray-600 mt-1">Giá: ${formatPrice(property.price)} VNĐ/tháng</p>
                </div>

                <!-- Score -->
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-700">Điểm tổng thể</span>
                        <span class="text-lg font-bold text-${statusColor}-600">${result.score.toFixed(1)}/100</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-${statusColor}-600 h-3 rounded-full transition-all duration-500" 
                             style="width: ${result.score}%"></div>
                    </div>
                </div>

                <!-- Layer Info -->
                <div class="mb-6 p-4 border-l-4 border-${statusColor}-600 bg-${statusColor}-50">
                    <p class="text-sm text-gray-600 mb-1">Lớp kiểm tra</p>
                    <p class="font-semibold text-gray-800">${result.layer}</p>
                    <p class="text-sm text-gray-700 mt-2">${result.reason}</p>
                </div>

                <!-- Details -->
                ${result.details ? `
                    <div class="mb-6">
                        <h4 class="font-semibold text-gray-800 mb-3">Chi tiết phát hiện:</h4>
                        <ul class="space-y-2">
                            ${result.details.map(detail => `
                                <li class="flex items-start">
                                    <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-2"></i>
                                    <span class="text-sm text-gray-700">${detail}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Price Comparison -->
                ${result.predictedPrice ? `
                    <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h4 class="font-semibold text-gray-800 mb-3">So sánh giá:</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">Giá đăng</p>
                                <p class="text-lg font-bold text-gray-800">${formatPrice(result.actualPrice || property.price)} VNĐ</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Giá dự đoán AI</p>
                                <p class="text-lg font-bold text-blue-600">${formatPrice(result.predictedPrice)} VNĐ</p>
                            </div>
                        </div>
                        ${result.deviation !== undefined ? `
                            <p class="text-sm text-gray-600 mt-2">
                                Chênh lệch: <span class="font-semibold">${result.deviation.toFixed(1)}%</span>
                            </p>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Actions -->
                <div class="flex gap-3 pt-4 border-t">
                    ${result.approved && result.autoApprove ? `
                        <button onclick="autoApproveProperty('${property._id}')" 
                                class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">
                            <i class="fas fa-check-circle mr-2"></i>
                            Tự động duyệt bài
                        </button>
                    ` : ''}
                    ${!result.approved ? `
                        <button onclick="rejectProperty('${property._id}')" 
                                class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                            <i class="fas fa-times-circle mr-2"></i>
                            Từ chối bài đăng
                        </button>
                    ` : ''}
                    <button onclick="closeMLModal()" 
                            class="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                        <i class="fas fa-eye mr-2"></i>
                        Xem xét thủ công
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
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
