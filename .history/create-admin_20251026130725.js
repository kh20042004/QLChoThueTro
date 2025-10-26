/**
 * ===================================
 * CREATE ADMIN ACCOUNT SCRIPT
 * Script tạo tài khoản admin
 * ===================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

// Admin account details
const ADMIN_DATA = {
  name: 'Admin',
  email: 'tk04052k4@gmail.com',
  password: '11331133',
  phone: '0123456789',
  role: 'admin',
  status: 'active',
  emailVerified: true
};

/**
 * Kết nối database và tạo admin
 */
const createAdmin = async () => {
  try {
    // Kết nối MongoDB
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công!\n');

    // Kiểm tra xem admin đã tồn tại chưa
    console.log(`🔍 Kiểm tra tài khoản: ${ADMIN_DATA.email}`);
    const existingAdmin = await User.findOne({ email: ADMIN_DATA.email });

    if (existingAdmin) {
      console.log('⚠️  Tài khoản admin đã tồn tại!');
      console.log('📝 Thông tin tài khoản hiện tại:');
      console.log(`   - ID: ${existingAdmin._id}`);
      console.log(`   - Name: ${existingAdmin.name}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      console.log(`   - Status: ${existingAdmin.status}`);
      console.log(`   - Created: ${existingAdmin.createdAt}\n`);

      // Hỏi có muốn cập nhật mật khẩu không
      console.log('💡 Để cập nhật mật khẩu, hãy xóa tài khoản cũ trước:');
      console.log(`   User.deleteOne({ email: '${ADMIN_DATA.email}' })\n`);
      
      process.exit(0);
    }

    // Tạo admin mới
    console.log('🚀 Đang tạo tài khoản admin mới...');
    const admin = await User.create(ADMIN_DATA);

    console.log('✅ Tạo tài khoản admin thành công!\n');
    console.log('📋 THÔNG TIN TÀI KHOẢN ADMIN:');
    console.log('================================');
    console.log(`ID:       ${admin._id}`);
    console.log(`Name:     ${admin.name}`);
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${ADMIN_DATA.password} (đã mã hóa trong DB)`);
    console.log(`Role:     ${admin.role}`);
    console.log(`Status:   ${admin.status}`);
    console.log(`Phone:    ${admin.phone}`);
    console.log(`Created:  ${admin.createdAt}`);
    console.log('================================\n');

    console.log('🎉 Bạn có thể đăng nhập với tài khoản này ngay bây giờ!');
    console.log(`   URL: http://localhost:3000/auth/login`);
    console.log(`   Email: ${ADMIN_DATA.email}`);
    console.log(`   Password: ${ADMIN_DATA.password}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    
    if (error.code === 11000) {
      console.log('\n⚠️  Email đã được sử dụng! Vui lòng sử dụng email khác.\n');
    }
    
    process.exit(1);
  }
};

// Chạy script
console.log('\n🔧 SCRIPT TẠO TÀI KHOẢN ADMIN');
console.log('================================\n');
createAdmin();
