# Chuyển đổi từ MySQL sang MongoDB - Hoàn thành ✅

## Tổng quan
Dự án đã được chuyển đổi thành công từ MySQL (Sequelize) sang MongoDB (Mongoose).

## MongoDB Connection String
```
mongodb+srv://tuankietchannal_db_user:A3qci7RkN3I72Q3w@cluster0.0jhpm2g.mongodb.net/room_rental_db?appName=Cluster0&retryWrites=true&w=majority
```

## Các thay đổi đã thực hiện

### 1. Cập nhật Dependencies (package.json)
- ❌ Đã gỡ bỏ: `sequelize`, `mysql2`
- ✅ Đã cài đặt: `mongoose@^8.0.3`

### 2. Cập nhật File cấu hình

#### .env
```env
# Thay đổi từ MySQL config
MONGODB_URI=mongodb+srv://tuankietchannal_db_user:A3qci7RkN3I72Q3w@cluster0.0jhpm2g.mongodb.net/room_rental_db?appName=Cluster0&retryWrites=true&w=majority
```

#### src/config/database.js
- Chuyển từ Sequelize sang Mongoose
- Cấu hình kết nối MongoDB Atlas
- Xử lý events: connected, disconnected, error

### 3. Cập nhật Models

#### User Model (src/models/User.js)
**Thay đổi chính:**
- Chuyển từ Sequelize DataTypes sang Mongoose Schema
- Thêm field `googleId` cho OAuth
- Thêm field `favorites` (mảng ObjectId reference đến Property)
- Giữ nguyên methods: `getSignedJwtToken()`, `matchPassword()`
- Password hashing với bcrypt trong pre-save middleware

**Schema mới:**
```javascript
{
  name: String (required, max 100)
  email: String (required, unique, validate email)
  password: String (required, min 6, select: false)
  phone: String (validate regex)
  avatar: String (default: '/images/default-avatar.png')
  role: Enum ['user', 'landlord', 'admin']
  status: Enum ['active', 'inactive', 'blocked']
  googleId: String (sparse index)
  emailVerified: Boolean
  resetPasswordToken: String
  resetPasswordExpire: Date
  favorites: [ObjectId ref Property]
  timestamps: true
}
```

#### Property Model (src/models/Property.js)
**Thay đổi chính:**
- Nhóm các field address thành nested object
- Thêm GeoJSON location với 2dsphere index
- Nhóm utilities thành nested object
- Đổi tên fields theo camelCase (propertyType, averageRating, totalReviews, aiScore)
- Reference đến User qua field `landlord`

**Schema mới:**
```javascript
{
  title: String (required, max 200)
  description: String (required)
  propertyType: Enum ['phong-tro', 'nha-nguyen-can', 'can-ho', 'chung-cu-mini', 'homestay']
  price: Number (required, min 0)
  deposit: Number (default 0)
  area: Number (required, min 1)
  address: {
    street: String (required)
    ward: String (required)
    district: String (required)
    city: String (required)
    full: String (auto-generated)
  }
  location: {
    type: 'Point'
    coordinates: [Number] // [longitude, latitude]
    index: '2dsphere'
  }
  bedrooms: Number (default 1)
  bathrooms: Number (default 1)
  kitchen: Number (default 0)
  amenities: [String]
  utilities: {
    electric: String
    water: String
    internet: String
    parking: String
  }
  rules: String
  images: [String]
  landlord: ObjectId ref User (required)
  status: Enum ['available', 'rented', 'pending', 'inactive']
  views: Number (default 0)
  featured: Boolean (default false)
  averageRating: Number (1-5)
  totalReviews: Number (default 0)
  aiScore: Number (0-100)
  timestamps: true
}
```

#### Booking Model (src/models/Booking.js)
**Thay đổi chính:**
- Đổi tên fields theo camelCase
- Reference đến User và Property qua ObjectId
- Tự động tính totalAmount trong pre-save hook

**Schema mới:**
```javascript
{
  property: ObjectId ref Property (required)
  tenant: ObjectId ref User (required)
  landlord: ObjectId ref User (required)
  startDate: Date (required)
  endDate: Date (required)
  monthlyRent: Number (required)
  deposit: Number (required)
  totalAmount: Number (auto-calculated)
  status: Enum ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected']
  paymentStatus: Enum ['pending', 'partial', 'paid']
  paymentMethod: Enum ['cash', 'transfer', 'momo', 'zalopay']
  notes: String (max 500)
  cancelReason: String (max 500)
  contractFile: String
  timestamps: true
}
```

#### Review Model (src/models/Review.js)
**Thay đổi chính:**
- Đổi tên fields theo camelCase
- Unique compound index trên (property, user)
- Static method `getAverageRating()` để tự động cập nhật rating của Property
- Post-save và pre-remove hooks để update property rating

**Schema mới:**
```javascript
{
  property: ObjectId ref Property (required)
  user: ObjectId ref User (required)
  rating: Number (required, 1-5)
  title: String (required, max 100)
  comment: String (required)
  images: [String]
  helpful: Number (default 0)
  verified: Boolean (default false)
  timestamps: true
  
  // Unique index on: property + user
}
```

### 4. Cập nhật src/models/index.js
- Loại bỏ Sequelize associations
- Simple export các models

### 5. Kết nối Database
File `server.js` đã được cập nhật để gọi `connectDB()`

## Kiểm tra kết nối

```bash
npm start
```

**Kết quả mong đợi:**
```
========================================
🏠 Room Rental System
========================================
Server running in development mode
Port: 3000
URL: http://localhost:3000
========================================
✓ MongoDB Connected: cluster0.0jhpm2g.mongodb.net
✓ Database: room_rental_db
```

## Indexes đã tạo

### User
- email (unique)
- googleId (sparse)

### Property
- landlord
- status
- propertyType
- price
- address.city + address.district
- location (2dsphere for geospatial queries)

### Booking
- property
- tenant
- landlord
- status
- startDate + endDate

### Review
- property + user (unique compound)
- property
- user

## Các tính năng MongoDB được sử dụng

1. **Nested Objects**: address, utilities trong Property
2. **Arrays**: amenities, images, favorites
3. **References (Population)**: ObjectId với ref
4. **Geospatial Queries**: location với 2dsphere index
5. **Unique Indexes**: email, compound index (property + user)
6. **Sparse Indexes**: googleId
7. **Middleware Hooks**: pre-save, post-save
8. **Virtual Properties**: reviews trong Property
9. **Static Methods**: getAverageRating trong Review

## Lưu ý quan trọng

### 1. Field Name Changes (Snake_case → CamelCase)
Các controllers cần cập nhật để dùng tên mới:
- `landlord_id` → `landlord`
- `property_type` → `propertyType`
- `address_street` → `address.street`
- `average_rating` → `averageRating`
- `total_reviews` → `totalReviews`
- v.v.

### 2. ID Field
- MongoDB dùng `_id` thay vì `id`
- Khi query: `User.findById(id)` thay vì `User.findByPk(id)`

### 3. Population (Thay cho JOIN)
```javascript
// Sequelize
Property.findAll({ include: ['landlord', 'reviews'] })

// Mongoose
Property.find().populate('landlord').populate('reviews')
```

### 4. Validation
- Validation được định nghĩa trong schema
- Tự động validate khi save/update
- Custom error messages

### 5. Query Methods
```javascript
// Sequelize → Mongoose
findByPk()     → findById()
findAll()      → find()
findOne()      → findOne()
create()       → create() hoặc new Model().save()
update()       → updateOne()/updateMany()/findByIdAndUpdate()
destroy()      → deleteOne()/deleteMany()/findByIdAndDelete()
```

## Bước tiếp theo

### 1. Cập nhật Controllers
Cần cập nhật tất cả controllers để:
- Sử dụng Mongoose query methods
- Sử dụng field names mới (camelCase)
- Sử dụng populate() thay vì include
- Xử lý nested objects (address, utilities)

### 2. Cập nhật Routes
- Kiểm tra lại các validation middleware
- Cập nhật response format nếu cần

### 3. Testing
- Test tất cả API endpoints
- Test authentication flow
- Test file upload
- Test relationships (populate)

### 4. Migration Data (nếu có data cũ)
Nếu cần migrate data từ MySQL sang MongoDB:
1. Export data từ MySQL
2. Transform data format (snake_case → camelCase, nested objects)
3. Import vào MongoDB

## Tài liệu tham khảo
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Schema Types](https://mongoosejs.com/docs/schematypes.html)
- [Mongoose Middleware](https://mongoosejs.com/docs/middleware.html)
- [Mongoose Population](https://mongoosejs.com/docs/populate.html)
