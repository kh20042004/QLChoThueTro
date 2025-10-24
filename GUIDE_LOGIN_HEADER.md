# Hướng Dẫn: Header Người Dùng Đã Đăng Nhập

## 📋 Mô Tả

Hệ thống đã được cập nhật để hiển thị một header khác nhau tuỳ thuộc vào trạng thái đăng nhập của người dùng:

- **Khách (chưa đăng nhập)**: Hiển thị các nút "Đăng nhập" và "Đăng ký"
- **Người dùng (đã đăng nhập)**: Hiển thị:
  - 🔔 Biểu tượng thông báo (có badge số lượng)
  - ❤️ Biểu tượng yêu thích (có badge số lượng)
  - 🔴 Nút "Đăng tin" màu đỏ
  - 👤 Avatar và menu dropdown với:
    - Hồ sơ cá nhân
    - Đơn đặt phòng
    - Nhà/phòng của tôi
    - Cài đặt
    - Đăng xuất

## 🔧 Cách Hoạt Động

### 1. **Lưu Trữ Dữ Liệu Đăng Nhập**

Khi người dùng đăng nhập thành công, JavaScript sẽ:
- Lưu **token** vào `localStorage.token`
- Lưu **thông tin user** vào `localStorage.userData` (JSON)

```javascript
localStorage.setItem('token', data.token);
localStorage.setItem('userData', JSON.stringify(data.user));
```

### 2. **Kiểm Tra Trạng Thái**

Khi trang tải, hàm `initUserNavbar()` sẽ:
- Kiểm tra xem có token trong localStorage không
- Nếu có → Hiển thị header người dùng
- Nếu không → Hiển thị header khách

### 3. **Cập Nhật Avatar**

Avatar được tạo tự động từ chữ cái đầu của tên người dùng:
```javascript
const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
const bgColor = colors[Math.floor(Math.random() * colors.length)];
userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff`;
```

### 4. **Đăng Xuất**

Khi click "Đăng xuất":
- Xóa token từ localStorage
- Xóa cookie token
- Hiển thị lại header khách
- Chuyển hướng về trang chủ

## 📁 Các File Được Cập Nhật

### 1. **HTML Files**
- ✅ `views/index.html` - Thêm hai phiên bản menu navbar
- ✅ `views/auth/login.html` - Cập nhật form để sử dụng fetch API
- ✅ `views/auth/register.html` - Cập nhật form để sử dụng fetch API

### 2. **CSS Files**
- ✅ `public/css/main.css` - Thêm CSS cho icon buttons, dropdown menu, badge

### 3. **JavaScript Files**
- ✅ `public/js/main.js` - Thêm hàm xử lý navbar (`initUserNavbar()`, `updateUserInfo()`, `handleLogout()`)
- ✅ `public/js/auth.js` - Tạo mới file xử lý đăng nhập/đăng ký

## 💻 Cách Sử Dụng

### Trên Trang Chủ (index.html)
Header sẽ tự động hiển thị theo trạng thái đăng nhập:
```html
<!-- Menu khách (ẩn nếu đã đăng nhập) -->
<ul class="navbar-nav ms-auto align-items-center" id="navbarGuest">
  <li class="nav-item">
    <a class="btn btn-outline-primary btn-sm" href="/auth/login">
      <i class="fas fa-sign-in-alt me-1"></i>Đăng nhập
    </a>
  </li>
</ul>

<!-- Menu người dùng (ẩn nếu chưa đăng nhập) -->
<ul class="navbar-nav ms-auto align-items-center" id="navbarUser" style="display: none;">
  <li class="nav-item">
    <button class="nav-link btn-icon-navbar" type="button">
      <i class="fas fa-bell text-muted"></i>
      <span class="badge bg-danger badge-notification">3</span>
    </button>
  </li>
  <!-- ... -->
</ul>
```

### Trên Trang Đăng Nhập/Đăng Ký
Form sẽ tự động gửi request và lưu dữ liệu:
```html
<form id="loginForm" novalidate>
  <!-- ... form inputs ... -->
  <button type="submit">Đăng nhập</button>
</form>

<!-- Script sẽ tự động xử lý form submit -->
<script src="/js/auth.js"></script>
```

## 🎨 CSS Classes

### Icon Buttons
```css
.btn-icon-navbar
- Dùng cho nút biểu tượng trong navbar
- Có hiệu ứng hover scale 1.1

.badge-notification
- Badge hiển thị số lượng thông báo
- Vị trí tuyệt đối ở góc phải trên
```

### Dropdown Menu
```css
.dropdown-menu
- Có animation slide từ trên xuống
- Border và shadow nhẹ
- Responsive trên mobile

.dropdown-item:hover
- Highlight màu xanh
- Có icon màu xanh
- Lề trái tăng 0.5rem
```

## 📱 Responsive Design

- **Desktop**: Hiển thị đầy đủ all menu items
- **Tablet**: Menu collapse vào toggler
- **Mobile**: Toggler button, menu stack vertical

## 🔐 Bảo Mật

- ✅ Token lưu trong localStorage (khác httpOnly cookie)
- ✅ Token được gửi kèm các request sau
- ✅ Xóa token khi đăng xuất
- ✅ Validate dữ liệu trước khi gửi

## 🚀 Mở Rộng Thêm

### Thêm Icon Buttons Khác
```html
<!-- Thông báo -->
<li class="nav-item">
  <button class="nav-link btn-icon-navbar" type="button">
    <i class="fas fa-bell text-muted"></i>
    <span class="badge bg-danger badge-notification">3</span>
  </button>
</li>
```

### Cập Nhật Số Badge
```javascript
// Cập nhật số thông báo
document.querySelector('[data-badge="notifications"]').textContent = 5;

// Cập nhật số yêu thích
document.querySelector('[data-badge="favorites"]').textContent = 2;
```

### Fetch User Info từ Server
```javascript
async function fetchUserInfo() {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await response.json();
  updateUserInfo(data.user);
}
```

## ✅ Checklist

- [x] Thêm hai phiên bản menu navbar
- [x] Thêm CSS cho icon buttons, dropdown, badge
- [x] Tạo hàm xử lý navbar
- [x] Tạo file auth.js xử lý form
- [x] Cập nhật login.html
- [x] Cập nhật register.html
- [x] Lưu token vào localStorage
- [x] Lưu user data vào localStorage
- [ ] (Tùy chọn) Cập nhật các trang khác (properties, about, contact)
- [ ] (Tùy chọn) Thêm API endpoint để get user info
- [ ] (Tùy chọn) Thêm real-time notifications

## 📞 Hỗ Trợ

Nếu có lỗi hoặc câu hỏi, hãy kiểm tra:
1. Browser console (F12)
2. Network tab - xem request/response
3. localStorage - xem đã lưu token không
