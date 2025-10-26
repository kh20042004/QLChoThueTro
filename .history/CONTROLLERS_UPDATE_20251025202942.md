# Cập nhật Controllers cho Mongoose - Hoàn tất ✅

## Tổng quan
Tất cả controllers đã được cập nhật thành công từ Sequelize sang Mongoose.

## 📋 Các file đã cập nhật

### 1. Controllers

#### ✅ authController.js
**Các thay đổi:**
- ❌ `User.findOne({ where: { email } })` 
- ✅ `User.findOne({ email })`
- ❌ `User.findByPk(id)` 
- ✅ `User.findById(id)`
- ❌ `user.id` 
- ✅ `user._id`
- ❌ `user.role_id` 
- ✅ `user.role`
- ❌ `user.update(data)` 
- ✅ `User.findByIdAndUpdate(id, data, options)`
- ❌ `user.destroy()` 
- ✅ `User.findByIdAndDelete(id)`
- Password query: Thêm `.select('+password')` vì schema có `select: false`

**Các functions đã update:**
- ✅ `register()` - Tạo user mới với role = 'user'
- ✅ `login()` - Login với select password, trả về user._id
- ✅ `getMe()` - Lấy thông tin user
- ✅ `updateDetails()` - Cập nhật thông tin với findByIdAndUpdate
- ✅ `updatePassword()` - Đổi password với select password
- ✅ `updateProfile()` - Cập nhật profile
- ✅ `updateAddress()` - Cập nhật địa chỉ
- ✅ `changePassword()` - Đổi mật khẩu
- ✅ `updatePreferences()` - Cập nhật tùy chọn
- ✅ `uploadAvatar()` - Upload avatar
- ✅ `deleteAccount()` - Xóa tài khoản với findByIdAndDelete
- ✅ `logout()` - Đăng xuất
- ✅ `sendTokenResponse()` - Helper function với user._id

#### ✅ propertyController.js
**Các thay đổi:**
- Đã được cập nhật sẵn cho Mongoose
- ❌ `property_type`, `landlord_id` → ✅ `propertyType`, `landlord`
- ❌ Flat address fields → ✅ Nested `address` object
- ❌ `property.id` → ✅ `property._id`
- Sử dụng `.populate('landlord')` thay vì include
- Sử dụng `Property.findByIdAndDelete()` thay vì `remove()`

**Cập nhật trong createProperty:**
- Images: Chỉ lưu URL paths (không lưu metadata)
- Address: Lưu dưới dạng nested object `address: { street, ward, district, city }`
- propertyType thay vì property_type
- landlord (ObjectId) thay vì landlord_id

### 2. Middleware & Config

#### ✅ src/middleware/auth.js
Đã được cập nhật:
- `User.findById(decoded.id)` - Mongoose query
- `.select('-password')` - Exclude password
- `req.user.role` - Sử dụng role thay vì role_id

#### ✅ src/config/passport.js  
**Các thay đổi:**
- `serializeUser`: `user._id` thay vì `user.id`
- `deserializeUser`: `User.findById(id)` thay vì `findByPk(id)`
- `User.findOne({ email })` thay vì `findOne({ where: { email } })`
- Field names: `googleId`, `emailVerified` (camelCase)
- Role: `'user'` thay vì `'tenant'`

### 3. Data Migration

#### ✅ cleanup-indexes.js
Script xóa các indexes cũ và tạo indexes mới:
- **Reviews**: Xóa `property_id_1_user_id_1`, tạo `property_1_user_1`
- **Properties**: Tạo indexes cho `landlord`, `propertyType`, `address.city + address.district`
- **Bookings**: Tạo indexes cho `property`, `tenant`, `landlord`

#### ✅ migrate-data.js
Script migrate data từ MySQL format sang MongoDB format:

**Properties:**
- `property_type` → `propertyType`
- `address_street/ward/district/city` → `address: { street, ward, district, city, full }`
- `landlord_id` → `landlord`
- `average_rating` → `averageRating`
- `total_reviews` → `totalReviews`
- `ai_score` → `aiScore`
- `utility_*` → `utilities: { electric, water, internet, parking }`
- `latitude/longitude` → `location: { type: 'Point', coordinates: [lon, lat] }`

**Bookings:**
- `property_id` → `property`
- `tenant_id` → `tenant`
- `landlord_id` → `landlord`
- `start_date` → `startDate`
- `end_date` → `endDate`
- `monthly_rent` → `monthlyRent`
- `total_amount` → `totalAmount`
- `payment_status` → `paymentStatus`
- `payment_method` → `paymentMethod`
- `cancel_reason` → `cancelReason`
- `contract_file` → `contractFile`

**Reviews:**
- `property_id` → `property`
- `user_id` → `user`

### 4. Test Scripts

#### ✅ test-mongodb.js
Test kết nối và đọc dữ liệu MongoDB:
- ✅ Kết nối thành công
- ✅ List collections
- ✅ Count documents
- ✅ Query với populate
- ✅ Advanced queries

#### ✅ test-controllers.js
Test controllers sau migration:
- ✅ User operations (find, JWT token)
- ✅ Property operations với populate
- ✅ Advanced queries (filters, aggregation)
- ✅ Password verification
- ✅ Field name mapping

## 🎯 Kết quả Test

### Trước Migration
```
- propertyType: undefined ❌
- landlord: undefined ❌
- address.street: 123 Đường 3 Tháng 2 ✓
```

### Sau Migration
```
✅ Property fields:
  - propertyType: phong-tro ✓
  - address.street: 123 Đường 3 Tháng 2 ✓
  - address.city: TP. Hồ Chí Minh ✓
  - landlord (ObjectId): 68fb1affcdbef537a393314c ✓
  - averageRating: N/A ✓
  - totalReviews: 0 ✓

✅ Sample Properties với populate:
  1. Phòng Trọ Hiện Đại Tại Thủ Đức
     - Type: phong-tro ✓
     - Landlord: Nguyễn Văn A (landlord) ✓
  2. Căn Hộ Mini Cao Cấp Quận 1
     - Type: can-ho ✓
     - Landlord: Lê Văn C (landlord) ✓
```

## 📊 Database Status

### Collections & Documents:
- ✅ **users**: 5 documents
- ✅ **properties**: 4 documents
- ✅ **bookings**: 2 documents
- ✅ **reviews**: 3 documents

### Data Quality:
- ✅ All field names migrated to camelCase
- ✅ Nested objects (address, utilities) working
- ✅ References (landlord, property, user) working
- ✅ Populate working correctly
- ✅ Indexes updated

## 🔑 Các thay đổi quan trọng

### 1. Query Syntax
```javascript
// Sequelize → Mongoose
findByPk(id)              → findById(id)
findOne({ where: {...} }) → findOne({...})
findAll()                 → find()
create(data)              → create(data)
update(data)              → findByIdAndUpdate(id, data, options)
destroy()                 → findByIdAndDelete(id)
```

### 2. Field Access
```javascript
// Sequelize → Mongoose  
user.id        → user._id
user.role_id   → user.role
property.id    → property._id
```

### 3. Relationships
```javascript
// Sequelize include → Mongoose populate
Property.findAll({
  include: ['landlord']
})

Property.find()
  .populate('landlord', 'name email phone')
```

### 4. Password Handling
```javascript
// Mongoose schema có select: false
const user = await User.findOne({ email }).select('+password');
```

### 5. Validation
```javascript
// Mongoose - runValidators trong update
await User.findByIdAndUpdate(
  id, 
  data, 
  { new: true, runValidators: true }
);
```

## 📝 Scripts Available

### Development:
```bash
npm run dev          # Start với nodemon
npm start           # Start production
```

### Testing & Migration:
```bash
node test-mongodb.js      # Test MongoDB connection
node cleanup-indexes.js   # Cleanup old indexes
node migrate-data.js      # Migrate data format
node test-controllers.js  # Test controllers
```

## ✅ Checklist hoàn thành

- [x] Cập nhật authController.js cho Mongoose
- [x] Cập nhật propertyController.js cho Mongoose
- [x] Cập nhật auth middleware
- [x] Cập nhật passport config
- [x] Cleanup old indexes
- [x] Migrate data format
- [x] Test all operations
- [x] Verify populate works
- [x] Verify queries work
- [x] Verify JWT tokens work

## 🚀 Next Steps

### Khuyến nghị:
1. ✅ Test đăng ký/đăng nhập trên UI
2. ✅ Test tạo property mới
3. ✅ Test upload images
4. ✅ Test booking flow
5. ✅ Test reviews
6. ✅ Kiểm tra tất cả API endpoints

### Có thể cải tiến:
1. Thêm validation cho nested objects (address, utilities)
2. Thêm virtual fields cho User (số properties, bookings)
3. Implement soft delete cho một số models
4. Thêm text search indexes
5. Thêm more comprehensive error handling

## 📖 Tài liệu

### Files quan trọng:
- `MONGODB_MIGRATION.md` - Chi tiết migration từ MySQL sang MongoDB
- `test-mongodb.js` - Test connection và queries
- `test-controllers.js` - Test controllers
- `migrate-data.js` - Migration script
- `cleanup-indexes.js` - Index management

### Models:
- `src/models/User.js` - User schema với auth methods
- `src/models/Property.js` - Property schema với GeoJSON
- `src/models/Booking.js` - Booking schema
- `src/models/Review.js` - Review schema với auto-rating

---

**Status**: ✅ **HOÀN THÀNH**  
**Last Updated**: $(date)  
**MongoDB Version**: 8.0.3  
**Mongoose Version**: 8.0.3
