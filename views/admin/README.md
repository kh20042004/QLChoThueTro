# 🔐 Admin Panel - HomeRent System

## Tổng quan

Admin Panel là hệ thống quản trị toàn diện cho HomeRent, cho phép quản lý người dùng, bất động sản, đặt phòng và các hoạt động khác.

## 🎨 Thiết kế

### Background Pattern
- **Diagonal Grid Pattern** với màu Electric Pink (#ff0064)
- Opacity: 0.1 cho hiệu ứng tinh tế
- Background màu: #fafafa (Off-white)
- Backdrop blur cho glass effect

### Color Palette
- **Primary**: Pink (#ff0064) to Orange (#ff6b35) gradient
- **Background**: #fafafa
- **Text**: Gray-900 (#111827)
- **Border**: Gray-200 (#e5e7eb)

## 📄 Các trang Admin

### 1. Dashboard (`/admin/dashboard`)
- **Mô tả**: Trang chủ admin với thống kê tổng quan
- **Tính năng**:
  - 4 stat cards: Users, Properties, Bookings, Revenue
  - Danh sách bất động sản mới nhất
  - Danh sách người dùng mới
  - Activity log

### 2. Users Management (`/admin/users`)
- **Mô tả**: Quản lý người dùng
- **Tính năng**:
  - Danh sách tất cả users với phân trang
  - Tìm kiếm theo tên, email
  - Filter theo role (user, landlord, admin)
  - Filter theo status (active, inactive, blocked)
  - Xem chi tiết, chỉnh sửa, xóa user

### 3. Properties Management (`/admin/properties`)
- **Mô tả**: Quản lý bất động sản
- **Tính năng**:
  - Grid view các bất động sản
  - Stats: Tổng BĐS, Chờ duyệt, Đã duyệt, Đã khóa
  - Filter theo loại hình, trạng thái
  - Sắp xếp: Mới nhất, Cũ nhất, Giá
  - Duyệt, xem, xóa bất động sản

### 4. Bookings (Coming Soon)
- Quản lý đơn đặt phòng
- Theo dõi thanh toán
- Thống kê booking

### 5. Reviews (Coming Soon)
- Quản lý đánh giá
- Kiểm duyệt review
- Xóa review vi phạm

### 6. Reports (Coming Soon)
- Báo cáo doanh thu
- Thống kê theo thời gian
- Export dữ liệu

### 7. Settings (Coming Soon)
- Cài đặt hệ thống
- Email templates
- Notification settings

## 🔒 Bảo mật

### Authentication
```javascript
// Kiểm tra quyền admin trong mỗi trang
function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = '/auth/login';
        return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '/';
        return;
    }
}
```

### Routes Protection
- Tất cả routes `/admin/*` cần role = 'admin'
- Redirect về `/auth/login` nếu chưa đăng nhập
- Redirect về `/` nếu không phải admin

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
  - Sidebar ẩn, toggle bằng button
  - Grid 1 column
  - Cards stack vertically

- **Tablet**: 768px - 1024px
  - Sidebar fixed position
  - Grid 2 columns
  - Compact spacing

- **Desktop**: > 1024px
  - Sidebar sticky
  - Grid 3-4 columns
  - Full features

## 🎭 Components

### Sidebar Navigation
```html
<aside id="sidebar" class="w-64 bg-white/80 backdrop-blur-md">
    <nav class="p-4 space-y-2">
        <a href="/admin/dashboard" class="active">
            <i class="fas fa-chart-line"></i>
            <span>Dashboard</span>
        </a>
        <!-- More links -->
    </nav>
</aside>
```

### Stat Card
```html
<div class="stat-card bg-white/90 backdrop-blur-sm rounded-xl p-6">
    <div class="icon-wrapper">
        <i class="fas fa-users"></i>
    </div>
    <h3>Tổng người dùng</h3>
    <p class="text-3xl font-bold" data-count="1234">0</p>
</div>
```

### Table
```html
<table class="w-full">
    <thead class="bg-gray-50">
        <tr>
            <th>Người dùng</th>
            <th>Email</th>
            <th>Thao tác</th>
        </tr>
    </thead>
    <tbody id="tableBody">
        <!-- Rows rendered by JS -->
    </tbody>
</table>
```

## 🚀 JavaScript APIs

### Load Users
```javascript
async function loadUsers() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    renderUsersTable(data.users);
}
```

### Load Properties
```javascript
async function loadProperties() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/admin/properties', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    renderPropertiesGrid(data.properties);
}
```

## 🎨 Tailwind Custom Classes

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'admin-pink': '#ff0064',
                'admin-orange': '#ff6b35'
            }
        }
    }
}
```

## 📊 Data Structure

### User Object
```javascript
{
    _id: '123',
    name: 'Nguyễn Văn A',
    email: 'user@example.com',
    phone: '0901234567',
    role: 'user|landlord|admin',
    status: 'active|inactive|blocked',
    createdAt: '2024-01-01T00:00:00Z'
}
```

### Property Object
```javascript
{
    _id: '123',
    title: 'Phòng trọ...',
    propertyType: 'phong-tro|can-ho|nha-nguyen-can',
    price: 3500000,
    address: {
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1'
    },
    status: 'pending|available|rented|inactive',
    images: ['url1', 'url2']
}
```

## 🔧 Customization

### Thay đổi màu sắc
```css
/* public/css/admin.css */
::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #YOUR_COLOR, #YOUR_COLOR2);
}
```

### Thay đổi layout
```html
<!-- views/admin/*.html -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-YOUR_COLS">
```

## 📝 TODO

- [ ] Thêm API endpoints cho admin
- [ ] Implement real-time notifications
- [ ] Add export to CSV/Excel
- [ ] Add charts với Chart.js
- [ ] Implement booking management page
- [ ] Implement reviews management page
- [ ] Add email notification system
- [ ] Add role-based permissions
- [ ] Add activity logging
- [ ] Add data analytics

## 🐛 Known Issues

1. **Sidebar mobile**: Cần click outside để đóng
2. **Table pagination**: Chưa connect với backend
3. **Search/Filter**: Chưa implement debouncing

## 📞 Support

Nếu có vấn đề hoặc câu hỏi về Admin Panel, vui lòng liên hệ team dev.
