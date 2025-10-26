/**
 * Geocoding Service
 * Chuyển đổi địa chỉ thành tọa độ (latitude, longitude)
 */

const axios = require('axios');

/**
 * Lấy tọa độ từ địa chỉ sử dụng Nominatim (OpenStreetMap)
 * @param {string} street - Số nhà và tên đường
 * @param {string} ward - Phường/Xã
 * @param {string} district - Quận/Huyện
 * @param {string} city - Tỉnh/Thành phố
 * @returns {Promise<{lat: number, lng: number, display_name: string}>}
 */
async function getCoordinatesFromAddress(street, ward, district, city) {
    try {
        // Tạo địa chỉ đầy đủ cho Nominatim
        const fullAddress = `${street}, ${ward}, ${district}, ${city}, Vietnam`;
        
        console.log(`🔍 Đang tìm tọa độ cho: ${fullAddress}`);

        // Gọi Nominatim API
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: fullAddress,
                format: 'json',
                limit: 1,
                addressdetails: 1,
                countrycodes: 'vn' // Chỉ tìm ở Việt Nam
            },
            headers: {
                'User-Agent': 'HomeRentApp/1.0' // Nominatim yêu cầu User-Agent
            },
            timeout: 5000 // Timeout 5 giây
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const coordinates = {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                accuracy: result.importance // Độ chính xác (0-1)
            };

            console.log(`✅ Tìm thấy tọa độ: [${coordinates.lng}, ${coordinates.lat}] (accuracy: ${coordinates.accuracy})`);
            return coordinates;
        }

        // Nếu không tìm thấy, thử tìm với địa chỉ ngắn hơn
        console.log('⚠️ Không tìm thấy với địa chỉ đầy đủ, thử tìm với quận/huyện...');
        return await getCoordinatesFromDistrict(district, city);

    } catch (error) {
        console.error('❌ Lỗi khi gọi Nominatim API:', error.message);
        
        // Fallback: Tìm theo quận/huyện
        return await getCoordinatesFromDistrict(district, city);
    }
}

/**
 * Lấy tọa độ dựa trên Quận/Huyện (fallback)
 */
async function getCoordinatesFromDistrict(district, city) {
    try {
        const address = `${district}, ${city}, Vietnam`;
        console.log(`🔍 Đang tìm tọa độ cho: ${address}`);

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                countrycodes: 'vn'
            },
            headers: {
                'User-Agent': 'HomeRentApp/1.0'
            },
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            console.log(`✅ Tìm thấy tọa độ quận/huyện: [${result.lon}, ${result.lat}]`);
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                accuracy: result.importance
            };
        }

        // Nếu vẫn không tìm thấy, dùng mapping cố định
        console.log('⚠️ Không tìm thấy, sử dụng mapping mặc định...');
        return getDefaultCoordinates(district, city);

    } catch (error) {
        console.error('❌ Lỗi khi tìm tọa độ quận/huyện:', error.message);
        return getDefaultCoordinates(district, city);
    }
}

/**
 * Lấy tọa độ mặc định từ mapping (fallback cuối cùng)
 */
function getDefaultCoordinates(district, city) {
    const locationMapping = {
        // TP. Hồ Chí Minh
        'Quận 1': { lat: 10.7769, lng: 106.7009 },
        'Quận 3': { lat: 10.7828, lng: 106.6926 },
        'Quận 5': { lat: 10.7587, lng: 106.6800 },
        'Quận 7': { lat: 10.7335, lng: 106.7196 },
        'Quận 10': { lat: 10.7724, lng: 106.6687 },
        'Quận Tân Bình': { lat: 10.8006, lng: 106.6532 },
        'Quận Bình Thạnh': { lat: 10.8117, lng: 106.7053 },
        'Quận Phú Nhuận': { lat: 10.7980, lng: 106.6830 },
        'Quận Gò Vấp': { lat: 10.8374, lng: 106.6683 },
        'Thành phố Thủ Đức': { lat: 10.8505, lng: 106.7718 },
        'TP. Thủ Đức': { lat: 10.8505, lng: 106.7718 },
        
        // Hà Nội
        'Quận Ba Đình': { lat: 21.0285, lng: 105.8195 },
        'Quận Hoàn Kiếm': { lat: 21.0285, lng: 105.8516 },
        'Quận Hai Bà Trưng': { lat: 21.0068, lng: 105.8516 },
        'Quận Đống Đa': { lat: 21.0134, lng: 105.8195 },
        'Quận Cầu Giấy': { lat: 21.0285, lng: 105.7938 },
        'Quận Thanh Xuân': { lat: 20.9948, lng: 105.8067 },
        
        // Đà Nẵng
        'Quận Hải Châu': { lat: 16.0544, lng: 108.2144 },
        'Quận Thanh Khê': { lat: 16.0678, lng: 108.1880 },
        'Quận Sơn Trà': { lat: 16.0833, lng: 108.2500 },
        'Quận Ngũ Hành Sơn': { lat: 16.0000, lng: 108.2500 }
    };

    // Tìm theo quận/huyện
    if (locationMapping[district]) {
        console.log(`✅ Sử dụng tọa độ mặc định cho ${district}`);
        return {
            ...locationMapping[district],
            display_name: `${district}, ${city}`,
            accuracy: 0.5
        };
    }

    // Tọa độ mặc định theo tỉnh/thành phố
    const cityDefaults = {
        'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
        'Thành phố Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
        'Hà Nội': { lat: 21.0278, lng: 105.8342 },
        'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
        'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
        'Cần Thơ': { lat: 10.0452, lng: 105.7469 }
    };

    const defaultCoords = cityDefaults[city] || { lat: 10.8231, lng: 106.6297 };
    console.log(`✅ Sử dụng tọa độ mặc định cho ${city}`);
    
    return {
        ...defaultCoords,
        display_name: city,
        accuracy: 0.3
    };
}

/**
 * Delay để tránh spam Nominatim API
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    getCoordinatesFromAddress,
    getCoordinatesFromDistrict,
    getDefaultCoordinates
};
