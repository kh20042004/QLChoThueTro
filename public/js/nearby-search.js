/**
 * ===================================
 * NEARBY SEARCH - Tìm phòng trọ gần tôi
 * Sử dụng Geolocation API + Leaflet Maps
 * ===================================
 */

class NearbySearch {
    constructor() {
        this.modal = null;
        this.map = null;
        this.userMarker = null;
        this.propertyMarkers = [];
        this.userLocation = null;
        this.currentRadius = 2; // km
        this.properties = [];
        
        this.init();
    }

    init() {
        this.modal = document.getElementById('nearbyModal');
        this.bindEvents();
    }

    bindEvents() {
        // Open modal
        const nearbyBtn = document.getElementById('nearbySearchBtn');
        if (nearbyBtn) {
            nearbyBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal
        const closeBtn = document.getElementById('closeNearbyModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Backdrop click
        const backdrop = document.getElementById('nearbyModalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }

        // Retry button
        const retryBtn = document.getElementById('retryLocation');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.getUserLocation());
        }

        // Radius change
        const radiusSelect = document.getElementById('radiusSelect');
        if (radiusSelect) {
            radiusSelect.addEventListener('change', (e) => {
                this.currentRadius = parseFloat(e.target.value);
                this.filterPropertiesByRadius();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset states
        this.showLoading();
        this.hideError();
        this.hideMap();
        
        // Get user location
        this.getUserLocation();
    }

    closeModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Cleanup map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    showLoading() {
        document.getElementById('nearbyLoading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('nearbyLoading').classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        const errorDiv = document.getElementById('nearbyError');
        const errorMessage = document.getElementById('nearbyErrorMessage');
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('nearbyError').classList.add('hidden');
    }

    showMap() {
        document.getElementById('nearbyMapContainer').classList.remove('hidden');
    }

    hideMap() {
        document.getElementById('nearbyMapContainer').classList.add('hidden');
    }

    getUserLocation() {
        this.showLoading();
        this.hideError();

        if (!navigator.geolocation) {
            this.showError('Trình duyệt của bạn không hỗ trợ định vị.');
            return;
        }

        console.log('🌍 Đang yêu cầu quyền truy cập vị trí...');

        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    onLocationSuccess(position) {
        console.log('✅ Đã lấy được vị trí:', position.coords);
        
        this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        this.hideLoading();
        this.showMap();

        // Initialize map
        this.initMap();

        // Get address from coordinates
        this.getAddressFromCoords(this.userLocation.lat, this.userLocation.lng);

        // Load properties
        this.loadNearbyProperties();
    }

    onLocationError(error) {
        console.error('❌ Lỗi lấy vị trí:', error);
        
        let message = 'Không thể xác định vị trí của bạn.';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Thông tin vị trí không khả dụng. Vui lòng kiểm tra kết nối GPS/mạng.';
                break;
            case error.TIMEOUT:
                message = 'Yêu cầu xác định vị trí đã hết thời gian. Vui lòng thử lại.';
                break;
        }
        
        this.showError(message);
    }

    async getAddressFromCoords(lat, lng) {
        try {
            // Sử dụng Nominatim reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`);
            const data = await response.json();
            
            if (data && data.display_name) {
                const address = data.display_name.split(',').slice(0, 3).join(',');
                document.getElementById('userLocationText').textContent = address;
            }
        } catch (error) {
            console.error('Lỗi lấy địa chỉ:', error);
            document.getElementById('userLocationText').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    initMap() {
        // Create map centered on user location with Goong Map JS
        goongjs.accessToken = '3wUhxxPZujfl6OwVJ9N7YdDlGP6pJU62zw5PT4pg';
        this.map = new goongjs.Map({
            container: 'nearbyMap',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [this.userLocation.lng, this.userLocation.lat],
            zoom: 14
        });

        // Add user location marker
        const el = document.createElement('div');
        el.style.cssText = 'background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;';
        
        const popup = new goongjs.Popup({ offset: 25 })
            .setHTML('<div class="text-center"><strong>Vị trí của bạn</strong><br/><small>📍 Đang ở đây</small></div>');
        
        this.userMarker = new goongjs.Marker(el)
            .setLngLat([this.userLocation.lng, this.userLocation.lat])
            .setPopup(popup)
            .addTo(this.map);
    }

    async loadNearbyProperties() {
        try {
            // Fetch all available properties
            const response = await fetch('/api/properties?status=available&limit=100');
            const data = await response.json();

            if (data.success && data.data) {
                this.properties = data.data;
                this.filterPropertiesByRadius();
            } else {
                console.error('Không thể tải danh sách phòng');
            }
        } catch (error) {
            console.error('Lỗi tải phòng:', error);
            this.showError('Không thể tải danh sách phòng. Vui lòng thử lại.');
        }
    }

    filterPropertiesByRadius() {
        // Clear existing markers
        this.propertyMarkers.forEach(marker => marker.remove());
        this.propertyMarkers = [];

        // Filter properties within radius
        const nearbyProperties = this.properties.filter(property => {
            if (!property.location || !property.location.coordinates) {
                return false;
            }

            const [lng, lat] = property.location.coordinates;
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                lat,
                lng
            );

            property.distance = distance;
            return distance <= this.currentRadius;
        });

        // Sort by distance
        nearbyProperties.sort((a, b) => a.distance - b.distance);

        console.log(`🏠 Tìm thấy ${nearbyProperties.length} phòng trong bán kính ${this.currentRadius}km`);

        // Update count
        document.getElementById('nearbyCount').textContent = nearbyProperties.length;

        // Add markers to map
        this.addPropertyMarkers(nearbyProperties);

        // Display properties list
        this.displayPropertiesList(nearbyProperties);
    }

    addPropertyMarkers(properties) {
        properties.forEach((property, index) => {
            if (!property.location || !property.location.coordinates) return;

            const [lng, lat] = property.location.coordinates;

            // Create custom marker element
            const el = document.createElement('div');
            el.style.cssText = 'background: white; padding: 4px 8px; border-radius: 8px; border: 2px solid #374151; box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer;';
            el.textContent = `${(property.price / 1000000).toFixed(1)}tr`;

            // Popup content
            const popupContent = `
                <div class="p-2" style="min-width: 200px;">
                    <img src="${property.images && property.images[0] ? property.images[0] : '/images/placeholder.jpg'}" 
                         alt="${property.title}" 
                         class="w-full h-32 object-cover rounded-lg mb-2"
                         onerror="this.src='/images/placeholder.jpg'">
                    <h4 class="font-semibold text-gray-800 mb-1">${property.title}</h4>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-map-marker-alt text-gray-400"></i> 
                        ${property.address?.district || 'Không rõ khu vực'}
                    </p>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-ruler-combined text-gray-400"></i> 
                        ${property.area}m²
                    </p>
                    <p class="text-sm font-semibold text-gray-800 mb-2">
                        <i class="fas fa-tag text-gray-400"></i> 
                        ${property.price.toLocaleString('vi-VN')} VNĐ/tháng
                    </p>
                    <p class="text-xs text-blue-600 mb-2">
                        <i class="fas fa-route text-blue-500"></i> 
                        Cách bạn ${property.distance.toFixed(2)} km
                    </p>
                    <a href="/property/${property._id}" 
                       class="block w-full text-center px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                        Xem chi tiết
                    </a>
                </div>
            `;

            const popup = new goongjs.Popup({ offset: 25, maxWidth: '250px' })
                .setHTML(popupContent);

            const marker = new goongjs.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(this.map);

            this.propertyMarkers.push(marker);
        });
    }

    displayPropertiesList(properties) {
        const listContainer = document.getElementById('nearbyPropertiesList');
        
        if (properties.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-home text-4xl mb-2"></i>
                    <p>Không tìm thấy phòng trọ nào trong bán kính ${this.currentRadius}km</p>
                    <p class="text-sm mt-1">Thử tăng bán kính tìm kiếm</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = properties.map(property => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                 onclick="window.location.href='/property/${property._id}'">
                <img src="${property.images && property.images[0] ? property.images[0] : '/images/placeholder.jpg'}" 
                     alt="${property.title}" 
                     class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-gray-800 truncate">${property.title}</h5>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-map-marker-alt text-gray-400"></i> 
                        ${property.address?.district || 'Không rõ'}
                    </p>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-sm font-semibold text-gray-800">
                            ${property.price.toLocaleString('vi-VN')} VNĐ
                        </span>
                        <span class="text-xs text-blue-600">
                            <i class="fas fa-route"></i> ${property.distance.toFixed(2)} km
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.nearbySearch = new NearbySearch();
});
