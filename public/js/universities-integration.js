/**
 * ===================================
 * UNIVERSITIES INTEGRATION SCRIPT
 * Tích hợp trường đại học với tính năng tìm phòng
 * ===================================
 */

/**
 * Lấy trường đại học gần nhất từ tọa độ
 */
async function getUniversitiesNearby(latitude, longitude, maxDistance = 5000) {
  try {
    const response = await fetch(
      `/api/universities/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Lỗi khi tải trường gần nhất:', error);
    return [];
  }
}

/**
 * Hiển thị thông tin trường đại học trên bản đồ
 */
function displayUniversityMarker(map, university) {
  const marker = new google.maps.Marker({
    position: {
      lat: university.location.coordinates[1],
      lng: university.location.coordinates[0]
    },
    map: map,
    title: university.name,
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; font-family: Arial;">
        <h3 style="margin: 0 0 10px 0; color: #667eea;">${university.name}</h3>
        <p style="margin: 5px 0; font-size: 0.9em;"><strong>Quận:</strong> ${university.district}</p>
        <p style="margin: 5px 0; font-size: 0.9em;"><strong>Điện thoại:</strong> ${university.phone}</p>
        <a href="/universities" style="color: #667eea; text-decoration: none; font-weight: 600;">Xem chi tiết →</a>
      </div>
    `
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return marker;
}

/**
 * Lọc phòng theo khoảng cách đến trường đại học
 */
function filterPropertiesByUniversity(properties, university, maxDistance = 5000) {
  return properties.filter(property => {
    const distance = calculateDistance(
      property.location.coordinates[1],
      property.location.coordinates[0],
      university.location.coordinates[1],
      university.location.coordinates[0]
    );
    return distance <= maxDistance / 1000; // Convert to km
  });
}

/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hiển thị danh sách trường gần đó
 */
function displayNearbyUniversitiesWidget(container, universities) {
  if (!universities || universities.length === 0) {
    return;
  }

  const html = `
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">🎓 Trường Đại Học Gần Đó</h3>
      <div style="display: grid; gap: 10px;">
        ${universities.slice(0, 3).map(uni => `
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
            <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${uni.name}</div>
            <div style="font-size: 0.9em; color: #666;">
              <div>📍 ${uni.address}</div>
              <div style="margin-top: 5px;">
                <a href="/universities" style="color: #667eea; text-decoration: none;">Xem chi tiết →</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Thêm bộ lọc trường đại học vào trang tìm phòng
 */
function addUniversityFilterToProperties() {
  // Tạo filter section
  const filterSection = document.createElement('div');
  filterSection.className = 'university-filter-section';
  filterSection.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h3 style="margin-top: 0; margin-bottom: 15px; color: #333;">
        🎓 Tìm phòng gần trường đại học
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div>
          <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #666;">Trường Đại Học</label>
          <select id="universityFilterSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 1em;">
            <option value="">-- Tất cả --</option>
          </select>
        </div>
        <div>
          <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #666;">Khoảng cách tối đa (km)</label>
          <select id="universityDistanceSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 1em;">
            <option value="1">1 km</option>
            <option value="2">2 km</option>
            <option value="3" selected>3 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
          </select>
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button onclick="filterByUniversity()" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
            🔍 Lọc
          </button>
        </div>
      </div>
    </div>
  `;

  // Thêm vào đầu danh sách phòm
  const propertiesContainer = document.querySelector('.properties-container') || 
                               document.querySelector('#properties-list') ||
                               document.querySelector('.properties-grid');
  
  if (propertiesContainer && propertiesContainer.parentElement) {
    propertiesContainer.parentElement.insertBefore(filterSection, propertiesContainer);
  }

  // Load universities vào select
  loadUniversitiesToSelect();
}

/**
 * Load danh sách trường vào select
 */
async function loadUniversitiesToSelect() {
  try {
    const response = await fetch('/api/universities?limit=1000');
    const data = await response.json();
    const select = document.getElementById('universityFilterSelect');
    
    if (select) {
      data.data.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni._id;
        option.textContent = `${uni.name} (${uni.district})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Lỗi khi tải trường đại học:', error);
  }
}

/**
 * Lọc phòng theo trường đại học
 */
async function filterByUniversity() {
  const universityId = document.getElementById('universityFilterSelect')?.value;
  const maxDistance = document.getElementById('universityDistanceSelect')?.value || 3;

  if (!universityId) {
    alert('Vui lòng chọn trường đại học');
    return;
  }

  try {
    // Lấy thông tin trường
    const uniResponse = await fetch(`/api/universities/${universityId}`);
    const uniData = await uniResponse.json();
    const university = uniData.data;

    // Lấy danh sách phòm
    const propsResponse = await fetch('/api/properties?limit=1000');
    const propsData = await propsResponse.json();

    // Lọc phòm gần trường
    const nearbyProperties = filterPropertiesByUniversity(
      propsData.data,
      university,
      maxDistance * 1000
    );

    // Sắp xếp theo khoảng cách
    nearbyProperties.sort((a, b) => {
      const distA = calculateDistance(
        a.location.coordinates[1],
        a.location.coordinates[0],
        university.location.coordinates[1],
        university.location.coordinates[0]
      );
      const distB = calculateDistance(
        b.location.coordinates[1],
        b.location.coordinates[0],
        university.location.coordinates[1],
        university.location.coordinates[0]
      );
      return distA - distB;
    });

    // Cập nhật kết quả tìm kiếm
    updatePropertiesDisplay(nearbyProperties, university.name);
  } catch (error) {
    console.error('Lỗi khi lọc phòm:', error);
    alert('Có lỗi khi lọc phòm');
  }
}

/**
 * Cập nhật danh sách phòm hiển thị
 */
function updatePropertiesDisplay(properties, universityName) {
  // Thay đổi title
  const header = document.querySelector('.properties-header') || 
                 document.querySelector('h1');
  
  if (header) {
    header.textContent = `Phòng gần ${universityName} (${properties.length} kết quả)`;
  }

  // Hiển thị các phòm
  const container = document.querySelector('.properties-grid') ||
                   document.querySelector('#properties-list') ||
                   document.querySelector('.properties-container');

  if (container) {
    container.innerHTML = properties.map(prop => `
      <div class="property-card">
        <div class="property-image">
          <img src="${prop.images[0] || '/images/placeholder.png'}" alt="${prop.title}">
        </div>
        <div class="property-info">
          <h3>${prop.title}</h3>
          <p class="price">${prop.price.toLocaleString()} VND/tháng</p>
          <p class="address">📍 ${prop.address}</p>
          <a href="/properties/${prop._id}" class="view-btn">Xem chi tiết →</a>
        </div>
      </div>
    `).join('');
  }
}

// Xuất các hàm
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getUniversitiesNearby,
    displayUniversityMarker,
    filterPropertiesByUniversity,
    calculateDistance,
    displayNearbyUniversitiesWidget,
    addUniversityFilterToProperties,
    filterByUniversity
  };
}
