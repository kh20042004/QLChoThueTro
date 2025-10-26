/**
 * Script thêm tọa độ cho properties chưa có location.coordinates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./src/models/Property');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homerent', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Tọa độ mẫu cho các thành phố Việt Nam
const cityCoordinates = {
    'TP. Hồ Chí Minh': {
        lat: 10.8231,
        lng: 106.6297,
        // Tọa độ các quận
        districts: {
            'Quận 1': { lat: 10.7756, lng: 106.7019 },
            'Quận 2': { lat: 10.7875, lng: 106.7399 },
            'Quận 3': { lat: 10.7821, lng: 106.6897 },
            'Quận 4': { lat: 10.7574, lng: 106.7025 },
            'Quận 5': { lat: 10.7554, lng: 106.6672 },
            'Quận 6': { lat: 10.7484, lng: 106.6346 },
            'Quận 7': { lat: 10.7336, lng: 106.7218 },
            'Quận 8': { lat: 10.7385, lng: 106.6767 },
            'Quận 10': { lat: 10.7734, lng: 106.6698 },
            'Quận 11': { lat: 10.7631, lng: 106.6508 },
            'Quận 12': { lat: 10.8635, lng: 106.6708 },
            'Quận Bình Thạnh': { lat: 10.8014, lng: 106.7108 },
            'Quận Tân Bình': { lat: 10.7991, lng: 106.6537 },
            'Quận Tân Phú': { lat: 10.7880, lng: 106.6291 },
            'Quận Phú Nhuận': { lat: 10.7979, lng: 106.6824 },
            'Quận Gò Vấp': { lat: 10.8388, lng: 106.6757 },
            'Quận Thủ Đức': { lat: 10.8509, lng: 106.7717 },
            'Quận Bình Tân': { lat: 10.7373, lng: 106.6143 }
        }
    },
    'Hà Nội': {
        lat: 21.0285,
        lng: 105.8542,
        districts: {
            'Quận Ba Đình': { lat: 21.0346, lng: 105.8192 },
            'Quận Hoàn Kiếm': { lat: 21.0285, lng: 105.8542 },
            'Quận Hai Bà Trưng': { lat: 21.0067, lng: 105.8441 },
            'Quận Đống Đa': { lat: 21.0181, lng: 105.8270 },
            'Quận Cầu Giấy': { lat: 21.0333, lng: 105.7943 }
        }
    },
    'Đà Nẵng': {
        lat: 16.0544,
        lng: 108.2022,
        districts: {
            'Quận Hải Châu': { lat: 16.0544, lng: 108.2022 },
            'Quận Thanh Khê': { lat: 16.0638, lng: 108.1667 },
            'Quận Sơn Trà': { lat: 16.0767, lng: 108.2389 }
        }
    }
};

async function addCoordinatesToProperties() {
    try {
        console.log('🔄 Bắt đầu thêm tọa độ cho properties...\n');

        // Lấy tất cả properties chưa có coordinates
        const properties = await Property.find({
            $or: [
                { 'location.coordinates': { $exists: false } },
                { 'location.coordinates': [] },
                { 'location.coordinates.0': 0 },
                { 'location.coordinates': null }
            ]
        });

        console.log(`📍 Tìm thấy ${properties.length} properties cần thêm tọa độ\n`);

        let updated = 0;

        for (const property of properties) {
            const city = property.address?.city;
            const district = property.address?.district;

            if (city && cityCoordinates[city]) {
                let lat, lng;

                // Nếu có thông tin quận và có tọa độ quận
                if (district && cityCoordinates[city].districts[district]) {
                    const districtCoords = cityCoordinates[city].districts[district];
                    // Thêm random nhỏ để mỗi property có vị trí hơi khác nhau
                    lat = districtCoords.lat + (Math.random() - 0.5) * 0.01;
                    lng = districtCoords.lng + (Math.random() - 0.5) * 0.01;
                } else {
                    // Dùng tọa độ trung tâm thành phố
                    lat = cityCoordinates[city].lat + (Math.random() - 0.5) * 0.05;
                    lng = cityCoordinates[city].lng + (Math.random() - 0.5) * 0.05;
                }

                // Cập nhật property
                property.location = {
                    type: 'Point',
                    coordinates: [lng, lat] // [longitude, latitude]
                };

                await property.save();
                updated++;

                console.log(`✅ ${updated}. Updated: ${property.title}`);
                console.log(`   📍 Location: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${district || city})\n`);
            } else {
                console.log(`⚠️  Skipped: ${property.title} - Không tìm thấy tọa độ cho ${city}\n`);
            }
        }

        console.log(`\n✨ Hoàn thành! Đã cập nhật ${updated}/${properties.length} properties`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

// Chạy script
mongoose.connection.once('open', () => {
    console.log('✅ Đã kết nối MongoDB\n');
    addCoordinatesToProperties();
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    process.exit(1);
});
