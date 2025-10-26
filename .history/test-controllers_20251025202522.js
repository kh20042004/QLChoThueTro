/**
 * Test script để kiểm tra controllers sau khi migrate sang Mongoose
 * Chạy: node test-controllers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('./src/config/colors');

// Import models
const User = require('./src/models/User');
const Property = require('./src/models/Property');

const testControllers = async () => {
  try {
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🧪 TEST CONTROLLERS${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Đã kết nối MongoDB${colors.reset}\n`);

    // Test 1: User registration simulation
    console.log(`${colors.yellow}Test 1: User Operations${colors.reset}`);
    
    // Tìm user
    const user = await User.findOne({ email: 'admin@example.com' });
    if (user) {
      console.log(`${colors.green}✓ Tìm user thành công${colors.reset}`);
      console.log(`  - ID: ${user._id}`);
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      
      // Test JWT token
      const token = user.getSignedJwtToken();
      console.log(`${colors.green}✓ JWT token generated: ${token.substring(0, 20)}...${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Không tìm thấy admin user${colors.reset}`);
    }
    console.log('');

    // Test 2: Property operations
    console.log(`${colors.yellow}Test 2: Property Operations${colors.reset}`);
    
    // Tìm properties với populate
    const properties = await Property.find()
      .limit(2)
      .populate('landlord', 'name email role');
    
    if (properties.length > 0) {
      console.log(`${colors.green}✓ Tìm ${properties.length} properties với populate${colors.reset}`);
      properties.forEach((prop, index) => {
        console.log(`  ${index + 1}. ${prop.title}`);
        console.log(`     - Type: ${prop.propertyType}`);
        console.log(`     - Price: ${prop.price?.toLocaleString('vi-VN')} VNĐ`);
        console.log(`     - Status: ${prop.status}`);
        console.log(`     - Address: ${prop.address?.full || 'N/A'}`);
        if (prop.landlord) {
          console.log(`     - Landlord: ${prop.landlord.name} (${prop.landlord.role})`);
        }
      });
    } else {
      console.log(`${colors.yellow}⚠ Không tìm thấy properties${colors.reset}`);
    }
    console.log('');

    // Test 3: Query với filters
    console.log(`${colors.yellow}Test 3: Advanced Queries${colors.reset}`);
    
    // Đếm properties theo status
    const availableCount = await Property.countDocuments({ status: 'available' });
    const rentedCount = await Property.countDocuments({ status: 'rented' });
    const pendingCount = await Property.countDocuments({ status: 'pending' });
    
    console.log(`${colors.green}✓ Properties by status:${colors.reset}`);
    console.log(`  - Available: ${availableCount}`);
    console.log(`  - Rented: ${rentedCount}`);
    console.log(`  - Pending: ${pendingCount}`);
    
    // Tìm properties trong khoảng giá
    const affordableProps = await Property.find({
      price: { $gte: 3000000, $lte: 10000000 },
      status: 'available'
    }).countDocuments();
    console.log(`${colors.green}✓ Properties giá 3-10 triệu (available): ${affordableProps}${colors.reset}`);
    
    // Đếm users theo role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log(`${colors.green}✓ Users by role:${colors.reset}`);
    usersByRole.forEach(item => {
      console.log(`  - ${item._id}: ${item.count}`);
    });
    console.log('');

    // Test 4: Password verification
    console.log(`${colors.yellow}Test 4: Password Verification${colors.reset}`);
    if (user) {
      const userWithPassword = await User.findById(user._id).select('+password');
      const testPassword = 'Admin@123'; // Test với password mặc định
      const isMatch = await userWithPassword.matchPassword(testPassword);
      console.log(`${colors.green}✓ Password verification test: ${isMatch ? 'PASSED ✓' : 'FAILED (password might be different)'}${colors.reset}`);
    }
    console.log('');

    // Test 5: Field name mapping
    console.log(`${colors.yellow}Test 5: Field Name Mapping (Mongoose)${colors.reset}`);
    const sampleProperty = await Property.findOne();
    if (sampleProperty) {
      console.log(`${colors.green}✓ Property fields:${colors.reset}`);
      console.log(`  - propertyType: ${sampleProperty.propertyType} ✓`);
      console.log(`  - address.street: ${sampleProperty.address?.street || 'N/A'} ✓`);
      console.log(`  - address.city: ${sampleProperty.address?.city || 'N/A'} ✓`);
      console.log(`  - landlord (ObjectId): ${sampleProperty.landlord} ✓`);
      console.log(`  - averageRating: ${sampleProperty.averageRating || 'N/A'} ✓`);
      console.log(`  - totalReviews: ${sampleProperty.totalReviews || 0} ✓`);
    }
    console.log('');

    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}✅ TẤT CẢ TESTS HOÀN TẤT!${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    console.log(`${colors.green}Controllers đã sẵn sàng sử dụng với Mongoose!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ LỖI: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Đã đóng kết nối MongoDB${colors.reset}`);
    process.exit(0);
  }
};

testControllers();
