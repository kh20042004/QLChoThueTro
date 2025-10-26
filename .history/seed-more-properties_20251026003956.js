/**
 * ===================================
 * SEED MORE PROPERTIES
 * Thêm 10 phòng đa dạng loại với ảnh thật
 * ===================================
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Property = require('./src/models/Property');
const User = require('./src/models/User');

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Dữ liệu 10 phòng mới
const newProperties = [
    // 1. Nhà nguyên căn - Quận 2
    {
        title: 'Nhà Nguyên Căn 3 Tầng Thảo Điền',
        description: 'Nhà nguyên căn 3 tầng tại khu Thảo Điền sang trọng, đầy đủ nội thất cao cấp. Sân vườn rộng, gara 2 xe. Gần trường quốc tế, siêu thị, nhà hàng. Phù hợp gia đình hoặc làm văn phòng.',
        propertyType: 'nha-nguyen-can',
        price: 25000000,
        deposit: 50000000,
        area: 150,
        address: {
            street: '123 Đường Xuân Thủy',
            ward: 'Phường Thảo Điền',
            district: 'Quận 2',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 4,
        bathrooms: 3,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'washingMachine', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800'
        ],
        status: 'available',
        featured: true
    },

    // 2. Căn hộ cao cấp - Quận 7
    {
        title: 'Căn Hộ Sunrise City View Sông Đẹp',
        description: 'Căn hộ 2PN view sông Sài Gòn tuyệt đẹp tại Sunrise City, Quận 7. Full nội thất cao cấp, hồ bơi, gym, sân chơi trẻ em. An ninh 24/7, gần Crescent Mall, AEON Mall.',
        propertyType: 'can-ho',
        price: 15000000,
        deposit: 30000000,
        area: 80,
        address: {
            street: '23 Đường Nguyễn Hữu Thọ',
            ward: 'Phường Tân Hưng',
            district: 'Quận 7',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'washingMachine', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
        ],
        status: 'available',
        featured: true
    },

    // 3. Chung cư mini - Bình Thạnh
    {
        title: 'Chung Cư Mini Gần ĐH Hutech',
        description: 'Chung cư mini 1PN gần Đại học Hutech, GTVT. Đầy đủ nội thất, máy lạnh, máy nước nóng. Phòng sạch sẽ, thoáng mát. Phù hợp sinh viên, nhân viên văn phòng.',
        propertyType: 'chung-cu-mini',
        price: 4500000,
        deposit: 9000000,
        area: 30,
        address: {
            street: '456 Đường Điện Biên Phủ',
            ward: 'Phường 25',
            district: 'Bình Thạnh',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
        ],
        status: 'available',
        featured: false
    },

    // 4. Homestay - Quận 3
    {
        title: 'Homestay Vintage Cách Mạng Tháng 8',
        description: 'Homestay phong cách vintage, trang trí đẹp mắt tại trung tâm Quận 3. Gần bệnh viện, siêu thị, quán ăn. Chủ nhà thân thiện, hỗ trợ nhiệt tình. Phù hợp khách du lịch, người nước ngoài.',
        propertyType: 'homestay',
        price: 6000000,
        deposit: 6000000,
        area: 25,
        address: {
            street: '789 Đường Cách Mạng Tháng 8',
            ward: 'Phường 7',
            district: 'Quận 3',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'airConditioner', 'kitchen', 'waterHeater', 'washingMachine', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
            'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800'
        ],
        status: 'available',
        featured: true
    },

    // 5. Nhà nguyên căn - Quận 10
    {
        title: 'Nhà Nguyên Căn Hẻm Xe Hơi Q10',
        description: 'Nhà 1 trệt 2 lầu, hẻm xe hơi rộng rãi. Gần chợ, trường học, bệnh viện. Phòng khách rộng, sân phơi thoáng. Phù hợp gia đình 4-6 người.',
        propertyType: 'nha-nguyen-can',
        price: 18000000,
        deposit: 36000000,
        area: 100,
        address: {
            street: '234 Đường 3 Tháng 2',
            ward: 'Phường 12',
            district: 'Quận 10',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'washingMachine', 'security'],
        images: [
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ],
        status: 'available',
        featured: false
    },

    // 6. Căn hộ dịch vụ - Phú Nhuận
    {
        title: 'Căn Hộ Dịch Vụ Cao Cấp Phan Xích Long',
        description: 'Căn hộ dịch vụ 1PN full nội thất tại Phú Nhuận. Dịch vụ giặt ủi, dọn phòng hàng tuần. An ninh 24/7, thang máy, hầm xe. Gần sân bay 10 phút.',
        propertyType: 'can-ho',
        price: 10000000,
        deposit: 20000000,
        area: 45,
        address: {
            street: '567 Đường Phan Xích Long',
            ward: 'Phường 3',
            district: 'Phú Nhuận',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'washingMachine', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
        ],
        status: 'available',
        featured: true
    },

    // 7. Chung cư mini - Quận 12
    {
        title: 'Chung Cư Mini Gần KCN Tân Bình',
        description: 'Chung cư mini mới xây, sạch sẽ thoáng mát. Gần Khu công nghiệp Tân Bình, chợ đầu mối Hóc Môn. Có thang máy, máy giặt chung. Giá rẻ phù hợp công nhân.',
        propertyType: 'chung-cu-mini',
        price: 3000000,
        deposit: 6000000,
        area: 25,
        address: {
            street: '89 Đường Lê Thị Riêng',
            ward: 'Phường Thới An',
            district: 'Quận 12',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'airConditioner', 'parking', 'waterHeater', 'security'],
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
        status: 'available',
        featured: false
    },

    // 8. Homestay - Quận 1
    {
        title: 'Homestay Rooftop View Landmark 81',
        description: 'Homestay rooftop view Landmark 81 tuyệt đẹp ngay Bùi Viện. Phòng thiết kế hiện đại, ban công rộng. Gần phố Tây, Chợ Bến Thành. Trải nghiệm du lịch đáng nhớ.',
        propertyType: 'homestay',
        price: 8000000,
        deposit: 8000000,
        area: 30,
        address: {
            street: '15 Đường Bùi Viện',
            ward: 'Phường Phạm Ngũ Lão',
            district: 'Quận 1',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['wifi', 'airConditioner', 'kitchen', 'waterHeater', 'washingMachine', 'fridge', 'security'],
        images: [
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
        ],
        status: 'available',
        featured: true
    },

    // 9. Nhà nguyên căn - Thủ Đức
    {
        title: 'Nhà Nguyên Căn Gần ĐH Quốc Gia',
        description: 'Nhà 2 tầng mới xây gần Đại học Quốc Gia TP.HCM, Bách Khoa, Khoa học Tự nhiên. Khu dân cư yên tĩnh, an ninh tốt. Sân để xe rộng, có gác lửng.',
        propertyType: 'nha-nguyen-can',
        price: 14000000,
        deposit: 28000000,
        area: 90,
        address: {
            street: '678 Đường Tô Vĩnh Diện',
            ward: 'Phường Linh Chiểu',
            district: 'Thủ Đức',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'security'],
        images: [
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
            'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800'
        ],
        status: 'available',
        featured: false
    },

    // 10. Căn hộ - Quận 8
    {
        title: 'Căn Hộ Topaz Elite View Kênh Đào',
        description: 'Căn hộ 3PN view kênh đào thoáng mát tại Topaz Elite. Nội thất cơ bản, tiện ích đầy đủ: hồ bơi, công viên, sân tennis. Gần trường học, siêu thị BigC.',
        propertyType: 'can-ho',
        price: 12000000,
        deposit: 24000000,
        area: 90,
        address: {
            street: '90 Đường Tạ Quang Bửu',
            ward: 'Phường 6',
            district: 'Quận 8',
            city: 'TP. Hồ Chí Minh'
        },
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['wifi', 'airConditioner', 'parking', 'kitchen', 'waterHeater', 'security'],
        images: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
            'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'
        ],
        status: 'available',
        featured: false
    }
];

// Hàm seed dữ liệu
const seedProperties = async () => {
    try {
        console.log('🌱 Bắt đầu seed dữ liệu...\n');

        // Tìm landlord (user đầu tiên trong DB)
        const landlord = await User.findOne();
        
        if (!landlord) {
            console.error('❌ Không tìm thấy user nào trong database!');
            console.log('💡 Vui lòng tạo user trước hoặc đăng ký tài khoản.');
            process.exit(1);
        }

        console.log(`✅ Tìm thấy landlord: ${landlord.name} (${landlord.email})\n`);

        // Thêm landlord vào mỗi property
        const propertiesWithLandlord = newProperties.map(prop => ({
            ...prop,
            landlord: landlord._id
        }));

        // Xóa tất cả properties cũ (tùy chọn)
        // await Property.deleteMany({});
        // console.log('🗑️  Đã xóa tất cả properties cũ\n');

        // Insert properties mới
        const inserted = await Property.insertMany(propertiesWithLandlord);
        
        console.log('✅ Đã thêm properties mới:');
        inserted.forEach((prop, index) => {
            console.log(`   ${index + 1}. ${prop.title} - ${(prop.price / 1000000).toFixed(1)} triệu/tháng`);
        });

        console.log(`\n🎉 Seed dữ liệu thành công! - ${inserted.length} properties mới`);
        
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Đã đóng kết nối MongoDB');
    }
};

// Chạy seed
connectDB().then(() => {
    seedProperties();
});
