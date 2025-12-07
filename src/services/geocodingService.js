/**
 * Geocoding Service
 * Chuyển đổi địa chỉ thành tọa độ (latitude, longitude) sử dụng Goong Map API
 */

const axios = require('axios');

// Goong Map API Key
const GOONG_API_KEY = process.env.GOONG_API_KEY || 'DSjPIEgG10IuSHKOn4YXVJwhg3WbNWtxFmoExd9A';
const GOONG_GEOCODE_URL = 'https://rsapi.goong.io/geocode';

/**
 * Lấy tọa độ từ địa chỉ sử dụng Goong Map API
 * @param {string} street - Số nhà và tên đường
 * @param {string} ward - Phường/Xã
 * @param {string} district - Quận/Huyện
 * @param {string} city - Tỉnh/Thành phố
 * @returns {Promise<{lat: number, lng: number, display_name: string, accuracy: string}>}
 */
async function getCoordinatesFromAddress(street, ward, district, city) {
    try {
        // Thử nhiều format địa chỉ khác nhau với Goong API
        const addressFormats = [
            `${street}, ${ward}, ${district}, ${city}`,     // Format 1: Đầy đủ
            `${street}, ${district}, ${city}`,               // Format 2: Bỏ phường
            `${street}, ${ward}, ${district}`,               // Format 3: Bỏ thành phố
            `${district}, ${city}`                           // Format 4: Chỉ quận/huyện
        ];

        for (let i = 0; i < addressFormats.length; i++) {
            const address = addressFormats[i];
            console.log(`🔍 [Goong API - Thử ${i + 1}/${addressFormats.length}] Tìm tọa độ: ${address}`);

            try {
                // Gọi Goong Geocoding API
                const response = await axios.get(GOONG_GEOCODE_URL, {
                    params: {
                        address: address,
                        api_key: GOONG_API_KEY
                    },
                    timeout: 10000
                });

                // Kiểm tra response từ Goong API
                if (response.data && response.data.results && response.data.results.length > 0) {
                    const result = response.data.results[0];
                    const location = result.geometry.location;
                    
                    const coordinates = {
                        lat: location.lat,
                        lng: location.lng,
                        display_name: result.formatted_address,
                        accuracy: result.geometry.location_type || 'APPROXIMATE',
                        place_id: result.place_id
                    };

                    console.log(`✅ [Goong API] Tìm thấy tọa độ: [${coordinates.lng}, ${coordinates.lat}]`);
                    console.log(`   📍 Địa chỉ: ${coordinates.display_name}`);
                    console.log(`   🎯 Độ chính xác: ${coordinates.accuracy}`);
                    
                    return coordinates;
                }

                // Delay ngắn giữa các lần thử
                if (i < addressFormats.length - 1) {
                    await delay(500);
                }

            } catch (err) {
                console.warn(`   ⚠️ Lỗi Goong API với format ${i + 1}: ${err.message}`);
                continue;
            }
        }

        // Nếu tất cả format đều thất bại, dùng mapping mặc định
        console.log('⚠️ Goong API không tìm thấy với mọi format, sử dụng mapping mặc định...');
        return getDefaultCoordinates(district, city);

    } catch (error) {
        console.error('❌ Lỗi khi gọi Goong Map API:', error.message);
        return getDefaultCoordinates(district, city);
    }
}

/**
 * Lấy tọa độ dựa trên Quận/Huyện (fallback) sử dụng Goong API
 */
async function getCoordinatesFromDistrict(district, city) {
    try {
        const address = `${district}, ${city}`;
        console.log(`🔍 [Goong API] Đang tìm tọa độ cho: ${address}`);

        const response = await axios.get(GOONG_GEOCODE_URL, {
            params: {
                address: address,
                api_key: GOONG_API_KEY
            },
            timeout: 10000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            
            console.log(`✅ [Goong API] Tìm thấy tọa độ quận/huyện: [${location.lng}, ${location.lat}]`);
            return {
                lat: location.lat,
                lng: location.lng,
                display_name: result.formatted_address,
                accuracy: result.geometry.location_type || 'APPROXIMATE',
                place_id: result.place_id
            };
        }

        // Nếu vẫn không tìm thấy, dùng mapping cố định
        console.log('⚠️ Goong API không tìm thấy, sử dụng mapping mặc định...');
        return getDefaultCoordinates(district, city);

    } catch (error) {
        console.error('❌ Lỗi khi gọi Goong API cho quận/huyện:', error.message);
        return getDefaultCoordinates(district, city);
    }
}

/**
 * Lấy tọa độ mặc định từ mapping (fallback cuối cùng)
 * Sử dụng khi cả Goong API và các phương thức khác đều thất bại
 */
function getDefaultCoordinates(district, city) {
    const locationMapping = {
        // TP. Hồ Chí Minh - Tọa độ chính xác hơn
        'Quận 1': { lat: 10.7769, lng: 106.7009 },
        'Quận 2': { lat: 10.7774, lng: 106.7474 },
        'Quận 3': { lat: 10.7828, lng: 106.6926 },
        'Quận 4': { lat: 10.7574, lng: 106.7055 },
        'Quận 5': { lat: 10.7587, lng: 106.6800 },
        'Quận 6': { lat: 10.7503, lng: 106.6350 },
        'Quận 7': { lat: 10.7335, lng: 106.7196 },
        'Quận 8': { lat: 10.7380, lng: 106.6290 },
        'Quận 9': { lat: 10.8340, lng: 106.7840 },
        'Quận 10': { lat: 10.7724, lng: 106.6687 },
        'Quận 11': { lat: 10.7627, lng: 106.6500 },
        'Quận 12': { lat: 10.8633, lng: 106.6970 },
        'Quận Tân Bình': { lat: 10.8006, lng: 106.6532 },
        'Quận Bình Thạnh': { lat: 10.8117, lng: 106.7053 },
        'Quận Phú Nhuận': { lat: 10.7980, lng: 106.6830 },
        'Quận Gò Vấp': { lat: 10.8374, lng: 106.6683 },
        'Quận Bình Tân': { lat: 10.7398, lng: 106.6048 },
        'Quận Tân Phú': { lat: 10.7875, lng: 106.6333 },
        'Thành phố Thủ Đức': { lat: 10.8505, lng: 106.7718 },
        'TP. Thủ Đức': { lat: 10.8505, lng: 106.7718 },
        'Huyện Củ Chi': { lat: 10.9740, lng: 106.4920 },
        'Huyện Hóc Môn': { lat: 10.8846, lng: 106.5933 },
        'Huyện Bình Chánh': { lat: 10.7393, lng: 106.5570 },
        'Huyện Nhà Bè': { lat: 10.6840, lng: 106.7000 },
        'Huyện Cần Giờ': { lat: 10.4100, lng: 106.9560 },
        
        // Hà Nội
        'Quận Ba Đình': { lat: 21.0285, lng: 105.8195 },
        'Quận Hoàn Kiếm': { lat: 21.0285, lng: 105.8516 },
        'Quận Hai Bà Trưng': { lat: 21.0068, lng: 105.8516 },
        'Quận Đống Đa': { lat: 21.0134, lng: 105.8195 },
        'Quận Cầu Giấy': { lat: 21.0285, lng: 105.7938 },
        'Quận Thanh Xuân': { lat: 20.9948, lng: 105.8067 },
        'Quận Tây Hồ': { lat: 21.0583, lng: 105.8186 },
        'Quận Long Biên': { lat: 21.0364, lng: 105.8938 },
        
        // Đà Nẵng
        'Quận Hải Châu': { lat: 16.0544, lng: 108.2144 },
        'Quận Thanh Khê': { lat: 16.0678, lng: 108.1880 },
        'Quận Sơn Trà': { lat: 16.0833, lng: 108.2500 },
        'Quận Ngũ Hành Sơn': { lat: 16.0000, lng: 108.2500 },
        'Quận Liên Chiểu': { lat: 16.0770, lng: 108.1510 },
        'Quận Cẩm Lệ': { lat: 16.0200, lng: 108.1800 }
    };

    // Tìm theo quận/huyện
    if (locationMapping[district]) {
        console.log(`✅ [Fallback] Sử dụng tọa độ mặc định cho ${district}`);
        return {
            ...locationMapping[district],
            display_name: `${district}, ${city}`,
            accuracy: 'FALLBACK'
        };
    }

    // Tọa độ mặc định theo tỉnh/thành phố
    const cityDefaults = {
        'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
        'Thành phố Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
        'Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
        'Hà Nội': { lat: 21.0278, lng: 105.8342 },
        'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
        'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
        'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
        'Biên Hòa': { lat: 10.9471, lng: 106.8196 },
        'Vũng Tàu': { lat: 10.4113, lng: 107.1360 },
        'Nha Trang': { lat: 12.2388, lng: 109.1967 }
    };

    const defaultCoords = cityDefaults[city] || { lat: 10.8231, lng: 106.6297 };
    console.log(`✅ [Fallback] Sử dụng tọa độ mặc định cho ${city}`);
    
    return {
        ...defaultCoords,
        display_name: city,
        accuracy: 'CITY_FALLBACK'
    };
}

/**
 * Delay để tránh spam API
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reverse Geocoding - Chuyển tọa độ thành địa chỉ (sử dụng Goong API)
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {Promise<Object>} - Thông tin địa chỉ
 */
async function getAddressFromCoordinates(lat, lng) {
    try {
        console.log(`🔍 [Goong API] Reverse geocoding: [${lng}, ${lat}]`);
        
        const response = await axios.get('https://rsapi.goong.io/Geocode', {
            params: {
                latlng: `${lat},${lng}`,
                api_key: GOONG_API_KEY
            },
            timeout: 10000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            console.log(`✅ [Goong API] Tìm thấy địa chỉ: ${result.formatted_address}`);
            
            return {
                formatted_address: result.formatted_address,
                address_components: result.address_components,
                place_id: result.place_id
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Lỗi reverse geocoding:', error.message);
        return null;
    }
}

module.exports = {
    getCoordinatesFromAddress,
    getCoordinatesFromDistrict,
    getDefaultCoordinates,
    getAddressFromCoordinates
};
