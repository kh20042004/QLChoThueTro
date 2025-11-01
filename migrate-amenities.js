/**
 * Migration script: Convert amenities from Array to Object
 * Chuyển đổi amenities từ dạng array sang object theo schema mới
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./src/models/Property');

// Mapping từ tên cũ sang tên mới
const AMENITIES_MAPPING = {
  'wifi': 'wifi',
  'air-conditioner': 'ac',
  'ac': 'ac',
  'điều hòa': 'ac',
  'parking': 'parking',
  'bãi đỗ xe': 'parking',
  'kitchen': 'kitchen',
  'bếp': 'kitchen',
  'water': 'water',
  'nước': 'water',
  'laundry': 'laundry',
  'máy giặt': 'laundry',
  'balcony': 'balcony',
  'ban công': 'balcony',
  'security': 'security',
  'bảo vệ': 'security',
  'elevator': 'security', // Map elevator to security as fallback
  'thang máy': 'security'
};

const migrateAmenities = async () => {
  try {
    console.log('🔗 Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/QLChoThueTro', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả properties có amenities là array
    const properties = await Property.find({}).lean();
    console.log(`📊 Tìm thấy ${properties.length} properties`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const prop of properties) {
      try {
        console.log(`\n🔍 Property ${prop._id}:`);
        console.log(`   Type: ${typeof prop.amenities}, IsArray: ${Array.isArray(prop.amenities)}`);
        console.log(`   Value:`, prop.amenities);
        
        // Kiểm tra nếu amenities là array
        if (Array.isArray(prop.amenities)) {
          console.log(`\n🔄 Migrating property ${prop._id}...`);
          console.log(`   Old amenities (array):`, prop.amenities);

          // Chuyển đổi array sang object
          const newAmenities = {
            wifi: false,
            ac: false,
            parking: false,
            kitchen: false,
            water: false,
            laundry: false,
            balcony: false,
            security: false
          };

          // Duyệt qua array và set true cho các amenities có trong array
          prop.amenities.forEach(amenity => {
            const amenityLower = amenity.toLowerCase().trim();
            const mappedKey = AMENITIES_MAPPING[amenityLower];
            if (mappedKey) {
              newAmenities[mappedKey] = true;
            } else {
              console.warn(`   ⚠️  Unknown amenity: "${amenity}"`);
            }
          });

          console.log(`   New amenities (object):`, newAmenities);

          // Xóa field amenities cũ và tạo mới - sử dụng raw MongoDB operation
          await mongoose.connection.collection('properties').updateOne(
            { _id: prop._id },
            { 
              $unset: { amenities: "" }
            }
          );
          
          // Sau đó set lại với object mới
          await mongoose.connection.collection('properties').updateOne(
            { _id: prop._id },
            { 
              $set: { amenities: newAmenities }
            }
          );

          migratedCount++;
          console.log(`   ✅ Migrated successfully`);
        } else if (typeof prop.amenities === 'object' && prop.amenities !== null) {
          // Đã là object, kiểm tra xem có đủ fields không
          const hasAllFields = ['wifi', 'ac', 'parking', 'kitchen', 'water', 'laundry', 'balcony', 'security']
            .every(field => field in prop.amenities);
          
          if (!hasAllFields) {
            console.log(`\n🔧 Fixing incomplete object for property ${prop._id}...`);
            const fixedAmenities = {
              wifi: prop.amenities.wifi || false,
              ac: prop.amenities.ac || false,
              parking: prop.amenities.parking || false,
              kitchen: prop.amenities.kitchen || false,
              water: prop.amenities.water || false,
              laundry: prop.amenities.laundry || false,
              balcony: prop.amenities.balcony || false,
              security: prop.amenities.security || false
            };
            
            await Property.updateOne(
              { _id: prop._id },
              { $set: { amenities: fixedAmenities } }
            );
            
            migratedCount++;
            console.log(`   ✅ Fixed successfully`);
          } else {
            skippedCount++;
          }
        } else {
          console.log(`\n⚠️  Property ${prop._id} has unusual amenities type:`, typeof prop.amenities);
          skippedCount++;
        }
      } catch (err) {
        console.error(`\n❌ Error migrating property ${prop._id}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    console.log('\n✅ Migration hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
    process.exit(1);
  }
};

// Chạy migration
migrateAmenities();
