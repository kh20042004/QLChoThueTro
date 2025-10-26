/**
 * Script xóa các indexes cũ từ MySQL/Sequelize
 * Chạy trước khi migrate data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('./src/config/colors');

const cleanupIndexes = async () => {
  try {
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🧹 CLEANUP OLD INDEXES${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Đã kết nối MongoDB${colors.reset}\n`);

    const db = mongoose.connection.db;

    // Xóa indexes cũ của Reviews
    console.log(`${colors.yellow}1. Cleaning Reviews indexes...${colors.reset}`);
    const reviewsCollection = db.collection('reviews');
    const reviewIndexes = await reviewsCollection.indexes();
    
    console.log('   Current indexes:', reviewIndexes.map(idx => idx.name).join(', '));
    
    // Xóa index cũ property_id_1_user_id_1
    try {
      await reviewsCollection.dropIndex('property_id_1_user_id_1');
      console.log(`${colors.green}   ✓ Dropped old index: property_id_1_user_id_1${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}   ⚠ Index property_id_1_user_id_1 không tồn tại${colors.reset}`);
    }

    // Tạo index mới cho Mongoose schema
    try {
      await reviewsCollection.createIndex({ property: 1, user: 1 }, { unique: true });
      console.log(`${colors.green}   ✓ Created new index: property_1_user_1${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}   ⚠ Index property_1_user_1 đã tồn tại${colors.reset}`);
    }

    console.log('');

    // Properties collection
    console.log(`${colors.yellow}2. Cleaning Properties indexes...${colors.reset}`);
    const propertiesCollection = db.collection('properties');
    const propertyIndexes = await propertiesCollection.indexes();
    
    console.log('   Current indexes:', propertyIndexes.map(idx => idx.name).join(', '));
    
    // Danh sách indexes cũ cần xóa
    const oldPropertyIndexes = [
      'landlord_id_1',
      'property_type_1',
      'address_city_1_address_district_1'
    ];

    for (const indexName of oldPropertyIndexes) {
      try {
        await propertiesCollection.dropIndex(indexName);
        console.log(`${colors.green}   ✓ Dropped old index: ${indexName}${colors.reset}`);
      } catch (err) {
        console.log(`${colors.yellow}   ⚠ Index ${indexName} không tồn tại${colors.reset}`);
      }
    }

    // Tạo indexes mới
    try {
      await propertiesCollection.createIndex({ landlord: 1 });
      console.log(`${colors.green}   ✓ Created index: landlord_1${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}   ⚠ Index landlord_1 đã tồn tại${colors.reset}`);
    }

    try {
      await propertiesCollection.createIndex({ propertyType: 1 });
      console.log(`${colors.green}   ✓ Created index: propertyType_1${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}   ⚠ Index propertyType_1 đã tồn tại${colors.reset}`);
    }

    try {
      await propertiesCollection.createIndex({ 'address.city': 1, 'address.district': 1 });
      console.log(`${colors.green}   ✓ Created index: address.city_1_address.district_1${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}   ⚠ Index đã tồn tại${colors.reset}`);
    }

    console.log('');

    // Bookings collection
    console.log(`${colors.yellow}3. Cleaning Bookings indexes...${colors.reset}`);
    const bookingsCollection = db.collection('bookings');
    const bookingIndexes = await bookingsCollection.indexes();
    
    console.log('   Current indexes:', bookingIndexes.map(idx => idx.name).join(', '));
    
    const oldBookingIndexes = [
      'property_id_1',
      'tenant_id_1',
      'landlord_id_1'
    ];

    for (const indexName of oldBookingIndexes) {
      try {
        await bookingsCollection.dropIndex(indexName);
        console.log(`${colors.green}   ✓ Dropped old index: ${indexName}${colors.reset}`);
      } catch (err) {
        console.log(`${colors.yellow}   ⚠ Index ${indexName} không tồn tại${colors.reset}`);
      }
    }

    // Tạo indexes mới
    const newBookingIndexes = [
      { property: 1 },
      { tenant: 1 },
      { landlord: 1 }
    ];

    for (const index of newBookingIndexes) {
      try {
        await bookingsCollection.createIndex(index);
        const indexName = Object.keys(index).join('_');
        console.log(`${colors.green}   ✓ Created index: ${indexName}_1${colors.reset}`);
      } catch (err) {
        console.log(`${colors.yellow}   ⚠ Index đã tồn tại${colors.reset}`);
      }
    }

    console.log('');
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}✅ CLEANUP HOÀN TẤT!${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    console.log(`${colors.green}Bây giờ bạn có thể chạy: node migrate-data.js${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ LỖI: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Đã đóng kết nối MongoDB${colors.reset}`);
    process.exit(0);
  }
};

cleanupIndexes();
