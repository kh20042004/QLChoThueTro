# 📝 MIGRATION TO MYSQL - CHANGELOG

## Tổng Quan Thay Đổi
Dự án đã được chuyển đổi từ MongoDB + Mongoose sang MySQL + Sequelize

## ✅ Các File Đã Cập Nhật

### 1. **package.json**
- ❌ Xóa: `mongoose`
- ✅ Thêm: `sequelize`, `mysql2`

### 2. **src/config/database.js**
- Thay đổi hoàn toàn để sử dụng Sequelize
- Export `{ sequelize, connectDB }`
- Hỗ trợ auto-sync models trong development mode

### 3. **Models (src/models/)**

#### **User.js**
- Chuyển từ Mongoose Schema sang Sequelize Model
- Sử dụng `DataTypes` thay vì Schema types
- Hooks: `beforeCreate`, `beforeUpdate` để hash password
- Methods: `getSignedJwtToken()`, `matchPassword()`

**Thay đổi chính:**
```javascript
// MongoDB/Mongoose
address: {
  street: String,
  city: String
}

// MySQL/Sequelize  
address_street: DataTypes.STRING,
address_city: DataTypes.STRING
```

#### **Property.js**
- Chuyển sang Sequelize Model
- JSON fields cho `amenities` và `images`
- Snake_case cho tên cột (address_street, property_type, etc.)
- Foreign key: `landlord_id` references `users.id`

#### **Booking.js**
- Chuyển sang Sequelize Model
- Foreign keys: `property_id`, `tenant_id`, `landlord_id`
- Hook `beforeCreate` để tính `total_amount`

#### **Review.js**
- Chuyển sang Sequelize Model
- Unique index cho `[property_id, user_id]`
- Foreign keys: `property_id`, `user_id`

### 4. **src/models/index.js** (MỚI)
- Định nghĩa tất cả relationships giữa models
- User hasMany Properties
- Property hasMany Bookings, Reviews
- User hasMany Reviews
- Booking belongsTo User, Property

### 5. **Controllers**

#### **src/controllers/authController.js**
```javascript
// Mongoose
User.findOne({ email })
User.findById(id)
User.findByIdAndUpdate(id, data)

// Sequelize
User.findOne({ where: { email } })
User.findByPk(id)
user.update(data)
```

### 6. **Environment Variables (.env.example)**
```env
# Cũ (MongoDB)
MONGODB_URI=mongodb://localhost:27017/room-rental-db

# Mới (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=room_rental_db
DB_USER=root
DB_PASSWORD=
```

### 7. **server.js**
- Import `{ connectDB }` thay vì default export
- Giữ nguyên logic khác

## 🔧 Các Thay Đổi Cú Pháp Chính

### Query Operations

| MongoDB/Mongoose | MySQL/Sequelize |
|-----------------|-----------------|
| `Model.find()` | `Model.findAll()` |
| `Model.findOne({ field })` | `Model.findOne({ where: { field } })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.create(data)` | `Model.create(data)` ✅ Same |
| `Model.findByIdAndUpdate(id, data)` | `instance.update(data)` |
| `Model.findByIdAndDelete(id)` | `instance.destroy()` |

### Relationships

| MongoDB/Mongoose | MySQL/Sequelize |
|-----------------|-----------------|
| `ref: 'User'` | `references: { model: 'users', key: 'id' }` |
| `.populate('user')` | `include: [{ model: User, as: 'user' }]` |
| Virtual populate | `hasMany`, `belongsTo` associations |

### Field Names

| MongoDB/Mongoose | MySQL/Sequelize |
|-----------------|-----------------|
| `propertyType` (camelCase) | `property_type` (snake_case) |
| `createdAt` (auto) | `created_at` (auto with underscored: true) |
| `_id` | `id` |

## 📋 TODO - Các Bước Tiếp Theo

### 1. **Cài Đặt Dependencies**
```bash
npm install
```

### 2. **Tạo Database MySQL**
```sql
CREATE DATABASE room_rental_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. **Cấu Hình .env**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=room_rental_db
DB_USER=root
DB_PASSWORD=your_password
```

### 4. **Chạy Server**
```bash
npm run dev
```

Sequelize sẽ tự động tạo các tables khi chạy lần đầu (trong development mode)

### 5. **Cập Nhật PropertyController** (TODO)
Cần cập nhật các query trong `propertyController.js` để sử dụng Sequelize syntax

### 6. **Cập Nhật Routes** (TODO)
- bookingRoutes.js
- reviewRoutes.js  
- aiRoutes.js

Các routes này vẫn đang sử dụng require models trực tiếp, cần cập nhật

## ⚠️ Breaking Changes

1. **API Response IDs**: 
   - Trước: `_id` (MongoDB ObjectId string)
   - Sau: `id` (Integer)

2. **Nested Objects**:
   - Trước: `address: { street, city }`
   - Sau: `address_street`, `address_city` (flat structure)

3. **Populate**:
   ```javascript
   // Trước
   .populate('landlord', 'name email')
   
   // Sau
   include: [{ 
     model: User, 
     as: 'landlord', 
     attributes: ['name', 'email'] 
   }]
   ```

## 🎯 Lợi Ích Của MySQL

1. ✅ **ACID Compliance** - Transactions đảm bảo
2. ✅ **Referential Integrity** - Foreign keys enforce
3. ✅ **Better Join Performance** - Query phức tạp nhanh hơn
4. ✅ **Structured Data** - Schema rõ ràng, type-safe
5. ✅ **Enterprise Support** - Phổ biến trong doanh nghiệp

## 📚 Tài Liệu Tham Khảo

- Sequelize Docs: https://sequelize.org/docs/v6/
- MySQL Docs: https://dev.mysql.com/doc/
- Migration Guide: https://sequelize.org/docs/v6/other-topics/migrations/

---

**Last Updated**: October 20, 2025
**Status**: ✅ Core migration completed, controllers need updates
