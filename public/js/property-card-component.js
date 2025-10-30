/**
 * ===================================
 * PROPERTY CARD COMPONENT EXAMPLE
 * Cách thêm chức năng yêu thích vào property cards
 * ===================================
 */

/**
 * Hàm tạo property card HTML với chức năng yêu thích
 */
function createPropertyCard(property) {
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : '/images/property-default.jpg';
  
  const price = new Intl.NumberFormat('vi-VN').format(property.price);
  
  return `
    <div class="property-card group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <!-- Image Container -->
      <div class="relative overflow-hidden bg-gray-200 h-48">
        <img src="${imageUrl}" 
             alt="${property.title}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
        
        <!-- Favorite Button (Top Left) -->
        <button onclick="handleFavoriteBadge(event, '${property._id}')" 
                class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-all duration-200 shadow-md"
                title="Thêm yêu thích">
          <i class="far fa-heart text-xl text-gray-600 hover:text-red-500 transition-colors" 
             data-favorite-property="${property._id}"></i>
        </button>
        
        <!-- Status Badge (Top Right) -->
        <div class="absolute top-3 right-3">
          <span class="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            ${property.type || 'Phòng'}
          </span>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-4">
        <!-- Title & Price -->
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-bold text-gray-800 flex-1">
            ${property.title}
          </h3>
          <div class="text-right whitespace-nowrap ml-2">
            <div class="text-lg font-bold text-blue-600">
              ${price}
            </div>
            <small class="text-gray-500">/tháng</small>
          </div>
        </div>
        
        <!-- Location -->
        <p class="text-sm text-gray-600 mb-3">
          <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>
          ${property.address}
        </p>
        
        <!-- Features -->
        <div class="flex justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
          <span>
            <i class="fas fa-door-open mr-1"></i>
            ${property.bedrooms || 'N/A'} phòng
          </span>
          <span>
            <i class="fas fa-square mr-1"></i>
            ${property.area || 'N/A'} m²
          </span>
          <span>
            <i class="fas fa-users mr-1"></i>
            Max ${property.maxPeople || 'N/A'}
          </span>
        </div>
        
        <!-- Description -->
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">
          ${property.description || 'Không có mô tả'}
        </p>
        
        <!-- Actions -->
        <div class="flex gap-2">
          <a href="/properties/${property._id}" 
             class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-center font-medium hover:bg-blue-600 transition-colors duration-200">
            <i class="fas fa-eye mr-1"></i>Xem chi tiết
          </a>
          <button onclick="handleFavoriteBadge(event, '${property._id}')" 
                  class="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200"
                  title="Thêm yêu thích">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hàm render grid danh sách property
 */
function renderPropertyGrid(container, properties) {
  if (!container) return;
  
  container.innerHTML = '';
  
  properties.forEach(property => {
    const html = createPropertyCard(property);
    const div = document.createElement('div');
    div.innerHTML = html;
    container.appendChild(div.firstElementChild);
  });
  
  // Cập nhật UI yêu thích
  if (window.favoriteManager) {
    window.favoriteManager.updateUI();
  }
}

/**
 * Hàm fetch và render properties
 */
async function loadAndRenderProperties(containerId, filters = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  try {
    // Tạo query string
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/properties?${params}`);
    
    if (response.ok) {
      const result = await response.json();
      renderPropertyGrid(container, result.data);
    } else {
      container.innerHTML = '<p class="text-center text-gray-500">Không tìm thấy phòng</p>';
    }
  } catch (error) {
    console.error('Lỗi tải properties:', error);
    container.innerHTML = '<p class="text-center text-gray-500">Có lỗi khi tải dữ liệu</p>';
  }
}

/**
 * Ví dụ sử dụng trong HTML
 */
/*
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-6">Các phòng cho thuê</h1>
        
        <!-- Filters -->
        <div class="mb-6 p-4 bg-gray-100 rounded-lg">
            <button onclick="loadAndRenderProperties('propertyGrid', {
              priceMin: 2000000,
              priceMax: 8000000,
              sort: '-createdAt',
              limit: 12
            })" class="px-4 py-2 bg-blue-500 text-white rounded">
              Tìm kiếm
            </button>
        </div>
        
        <!-- Properties Grid -->
        <div id="propertyGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Properties will be rendered here -->
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="/js/favorites.js"></script>
    <script src="/js/property-card-component.js"></script>
    
    <script>
        // Load properties on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadAndRenderProperties('propertyGrid', {
                limit: 12,
                sort: '-createdAt'
            });
        });
    </script>
</body>
</html>
*/
