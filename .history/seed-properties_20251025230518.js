require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./src/models/Property');
const User = require('./src/models/User');
const { connectDB } = require('./src/config/database');

// Dữ liệu phòng mẫu với ảnh thật từ internet
const sampleProperties = [
  {
    title: 'Phòng Trọ Cao Cấp Quận 1 - Đầy Đủ Tiện Nghi',
    description: 'Phòng trọ cao cấp tại trung tâm Quận 1, đầy đủ tiện nghi hiện đại. Gần chợ Bến Thành, công viên 23/9. An ninh 24/7, thang máy, giữ xe miễn phí. Phòng mới xây, sạch sẽ, thoáng mát.',
    type: 'phong-tro',
    price: 3500000,
    area: 25,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      street: '123 Nguyễn Huệ',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: false,
      waterHeater: true,
      washer: false,
      balcony: false,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    status: 'available',
    featured: true
  },
  {
    title: 'Căn Hộ Mini Tân Bình - Gần Sân Bay',
    description: 'Căn hộ mini đầy đủ nội thất cao cấp, gần sân bay Tân Sơn Nhất. Có bếp riêng, ban công thoáng mát. Khu vực an ninh, yên tĩnh, phù hợp cho sinh viên và người đi làm.',
    type: 'can-ho',
    price: 5000000,
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      street: '456 Hoàng Văn Thụ',
      ward: 'Phường 4',
      district: 'Quận Tân Bình',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: true,
      waterHeater: true,
      washer: true,
      balcony: true,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800'
    ],
    status: 'available',
    featured: true
  },
  {
    title: 'Nhà Nguyên Căn 2 Tầng Thủ Đức',
    description: 'Nhà nguyên căn 2 tầng, 3 phòng ngủ rộng rãi. Có sân để xe hơi, khu vực yên tĩnh gần trường đại học. Đầy đủ nội thất, có thể ở ngay. Phù hợp cho gia đình hoặc nhóm bạn.',
    type: 'nha-nguyen-can',
    price: 12000000,
    area: 80,
    bedrooms: 3,
    bathrooms: 2,
    location: {
      street: '789 Võ Văn Ngân',
      ward: 'Phường Linh Chiểu',
      district: 'Quận Thủ Đức',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: true,
      waterHeater: true,
      washer: true,
      balcony: true,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    status: 'available',
    featured: true
  },
  {
    title: 'Phòng Trọ Giá Rẻ Bình Thạnh - Gần Chợ',
    description: 'Phòng trọ giá sinh viên, sạch sẽ, an ninh. Gần chợ, siêu thị, trường học. Khu vực sầm uất, tiện đi lại. Có wifi miễn phí, điện nước giá dân.',
    type: 'phong-tro',
    price: 2500000,
    area: 20,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      street: '321 Xô Viết Nghệ Tĩnh',
      ward: 'Phường 21',
      district: 'Quận Bình Thạnh',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: false,
      parking: true,
      kitchen: false,
      waterHeater: true,
      washer: false,
      balcony: false,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800'
    ],
    status: 'available',
    featured: false
  },
  {
    title: 'Chung Cư Mini Quận 7 - View Sông',
    description: 'Chung cư mini view sông Sài Gòn, thoáng mát. Đầy đủ nội thất cao cấp, bếp riêng, ban công rộng. Khu an ninh 24/7, có hồ bơi, gym. Gần Phú Mỹ Hưng.',
    type: 'chung-cu-mini',
    price: 7500000,
    area: 45,
    bedrooms: 2,
    bathrooms: 2,
    location: {
      street: '234 Nguyễn Hữu Thọ',
      ward: 'Phường Tân Hưng',
      district: 'Quận 7',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: true,
      waterHeater: true,
      washer: true,
      balcony: true,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
      'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'
    ],
    status: 'available',
    featured: true
  },
  {
    title: 'Phòng Trọ Sinh Viên Gò Vấp - Gần ĐHCN',
    description: 'Phòng trọ dành cho sinh viên, gần Đại học Công Nghiệp. Giá rẻ, điện nước giá dân. Có tủ lạnh, máy giặt chung. Chủ nhà thân thiện, khu vực an toàn.',
    type: 'phong-tro',
    price: 2000000,
    area: 18,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      street: '567 Quang Trung',
      ward: 'Phường 10',
      district: 'Quận Gò Vấp',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: false,
      parking: true,
      kitchen: false,
      waterHeater: true,
      washer: true,
      balcony: false,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800'
    ],
    status: 'available',
    featured: false
  },
  {
    title: 'Căn Hộ Dịch Vụ Quận 3 - Đầy Đủ Tiện Nghi',
    description: 'Căn hộ dịch vụ cao cấp tại Quận 3, trung tâm thành phố. Đầy đủ nội thất 5 sao, dọn phòng hàng tuần. Phù hợp cho người nước ngoài, doanh nhân. Có bảo vệ, reception 24/7.',
    type: 'can-ho',
    price: 9000000,
    area: 50,
    bedrooms: 2,
    bathrooms: 2,
    location: {
      street: '888 Nam Kỳ Khởi Nghĩa',
      ward: 'Phường Võ Thị Sáu',
      district: 'Quận 3',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: true,
      waterHeater: true,
      washer: true,
      balcony: true,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
    ],
    status: 'available',
    featured: true
  },
  {
    title: 'Nhà Trọ Quận 10 - Gần Bệnh Viện Nhi Đồng',
    description: 'Nhà trọ sạch sẽ, an ninh, gần bệnh viện Nhi Đồng 1. Khu vực yên tĩnh, dân trí cao. Có gác lửng, phù hợp cho cặp đôi. Điện nước giá dân, không chung chủ.',
    type: 'phong-tro',
    price: 3000000,
    area: 22,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      street: '159 Sư Vạn Hạnh',
      ward: 'Phường 12',
      district: 'Quận 10',
      province: 'TP. Hồ Chí Minh'
    },
    amenities: {
      wifi: true,
      airConditioner: true,
      parking: true,
      kitchen: false,
      waterHeater: true,
      washer: false,
      balcony: false,
      security: true
    },
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'
    ],
    status: 'available',
    featured: false
  }
];

// Hàm seed dữ liệu
async function seedProperties() {
  try {
    // Kết nối database
    await connectDB();
    console.log('✅ Đã kết nối database');

    // Xóa tất cả properties cũ
    await Property.deleteMany({});
    console.log('🗑️  Đã xóa tất cả properties cũ');

    // Lấy user đầu tiên để làm owner (hoặc tạo user mới)
    let owner = await User.findOne();
    
    if (!owner) {
      // Tạo user mẫu nếu chưa có
      owner = await User.create({
        name: 'Admin User',
        email: 'admin@homerent.vn',
        password: 'password123',
        phone: '0123456789',
        role: 'landlord'
      });
      console.log('👤 Đã tạo user mẫu');
    }

    // Thêm owner vào mỗi property
    const propertiesWithOwner = sampleProperties.map(prop => ({
      ...prop,
      owner: owner._id
    }));

    // Thêm properties mới
    const properties = await Property.insertMany(propertiesWithOwner);
    console.log(`✅ Đã thêm ${properties.length} properties mới`);

    // Hiển thị danh sách properties
    console.log('\n📋 Danh sách properties:');
    properties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.title} - ${prop.price.toLocaleString('vi-VN')}đ - ${prop.images.length} ảnh`);
    });

    console.log('\n🎉 Seed dữ liệu thành công!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy seed
seedProperties();
