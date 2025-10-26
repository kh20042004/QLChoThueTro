/**
 * Script test kết nối và đọc dữ liệu MongoDB
 * Chạy: node test-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('./src/config/colors');

// Import models
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const Booking = require('./src/models/Booking');
const Review = require('./src/models/Review');

// Kết nối MongoDB
const testMongoDB = async () => {
  try {
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🔍 TEST MONGODB CONNECTION${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    // 1. Kết nối
    console.log(`${colors.yellow}1. Đang kết nối MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Kết nối thành công!${colors.reset}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}\n`);

    // 2. Kiểm tra collections
    console.log(`${colors.yellow}2. Kiểm tra collections...${colors.reset}`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`${colors.green}✓ Tìm thấy ${collections.length} collections:${colors.reset}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // 3. Đếm documents trong mỗi collection
    console.log(`${colors.yellow}3. Đếm số lượng documents...${colors.reset}`);
    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const reviewCount = await Review.countDocuments();

    console.log(`${colors.green}✓ Số lượng documents:${colors.reset}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Properties: ${propertyCount}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Reviews: ${reviewCount}\n`);

    // 4. Lấy một số sample documents
    console.log(`${colors.yellow}4. Lấy sample documents...${colors.reset}`);

    // Lấy 3 users đầu tiên
    const users = await User.find().limit(3).select('name email role status');
    if (users.length > 0) {
      console.log(`${colors.green}✓ Sample Users (${users.length}):${colors.reset}`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      Role: ${user.role}, Status: ${user.status}`);
      });
    } else {
      console.log(`${colors.yellow}⚠ Chưa có users trong database${colors.reset}`);
    }
    console.log('');

    // Lấy 3 properties đầu tiên
    const properties = await Property.find()
      .limit(3)
      .select('title propertyType price status')
      .populate('landlord', 'name email');
    
    if (properties.length > 0) {
      console.log(`${colors.green}✓ Sample Properties (${properties.length}):${colors.reset}`);
      properties.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.title}`);
        console.log(`      Type: ${prop.propertyType}, Price: ${prop.price?.toLocaleString('vi-VN')} VNĐ`);
        console.log(`      Status: ${prop.status}`);
        if (prop.landlord) {
          console.log(`      Landlord: ${prop.landlord.name} (${prop.landlord.email})`);
        }
      });
    } else {
      console.log(`${colors.yellow}⚠ Chưa có properties trong database${colors.reset}`);
    }
    console.log('');

    // Lấy bookings
    const bookings = await Booking.find()
      .limit(3)
      .select('status paymentStatus monthlyRent')
      .populate('tenant', 'name email')
      .populate('property', 'title');
    
    if (bookings.length > 0) {
      console.log(`${colors.green}✓ Sample Bookings (${bookings.length}):${colors.reset}`);
      bookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. Booking Status: ${booking.status}`);
        console.log(`      Payment: ${booking.paymentStatus}`);
        console.log(`      Rent: ${booking.monthlyRent?.toLocaleString('vi-VN')} VNĐ/tháng`);
        if (booking.tenant) {
          console.log(`      Tenant: ${booking.tenant.name}`);
        }
        if (booking.property) {
          console.log(`      Property: ${booking.property.title}`);
        }
      });
    } else {
      console.log(`${colors.yellow}⚠ Chưa có bookings trong database${colors.reset}`);
    }
    console.log('');

    // Lấy reviews
    const reviews = await Review.find()
      .limit(3)
      .select('title rating verified')
      .populate('user', 'name')
      .populate('property', 'title');
    
    if (reviews.length > 0) {
      console.log(`${colors.green}✓ Sample Reviews (${reviews.length}):${colors.reset}`);
      reviews.forEach((review, index) => {
        console.log(`   ${index + 1}. ${review.title}`);
        console.log(`      Rating: ${'⭐'.repeat(review.rating)}`);
        console.log(`      Verified: ${review.verified ? 'Yes' : 'No'}`);
        if (review.user) {
          console.log(`      By: ${review.user.name}`);
        }
      });
    } else {
      console.log(`${colors.yellow}⚠ Chưa có reviews trong database${colors.reset}`);
    }
    console.log('');

    // 5. Test query nâng cao
    console.log(`${colors.yellow}5. Test query nâng cao...${colors.reset}`);
    
    // Tìm properties có giá < 5 triệu và status = available
    const affordableProperties = await Property.find({
      price: { $lt: 5000000 },
      status: 'available'
    }).countDocuments();
    console.log(`${colors.green}✓ Phòng có giá < 5 triệu và đang available: ${affordableProperties}${colors.reset}`);

    // Tìm users có role = landlord
    const landlords = await User.find({ role: 'landlord' }).countDocuments();
    console.log(`${colors.green}✓ Số lượng landlords: ${landlords}${colors.reset}`);

    // Tìm bookings đang active
    const activeBookings = await Booking.find({ status: 'active' }).countDocuments();
    console.log(`${colors.green}✓ Số bookings đang active: ${activeBookings}${colors.reset}`);

    console.log('');
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}✅ TEST HOÀN TẤT!${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ LỖI: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    // Đóng kết nối
    await mongoose.connection.close();
    console.log(`${colors.yellow}Đã đóng kết nối MongoDB${colors.reset}`);
    process.exit(0);
  }
};

// Chạy test
testMongoDB();
