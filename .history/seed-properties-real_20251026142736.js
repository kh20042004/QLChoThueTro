/**
 * Script to seed 20 properties with real data and images from internet
 */

const mongoose = require('mongoose');
const Property = require('./src/models/Property');
const User = require('./src/models/User');
const geocodingService = require('./src/services/geocodingService');
require('dotenv').config();

const propertiesData = [
    // PHÒNG TRỌ
    {
        title: "Phòng trọ cao cấp gần ĐH Bách Khoa",
        description: "Phòng trọ mới xây, đầy đủ nội thất, gần trường học, chợ, siêu thị. An ninh 24/7, camera giám sát.",
        propertyType: "phong-tro",
        price: 3500000,
        deposit: 3500000,
        area: 25,
        bedrooms: 1,
        bathrooms: 1,
        street: "268 Lý Thường Kiệt",
        ward: "Phường 14",
        district: "Quận 10",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking"],
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800"
        ]
    },
    {
        title: "Phòng trọ giá rẻ Quận Tân Bình",
        description: "Phòng trọ sạch sẹp, thoáng mát, gần sân bay. Điện nước giá dân, chủ nhà thân thiện.",
        propertyType: "phong-tro",
        price: 2800000,
        deposit: 2800000,
        area: 20,
        bedrooms: 1,
        bathrooms: 1,
        street: "45 Trường Chinh",
        ward: "Phường 12",
        district: "Quận Tân Bình",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "parking"],
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"
        ]
    },
    {
        title: "Phòng trọ Quận 1 giá tốt",
        description: "Vị trí đẹp, gần trung tâm, đi lại thuận tiện. Có gác lửng, phù hợp sinh viên, nhân viên văn phòng.",
        propertyType: "phong-tro",
        price: 4200000,
        deposit: 4200000,
        area: 22,
        bedrooms: 1,
        bathrooms: 1,
        street: "123 Nguyễn Thái Bình",
        ward: "Phường Nguyễn Thái Bình",
        district: "Quận 1",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater"],
        images: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800"
        ]
    },
    {
        title: "Phòng trọ có gác Bình Thạnh",
        description: "Phòng rộng rãi, có gác để đồ hoặc ngủ. Khu vực yên tĩnh, an ninh tốt.",
        propertyType: "phong-tro",
        price: 3200000,
        deposit: 3200000,
        area: 28,
        bedrooms: 1,
        bathrooms: 1,
        street: "89 Đinh Bộ Lĩnh",
        ward: "Phường 26",
        district: "Quận Bình Thạnh",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "parking", "kitchen"],
        images: [
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800"
        ]
    },

    // CĂN HỘ
    {
        title: "Căn hộ mini full nội thất Quận 7",
        description: "Căn hộ studio hiện đại, nội thất cao cấp, view đẹp. Hồ bơi, gym, siêu thị trong tòa nhà.",
        propertyType: "can-ho",
        price: 6500000,
        deposit: 13000000,
        area: 35,
        bedrooms: 1,
        bathrooms: 1,
        street: "234 Nguyễn Văn Linh",
        ward: "Phường Tân Phú",
        district: "Quận 7",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security"],
        images: [
            "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
        ]
    },
    {
        title: "Căn hộ 2 phòng ngủ Thủ Đức",
        description: "Căn hộ rộng rãi, thoáng mát, ban công view đẹp. Gần chợ, trường học, bệnh viện.",
        propertyType: "can-ho",
        price: 8000000,
        deposit: 16000000,
        area: 60,
        bedrooms: 2,
        bathrooms: 2,
        street: "567 Võ Văn Ngân",
        ward: "Phường Linh Chiểu",
        district: "Thành phố Thủ Đức",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator"],
        images: [
            "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
            "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800"
        ]
    },
    {
        title: "Căn hộ cao cấp Quận 3",
        description: "Căn hộ sang trọng, nội thất nhập khẩu. Hệ thống điều hòa trung tâm, bảo vệ 24/7.",
        propertyType: "can-ho",
        price: 12000000,
        deposit: 24000000,
        area: 75,
        bedrooms: 2,
        bathrooms: 2,
        street: "156 Nam Kỳ Khởi Nghĩa",
        ward: "Phường 8",
        district: "Quận 3",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security", "pool"],
        images: [
            "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800",
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
            "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800",
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800"
        ]
    },

    // NHÀ NGUYÊN CĂN
    {
        title: "Nhà nguyên căn 1 trệt 1 lầu Gò Vấp",
        description: "Nhà mới xây, thiết kế hiện đại. 3 phòng ngủ, 3 WC, sân để xe rộng. Khu dân cư an ninh.",
        propertyType: "nha-nguyen-can",
        price: 15000000,
        deposit: 30000000,
        area: 80,
        bedrooms: 3,
        bathrooms: 3,
        street: "78 Quang Trung",
        ward: "Phường 10",
        district: "Quận Gò Vấp",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen"],
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
        ]
    },
    {
        title: "Nhà mặt tiền kinh doanh Quận 5",
        description: "Nhà mặt tiền đường lớn, thích hợp kinh doanh. 4 phòng ngủ, sân thượng rộng.",
        propertyType: "nha-nguyen-can",
        price: 25000000,
        deposit: 50000000,
        area: 120,
        bedrooms: 4,
        bathrooms: 4,
        street: "456 Trần Hưng Đạo",
        ward: "Phường 2",
        district: "Quận 5",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "security"],
        images: [
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"
        ]
    },
    {
        title: "Nhà phố cao cấp Phú Nhuận",
        description: "Nhà đẹp lung linh, thiết kế tân cổ điển. Đầy đủ nội thất, sân vườn, garage ô tô.",
        propertyType: "nha-nguyen-can",
        price: 35000000,
        deposit: 70000000,
        area: 150,
        bedrooms: 5,
        bathrooms: 5,
        street: "789 Phan Đình Phùng",
        ward: "Phường 2",
        district: "Quận Phú Nhuận",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "security", "garden"],
        images: [
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
            "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
            "https://images.unsplash.com/photo-1600573472556-e636c2f0b6d3?w=800"
        ]
    },

    // CHUNG CƯ MINI
    {
        title: "Chung cư mini có thang máy Tân Bình",
        description: "Chung cư mini mới 100%, thang máy, bảo vệ. Gần sân bay, thuận tiện đi lại.",
        propertyType: "chung-cu-mini",
        price: 4500000,
        deposit: 9000000,
        area: 30,
        bedrooms: 1,
        bathrooms: 1,
        street: "234 Cộng Hòa",
        ward: "Phường 13",
        district: "Quận Tân Bình",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "elevator"],
        images: [
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
        ]
    },
    {
        title: "Chung cư mini 2PN Bình Thạnh",
        description: "Căn góc thoáng mát, 2 phòng ngủ rộng. Ban công phơi đồ tiện lợi.",
        propertyType: "chung-cu-mini",
        price: 6000000,
        deposit: 12000000,
        area: 45,
        bedrooms: 2,
        bathrooms: 2,
        street: "567 Xô Viết Nghệ Tĩnh",
        ward: "Phường 25",
        district: "Quận Bình Thạnh",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator"],
        images: [
            "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800",
            "https://images.unsplash.com/photo-1560448204-444dcb9fab43?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
        ]
    },

    // HÀ NỘI
    {
        title: "Phòng trọ gần ĐH Quốc Gia Hà Nội",
        description: "Phòng trọ giá sinh viên, sạch sẽ, an toàn. Gần trường, chợ, siêu thị.",
        propertyType: "phong-tro",
        price: 2500000,
        deposit: 2500000,
        area: 18,
        bedrooms: 1,
        bathrooms: 1,
        street: "145 Xuân Thủy",
        ward: "Phường Dịch Vọng Hậu",
        district: "Quận Cầu Giấy",
        city: "Hà Nội",
        amenities: ["wifi", "parking"],
        images: [
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"
        ]
    },
    {
        title: "Căn hộ dịch vụ Hoàn Kiếm",
        description: "Căn hộ mini trung tâm Hà Nội, view Hồ Gươm. Full nội thất cao cấp, dọn vệ sinh hàng tuần.",
        propertyType: "can-ho",
        price: 10000000,
        deposit: 20000000,
        area: 40,
        bedrooms: 1,
        bathrooms: 1,
        street: "56 Hàng Bài",
        ward: "Phường Tràng Tiền",
        district: "Quận Hoàn Kiếm",
        city: "Hà Nội",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security"],
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
        ]
    },
    {
        title: "Nhà riêng Đống Đa 3 tầng",
        description: "Nhà đẹp 3 tầng x 40m2, đầy đủ nội thất. Gần hồ, công viên, khu vực yên tĩnh.",
        propertyType: "nha-nguyen-can",
        price: 18000000,
        deposit: 36000000,
        area: 120,
        bedrooms: 4,
        bathrooms: 3,
        street: "234 Nguyễn Lương Bằng",
        ward: "Phường Đống Đa",
        district: "Quận Đống Đa",
        city: "Hà Nội",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen"],
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"
        ]
    },

    // ĐÀ NẴNG
    {
        title: "Căn hộ view biển Sơn Trà",
        description: "Căn hộ view biển tuyệt đẹp, nội thất sang trọng. Hồ bơi vô cực, gym, spa.",
        propertyType: "can-ho",
        price: 15000000,
        deposit: 30000000,
        area: 70,
        bedrooms: 2,
        bathrooms: 2,
        street: "89 Võ Nguyên Giáp",
        ward: "Phường Phước Mỹ",
        district: "Quận Sơn Trà",
        city: "Đà Nẵng",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security", "pool"],
        images: [
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
            "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800"
        ]
    },
    {
        title: "Nhà phố Hải Châu gần biển",
        description: "Nhà đẹp 4 tầng, gần biển Mỹ Khê. Thích hợp ở hoặc kinh doanh homestay.",
        propertyType: "nha-nguyen-can",
        price: 20000000,
        deposit: 40000000,
        area: 100,
        bedrooms: 4,
        bathrooms: 4,
        street: "123 Lê Duẩn",
        ward: "Phường Thạch Thang",
        district: "Quận Hải Châu",
        city: "Đà Nẵng",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "security"],
        images: [
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
            "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800"
        ]
    },
    {
        title: "Phòng trọ giá rẻ Thanh Khê",
        description: "Phòng trọ sạch sẽ, giá sinh viên. Gần trường ĐH, chợ, siêu thị.",
        propertyType: "phong-tro",
        price: 2000000,
        deposit: 2000000,
        area: 20,
        bedrooms: 1,
        bathrooms: 1,
        street: "456 Điện Biên Phủ",
        ward: "Phường Chính Gián",
        district: "Quận Thanh Khê",
        city: "Đà Nẵng",
        amenities: ["wifi", "parking"],
        images: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"
        ]
    },

    // THÊM MỘT SỐ LOẠI ĐẶC BIỆT
    {
        title: "Studio cao cấp full nội thất Q1",
        description: "Studio thiết kế hiện đại, nội thất châu Âu. Gym, hồ bơi, BBQ area. View thành phố tuyệt đẹp.",
        propertyType: "can-ho",
        price: 9000000,
        deposit: 18000000,
        area: 38,
        bedrooms: 1,
        bathrooms: 1,
        street: "88 Đồng Khởi",
        ward: "Phường Bến Nghé",
        district: "Quận 1",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security", "pool", "gym"],
        images: [
            "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
        ]
    },
    {
        title: "Penthouse duplex Quận 2",
        description: "Penthouse 2 tầng siêu sang, sân vườn riêng trên cao. Nội thất 5 sao, view sông tuyệt đẹp.",
        propertyType: "can-ho",
        price: 45000000,
        deposit: 90000000,
        area: 200,
        bedrooms: 4,
        bathrooms: 4,
        street: "999 Nguyễn Duy Trinh",
        ward: "Phường Bình Trưng Đông",
        district: "Thành phố Thủ Đức",
        city: "TP. Hồ Chí Minh",
        amenities: ["wifi", "airConditioner", "waterHeater", "parking", "kitchen", "elevator", "security", "pool", "gym", "garden"],
        images: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
            "https://images.unsplash.com/photo-1600573472556-e636c2f0b6d3?w=800"
        ]
    }
];

async function seedProperties() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homerent');
        console.log('✅ Connected to MongoDB');

        // Find a landlord user (or create one)
        let landlord = await User.findOne({ role: 'landlord' });
        
        if (!landlord) {
            console.log('⚠️ No landlord found, creating one...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('landlord123', 10);
            
            landlord = await User.create({
                name: 'Chủ nhà Demo',
                email: 'landlord@demo.com',
                password: hashedPassword,
                phone: '0901234567',
                role: 'landlord'
            });
            console.log('✅ Created demo landlord');
        }

        console.log(`📝 Creating 20 properties for landlord: ${landlord.name}`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < propertiesData.length; i++) {
            const data = propertiesData[i];
            
            try {
                console.log(`\n[${i + 1}/20] Creating: ${data.title}`);
                
                // Get coordinates from geocoding service
                let coordinates = [106.6297, 10.8231]; // Default
                try {
                    const geoData = await geocodingService.getCoordinatesFromAddress(
                        data.street,
                        data.ward,
                        data.district,
                        data.city
                    );
                    coordinates = [geoData.lng, geoData.lat];
                    console.log(`   📍 Coordinates: [${coordinates[0]}, ${coordinates[1]}]`);
                } catch (geoError) {
                    console.warn(`   ⚠️ Geocoding failed, using default`);
                }

                // Create property
                const property = await Property.create({
                    title: data.title,
                    description: data.description,
                    propertyType: data.propertyType,
                    price: data.price,
                    deposit: data.deposit,
                    area: data.area,
                    bedrooms: data.bedrooms,
                    bathrooms: data.bathrooms,
                    address: {
                        street: data.street,
                        ward: data.ward,
                        district: data.district,
                        city: data.city,
                        full: `${data.street}, ${data.ward}, ${data.district}, ${data.city}`
                    },
                    location: {
                        type: 'Point',
                        coordinates: coordinates,
                        address: data.street,
                        ward: data.ward,
                        district: data.district,
                        province: data.city
                    },
                    amenities: data.amenities,
                    images: data.images,
                    landlord: landlord._id,
                    status: 'available' // Available for rent
                });

                console.log(`   ✅ Created successfully (ID: ${property._id})`);
                successCount++;

                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`   ❌ Error creating property: ${error.message}`);
                errorCount++;
            }
        }

        console.log('\n========================================');
        console.log('📊 SEED SUMMARY:');
        console.log(`✅ Success: ${successCount} properties`);
        console.log(`❌ Failed: ${errorCount} properties`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
seedProperties();
