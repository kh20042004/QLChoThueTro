# 🔐 HƯỚNG DẪN ĐĂNG NHẬP ADMIN

## ✅ Đã Hoàn Thành

### 1. Tạo Tài Khoản Admin
✅ Tài khoản admin đã được tạo thành công với thông tin:
- **Email:** tk04052k4@gmail.com
- **Mật khẩu:** 11331133
- **Vai trò:** admin
- **ID:** 68fdba6b47c34f82b2e7e4f4

### 2. Cải Tiến Hệ Thống
✅ **Tự động chuyển hướng admin:** Sau khi đăng nhập, admin sẽ tự động được chuyển đến `/admin/dashboard`

✅ **Nút Admin Panel:** Thêm nút "Admin Panel" vào header (chỉ hiển thị cho admin)

✅ **Kiểm tra quyền:** Trang admin sẽ kiểm tra role và chặn user thường

---

## 🚀 Cách Đăng Nhập

### Bước 1: Truy cập trang đăng nhập
```
http://localhost:3000/auth/login
```

### Bước 2: Nhập thông tin
- **Email:** tk04052k4@gmail.com
- **Mật khẩu:** 11331133

### Bước 3: Sau khi đăng nhập
Hệ thống sẽ **TỰ ĐỘNG** chuyển bạn đến:
```
http://localhost:3000/admin/dashboard
```

---

## 🎯 Các Cách Vào Admin Panel

### Cách 1: Tự động (Sau khi đăng nhập)
- Đăng nhập với tài khoản admin
- Hệ thống tự động chuyển đến Admin Dashboard

### Cách 2: Nút Admin Panel trên Header
- Đăng nhập với tài khoản admin
- Click nút **"Admin Panel"** (màu hồng/cam) trên header
- Được chuyển đến Admin Dashboard

### Cách 3: Truy cập trực tiếp URL
Sau khi đã đăng nhập, bạn có thể truy cập trực tiếp:
```
http://localhost:3000/admin/dashboard
http://localhost:3000/admin/users
http://localhost:3000/admin/properties
```

---

## 🔍 Kiểm Tra Tài Khoản Admin

### Trong MongoDB
```javascript
// Kết nối MongoDB và kiểm tra
use homerent
db.users.findOne({ email: 'tk04052k4@gmail.com' })
```

### Trong Browser Console
Sau khi đăng nhập, mở Console (F12) và gõ:
```javascript
// Kiểm tra thông tin user
const userData = JSON.parse(localStorage.getItem('userData'));
console.log('User Role:', userData.role);
console.log('User Data:', userData);
```

Kết quả sẽ là:
```
User Role: admin
User Data: {
  id: "68fdba6b47c34f82b2e7e4f4",
  name: "Admin",
  email: "tk04052k4@gmail.com",
  role: "admin"
}
```

---

## 🛡️ Bảo Mật

### Kiểm tra quyền truy cập
Trang admin có 2 lớp bảo mật:

1. **Frontend Check (dashboard.js):**
   - Kiểm tra `localStorage.userData.role === 'admin'`
   - Chuyển hướng về trang chủ nếu không phải admin

2. **Backend Check (Cần thêm):**
   - Sử dụng middleware `protect` và `authorize('admin')`
   - Chặn API requests từ non-admin users

### Ví dụ Backend Protection (Cần implement):
```javascript
// src/routes/adminRoutes.js
const { protect, authorize } = require('../middleware/auth');

router.get('/api/admin/users', 
  protect,           // Yêu cầu đăng nhập
  authorize('admin'), // Chỉ admin mới truy cập
  adminController.getUsers
);
```

---

## 🎨 Tính Năng Admin Panel

### Đã Tạo:
- ✅ Dashboard (Tổng quan hệ thống)
- ✅ Quản lý người dùng (Users)
- ✅ Quản lý bất động sản (Properties)
- ✅ Background diagonal grid màu hồng/cam
- ✅ Glass effect với backdrop-blur
- ✅ Animations và hover effects

### Cần Tạo Thêm:
- ⏳ Quản lý đặt phòng (Bookings)
- ⏳ Quản lý đánh giá (Reviews)
- ⏳ Báo cáo & thống kê (Reports)
- ⏳ Cài đặt hệ thống (Settings)
- ⏳ Backend API cho admin

---

## ❗ Xử Lý Lỗi

### Lỗi: "Bạn không có quyền truy cập trang này!"
**Nguyên nhân:** User role không phải 'admin'

**Giải pháp:**
1. Kiểm tra role trong database:
   ```bash
   node create-admin.js
   ```

2. Xóa localStorage và đăng nhập lại:
   ```javascript
   localStorage.clear();
   // Sau đó đăng nhập lại
   ```

### Lỗi: Redirect về trang chủ ngay sau khi đăng nhập
**Nguyên nhân:** localStorage.userData không có hoặc sai format

**Giải pháp:**
1. Mở Console (F12) và kiểm tra:
   ```javascript
   console.log(localStorage.getItem('userData'));
   ```

2. Nếu null hoặc undefined, đăng xuất và đăng nhập lại

### Lỗi: Không thấy nút "Admin Panel"
**Nguyên nhân:** User role không được lưu đúng

**Giải pháp:**
1. Kiểm tra response từ API login
2. Clear cache và reload trang
3. Đăng xuất và đăng nhập lại

---

## 📝 Script Quản Lý Admin

### Tạo admin mới:
```bash
node create-admin.js
```

### Xem tất cả admin:
```javascript
// Trong MongoDB shell hoặc script
db.users.find({ role: 'admin' })
```

### Xóa admin:
```javascript
db.users.deleteOne({ email: 'tk04052k4@gmail.com' })
```

### Đổi mật khẩu admin:
```javascript
// Sử dụng API update password hoặc tạo script riêng
```

---

## 🎓 Tóm Tắt

1. ✅ Tài khoản admin đã được tạo: **tk04052k4@gmail.com / 11331133**
2. ✅ Sau khi đăng nhập, tự động chuyển đến Admin Dashboard
3. ✅ Có nút "Admin Panel" trên header (chỉ admin thấy)
4. ✅ Server đang chạy tại: **http://localhost:3000**

**Bây giờ bạn có thể đăng nhập và test Admin Panel! 🎉**
