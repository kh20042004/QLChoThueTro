/**
 * Script kiểm tra properties có tọa độ hay không
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./src/models/Property');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homerent');

async function checkProperties() {
    try {
        console.log('🔍 Kiểm tra properties...\n');

        const allProperties = await Property.find().limit(5);
        
        console.log(`📊 Tìm thấy ${allProperties.length} properties (hiển thị 5 đầu):\n`);

        allProperties.forEach((prop, index) => {
            console.log(`${index + 1}. ${prop.title}`);
            console.log(`   ID: ${prop._id}`);
            console.log(`   Địa chỉ: ${prop.address?.district}, ${prop.address?.city}`);
            console.log(`   Location:`, prop.location);
            console.log(`   Coordinates:`, prop.location?.coordinates);
            
            if (prop.location?.coordinates && prop.location.coordinates.length === 2) {
                console.log(`   ✅ Có tọa độ: [${prop.location.coordinates[0]}, ${prop.location.coordinates[1]}]`);
            } else {
                console.log(`   ❌ CHƯA có tọa độ!`);
            }
            console.log('');
        });

        // Thống kê
        const withCoords = await Property.countDocuments({
            'location.coordinates': { $exists: true, $ne: null, $ne: [] }
        });
        const withoutCoords = await Property.countDocuments({
            $or: [
                { 'location.coordinates': { $exists: false } },
                { 'location.coordinates': null },
                { 'location.coordinates': [] }
            ]
        });

        console.log('📈 Thống kê:');
        console.log(`   ✅ Có tọa độ: ${withCoords}`);
        console.log(`   ❌ Chưa có: ${withoutCoords}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

mongoose.connection.once('open', () => {
    console.log('✅ Đã kết nối MongoDB\n');
    checkProperties();
});
