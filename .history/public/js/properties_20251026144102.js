/**
 * Properties Page JavaScript
 * Handles property listing with dynamic data from API
 */

let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const itemsPerPage = 9; // 3x3 grid

/**
 * Initialize properties page
 */
async function initPropertiesPage() {
    try {
        await loadProperties();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing properties page:', error);
    }
}

/**
 * Load properties from API
 */
async function loadProperties() {
    try {
        const response = await fetch('/api/properties?status=available');
        const data = await response.json();
        
        if (data.success) {
            allProperties = data.data;
            filteredProperties = [...allProperties];
            renderProperties();
        } else {
            throw new Error(data.message || 'Failed to load properties');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        showError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
    }
}

/**
 * Render properties to grid
 */
function renderProperties() {
    const container = document.getElementById('featuredProperties');
    
    if (!container) {
        console.error('Properties container not found');
        return;
    }
    
    if (filteredProperties.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-home text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Không tìm thấy phòng nào phù hợp</p>
            </div>
        `;
        renderPagination(0, 0);
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    // Render properties
    container.innerHTML = currentProperties.map(property => createPropertyCard(property)).join('');
    
    // Render pagination
    renderPagination(totalPages, filteredProperties.length);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Create property card HTML
 */
function createPropertyCard(property) {
    // Định dạng giá
    const price = (property.price / 1000000).toFixed(1);
    
    // Lấy ảnh đầu tiên hoặc placeholder
    const image = property.images?.[0] || '/images/property-placeholder.jpg';
    
    // Tạo danh sách tiện nghi
    const amenities = [];
    if (property.amenities) {
        if (property.amenities.wifi) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-wifi mr-1"></i>Wifi</span>');
        if (property.amenities.airConditioner) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-snowflake mr-1"></i>Điều hòa</span>');
        if (property.amenities.parking) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-car mr-1"></i>Xe</span>');
        if (property.amenities.kitchen) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-utensils mr-1"></i>Bếp</span>');
        if (property.amenities.waterHeater) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-bolt mr-1"></i>Nóng lạnh</span>');
    }
    
    // Loại phòng
    const typeMap = {
        'phong-tro': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ',
        'chung-cu-mini': 'Chung cư mini'
    };
    const typeLabel = typeMap[property.type] || 'Phòng trọ';
    
    // Badge trạng thái
    const statusBadge = property.status === 'available' 
        ? '<span class="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs rounded-full">Còn trống</span>'
        : '<span class="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Đã thuê</span>';
    
    // Tọa độ từ database
    const lat = property.location?.coordinates?.[1] || 0;
    const lng = property.location?.coordinates?.[0] || 0;
    
    return `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
            <div class="relative">
                <img src="${image}" alt="${property.title}" class="w-full h-56 object-cover" onerror="this.src='/images/property-placeholder.jpg'">
                <span class="absolute top-3 left-3 px-3 py-1 bg-gray-800 text-white text-xs rounded-full">${typeLabel}</span>
                ${statusBadge}
            </div>
            
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${property.title}</h3>
                    <div class="text-right">
                        <div class="text-xl font-bold text-gray-800">${price} triệu</div>
                        <div class="text-xs text-gray-500">/tháng</div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <p class="text-sm text-gray-700 font-medium mb-1">
                        <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${property.address?.street || property.location?.address || 'Chưa cập nhật'}
                    </p>
                    <p class="text-xs text-gray-500 ml-5">
                        ${property.address?.ward ? property.address.ward + ', ' : ''}${property.address?.district || property.location?.district || ''}, ${property.address?.city || property.location?.province || ''}
                    </p>
                </div>
                
                <div class="flex gap-4 mb-4 text-sm text-gray-600">
                    <span><i class="fas fa-expand-arrows-alt mr-1"></i>${property.area || 0}m²</span>
                    <span><i class="fas fa-bed mr-1"></i>${property.bedrooms || 0} phòng ngủ</span>
                    <span><i class="fas fa-bath mr-1"></i>${property.bathrooms || 0} WC</span>
                </div>
                
                ${amenities.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${amenities.slice(0, 3).join('')}
                    </div>
                ` : ''}
                
                <div class="flex gap-2">
                    <button onclick='event.stopPropagation(); event.preventDefault(); showPropertyLocation(${JSON.stringify({
                        id: property._id,
                        lat: lat,
                        lng: lng,
                        title: property.title
                    })})' 
                            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-300"
                            title="Xem vị trí trên bản đồ">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <a href="/properties/${property._id}" class="flex-1 text-center px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-300">
                        Xem chi tiết
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter by type
    const typeSelect = document.querySelector('select[name="type"]');
    if (typeSelect) {
        typeSelect.addEventListener('change', filterProperties);
    }
    
    // Filter by price
    const priceSelect = document.querySelector('select[name="price"]');
    if (priceSelect) {
        priceSelect.addEventListener('change', filterProperties);
    }
    
    // Sort
    const sortSelect = document.querySelector('select[name="sort"]');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortProperties);
    }
}

/**
 * Filter properties
 */
function filterProperties() {
    const typeSelect = document.querySelector('select[name="type"]');
    const priceSelect = document.querySelector('select[name="price"]');
    
    const selectedType = typeSelect?.value || '';
    const selectedPrice = priceSelect?.value || '';
    
    filteredProperties = allProperties.filter(property => {
        // Filter by type
        if (selectedType && property.type !== selectedType) {
            return false;
        }
        
        // Filter by price range
        if (selectedPrice) {
            const price = property.price / 1000000;
            switch(selectedPrice) {
                case 'under-3':
                    if (price >= 3) return false;
                    break;
                case '3-5':
                    if (price < 3 || price >= 5) return false;
                    break;
                case '5-10':
                    if (price < 5 || price >= 10) return false;
                    break;
                case 'over-10':
                    if (price < 10) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // Reset to page 1 when filtering
    currentPage = 1;
    renderProperties();
}

/**
 * Sort properties
 */
function sortProperties() {
    const sortSelect = document.querySelector('select[name="sort"]');
    const sortValue = sortSelect?.value || '';
    
    switch(sortValue) {
        case 'price-asc':
            filteredProperties.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProperties.sort((a, b) => b.price - a.price);
            break;
        case 'area-desc':
            filteredProperties.sort((a, b) => b.area - a.area);
            break;
        case 'newest':
        default:
            filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    // Reset to page 1 when sorting
    currentPage = 1;
    renderProperties();
}

/**
 * Render pagination
 */
function renderPagination(totalPages, totalItems) {
    const paginationContainer = document.querySelector('.flex.justify-center.items-center.space-x-2.mt-12');
    
    if (!paginationContainer || totalPages === 0) {
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button 
            onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changePage(1)" class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                1
            </button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button 
                onclick="changePage(${i})" 
                class="px-4 py-2 ${i === currentPage ? 'bg-gray-800 text-white' : 'bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors duration-300">
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages})" class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button 
            onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''}
            class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Update results count
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    const resultsText = document.querySelector('.text-2xl.font-bold.text-gray-900.mb-2');
    if (resultsText) {
        resultsText.nextElementSibling.textContent = `Hiển thị ${startItem}-${endItem} trong tổng số ${totalItems} phòng`;
    }
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    renderProperties();
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('featuredProperties');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                <p class="text-red-500 text-lg">${message}</p>
                <button onclick="loadProperties()" class="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPropertiesPage);
