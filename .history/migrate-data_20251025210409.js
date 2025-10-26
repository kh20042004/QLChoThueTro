/**
 * Migration script: Cập nhật field names từ MySQL sang MongoDB
 * Chuyển đổi snake_case sang camelCase và nested objects
 * Chạy: node migrate-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('./src/config/colors');

const migrateData = async () => {
  try {
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🔄 DATA MIGRATION${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Đã kết nối MongoDB${colors.reset}\n`);

    const db = mongoose.connection.db;

    // ==========================================
    // 1. Migrate Properties Collection
    // ==========================================
    console.log(`${colors.yellow}1. Migrating Properties...${colors.reset}`);
    const propertiesCollection = db.collection('properties');
    
    // Lấy tất cả properties
    const properties = await propertiesCollection.find({}).toArray();
    console.log(`   Found ${properties.length} properties`);

    let propertyUpdated = 0;
    for (const property of properties) {
      const updates = {};
      let needsUpdate = false;

      // Chuyển property_type -> propertyType
      if (property.property_type && !property.propertyType) {
        updates.propertyType = property.property_type;
        updates.$unset = updates.$unset || {};
        updates.$unset.property_type = '';
        needsUpdate = true;
      }

      // Chuyển address fields sang nested object
      if (property.address_street || property.address_ward || property.address_district || property.address_city) {
        updates.address = {
          street: property.address_street || '',
          ward: property.address_ward || '',
          district: property.address_district || '',
          city: property.address_city || '',
          full: property.address_full || `${property.address_street}, ${property.address_ward}, ${property.address_district}, ${property.address_city}`
        };
        updates.$unset = updates.$unset || {};
        updates.$unset.address_street = '';
        updates.$unset.address_ward = '';
        updates.$unset.address_district = '';
        updates.$unset.address_city = '';
        updates.$unset.address_full = '';
        needsUpdate = true;
      }

      // Chuyển landlord_id -> landlord
      if (property.landlord_id && !property.landlord) {
        updates.landlord = property.landlord_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.landlord_id = '';
        needsUpdate = true;
      }

      // Chuyển average_rating -> averageRating
      if (property.average_rating !== undefined && !property.averageRating) {
        updates.averageRating = property.average_rating;
        updates.$unset = updates.$unset || {};
        updates.$unset.average_rating = '';
        needsUpdate = true;
      }

      // Chuyển total_reviews -> totalReviews
      if (property.total_reviews !== undefined && !property.totalReviews) {
        updates.totalReviews = property.total_reviews;
        updates.$unset = updates.$unset || {};
        updates.$unset.total_reviews = '';
        needsUpdate = true;
      }

      // Chuyển ai_score -> aiScore
      if (property.ai_score !== undefined && !property.aiScore) {
        updates.aiScore = property.ai_score;
        updates.$unset = updates.$unset || {};
        updates.$unset.ai_score = '';
        needsUpdate = true;
      }

      // Chuyển utilities sang nested object
      if (property.utility_electric || property.utility_water || property.utility_internet || property.utility_parking) {
        updates.utilities = {
          electric: property.utility_electric || 'Theo đồng hồ',
          water: property.utility_water || 'Theo đồng hồ',
          internet: property.utility_internet || 'Miễn phí',
          parking: property.utility_parking || 'Miễn phí'
        };
        updates.$unset = updates.$unset || {};
        updates.$unset.utility_electric = '';
        updates.$unset.utility_water = '';
        updates.$unset.utility_internet = '';
        updates.$unset.utility_parking = '';
        needsUpdate = true;
      }

      // Chuyển location nếu có latitude/longitude
      if (property.latitude && property.longitude && !property.location) {
        updates.location = {
          type: 'Point',
          coordinates: [parseFloat(property.longitude), parseFloat(property.latitude)]
        };
        updates.$unset = updates.$unset || {};
        updates.$unset.latitude = '';
        updates.$unset.longitude = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateDoc = { $set: updates };
        if (updates.$unset) {
          updateDoc.$unset = updates.$unset;
          delete updates.$unset;
        }
        
        await propertiesCollection.updateOne(
          { _id: property._id },
          updateDoc
        );
        propertyUpdated++;
      }
    }
    console.log(`${colors.green}✓ Updated ${propertyUpdated} properties${colors.reset}\n`);

    // ==========================================
    // 2. Migrate Bookings Collection
    // ==========================================
    console.log(`${colors.yellow}2. Migrating Bookings...${colors.reset}`);
    const bookingsCollection = db.collection('bookings');
    
    const bookings = await bookingsCollection.find({}).toArray();
    console.log(`   Found ${bookings.length} bookings`);

    let bookingUpdated = 0;
    for (const booking of bookings) {
      const updates = {};
      let needsUpdate = false;

      // Chuyển property_id -> property
      if (booking.property_id && !booking.property) {
        updates.property = booking.property_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.property_id = '';
        needsUpdate = true;
      }

      // Chuyển tenant_id -> tenant
      if (booking.tenant_id && !booking.tenant) {
        updates.tenant = booking.tenant_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.tenant_id = '';
        needsUpdate = true;
      }

      // Chuyển landlord_id -> landlord
      if (booking.landlord_id && !booking.landlord) {
        updates.landlord = booking.landlord_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.landlord_id = '';
        needsUpdate = true;
      }

      // Chuyển các date fields
      if (booking.start_date && !booking.startDate) {
        updates.startDate = booking.start_date;
        updates.$unset = updates.$unset || {};
        updates.$unset.start_date = '';
        needsUpdate = true;
      }

      if (booking.end_date && !booking.endDate) {
        updates.endDate = booking.end_date;
        updates.$unset = updates.$unset || {};
        updates.$unset.end_date = '';
        needsUpdate = true;
      }

      // Chuyển các amount fields
      if (booking.monthly_rent !== undefined && !booking.monthlyRent) {
        updates.monthlyRent = booking.monthly_rent;
        updates.$unset = updates.$unset || {};
        updates.$unset.monthly_rent = '';
        needsUpdate = true;
      }

      if (booking.total_amount !== undefined && !booking.totalAmount) {
        updates.totalAmount = booking.total_amount;
        updates.$unset = updates.$unset || {};
        updates.$unset.total_amount = '';
        needsUpdate = true;
      }

      if (booking.payment_status && !booking.paymentStatus) {
        updates.paymentStatus = booking.payment_status;
        updates.$unset = updates.$unset || {};
        updates.$unset.payment_status = '';
        needsUpdate = true;
      }

      if (booking.payment_method && !booking.paymentMethod) {
        updates.paymentMethod = booking.payment_method;
        updates.$unset = updates.$unset || {};
        updates.$unset.payment_method = '';
        needsUpdate = true;
      }

      if (booking.cancel_reason && !booking.cancelReason) {
        updates.cancelReason = booking.cancel_reason;
        updates.$unset = updates.$unset || {};
        updates.$unset.cancel_reason = '';
        needsUpdate = true;
      }

      if (booking.contract_file && !booking.contractFile) {
        updates.contractFile = booking.contract_file;
        updates.$unset = updates.$unset || {};
        updates.$unset.contract_file = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateDoc = { $set: updates };
        if (updates.$unset) {
          updateDoc.$unset = updates.$unset;
          delete updates.$unset;
        }
        
        await bookingsCollection.updateOne(
          { _id: booking._id },
          updateDoc
        );
        bookingUpdated++;
      }
    }
    console.log(`${colors.green}✓ Updated ${bookingUpdated} bookings${colors.reset}\n`);

    // ==========================================
    // 3. Migrate Reviews Collection
    // ==========================================
    console.log(`${colors.yellow}3. Migrating Reviews...${colors.reset}`);
    const reviewsCollection = db.collection('reviews');
    
    const reviews = await reviewsCollection.find({}).toArray();
    console.log(`   Found ${reviews.length} reviews`);

    let reviewUpdated = 0;
    for (const review of reviews) {
      const updates = {};
      let needsUpdate = false;

      // Chuyển property_id -> property
      if (review.property_id && !review.property) {
        updates.property = review.property_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.property_id = '';
        needsUpdate = true;
      }

      // Chuyển user_id -> user
      if (review.user_id && !review.user) {
        updates.user = review.user_id;
        updates.$unset = updates.$unset || {};
        updates.$unset.user_id = '';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateDoc = { $set: updates };
        if (updates.$unset) {
          updateDoc.$unset = updates.$unset;
          delete updates.$unset;
        }
        
        await reviewsCollection.updateOne(
          { _id: review._id },
          updateDoc
        );
        reviewUpdated++;
      }
    }
    console.log(`${colors.green}✓ Updated ${reviewUpdated} reviews${colors.reset}\n`);

    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}✅ MIGRATION HOÀN TẤT!${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    console.log(`${colors.green}Tổng kết:${colors.reset}`);
    console.log(`  - Properties updated: ${propertyUpdated}/${properties.length}`);
    console.log(`  - Bookings updated: ${bookingUpdated}/${bookings.length}`);
    console.log(`  - Reviews updated: ${reviewUpdated}/${reviews.length}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ LỖI: ${error.message}${colors.reset}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Đã đóng kết nối MongoDB${colors.reset}`);
    process.exit(0);
  }
};

migrateData();
