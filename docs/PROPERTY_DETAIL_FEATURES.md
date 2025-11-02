# Property Detail Page - Hoàn thiện chức năng

## Tổng quan
Trang chi tiết bất động sản với đầy đủ các chức năng tương tác cho người dùng.

## URL
`http://localhost:3000/properties/{propertyId}`

Ví dụ: `http://localhost:3000/properties/6905cae52f5529c37deede5f`

## Các chức năng đã hoàn thiện

### 1. ✅ Hiển thị thông tin property
- **Title, giá, địa chỉ, mô tả**
- **Gallery ảnh** với thumbnail navigation
- **Thông tin cơ bản**: diện tích, số phòng ngủ, WC
- **Tiện nghi**: WiFi, điều hòa, bãi đậu xe, v.v.
- **Bản đồ** với Leaflet Maps

### 2. ✅ Thông tin chủ nhà (Landlord)
- Avatar, tên, email, số điện thoại
- Tự động load từ API property detail
- Hiển thị trong sidebar contact card

### 3. ✅ Gọi điện (Call Landlord)
**Function**: `handleCall()`
- Click button "Gọi điện"
- Modal xác nhận hiển thị số điện thoại
- **Mobile**: Tự động mở ứng dụng điện thoại với `tel:` protocol
- **Desktop**: Hiển thị số điện thoại để copy

**Code**:
```javascript
function handleCall() {
    if (!landlordPhone) {
        showNotification('Chưa có thông tin số điện thoại', 'error');
        return;
    }
    // Show confirmation modal
    showCallModal(landlordPhone);
}
```

### 4. ✅ Gửi tin nhắn (Chat with Landlord)
**Function**: `handleMessage()`
- Click button "Gửi tin nhắn"
- Kiểm tra đăng nhập
- Tạo/lấy conversation với landlord
- Chuyển đến trang `/chat` với conversation được mở sẵn

**Flow**:
1. Kiểm tra token và landlordId
2. POST `/api/chat/conversations` với landlordId và propertyId
3. Lưu `openConversationId` vào localStorage
4. Redirect đến `/chat`

**Code**:
```javascript
async function handleMessage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập', 'error');
        return;
    }
    
    const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
            userId: landlordId,
            propertyId: currentPropertyId
        })
    });
    
    // Store and redirect
    localStorage.setItem('openConversationId', data.data._id);
    window.location.href = '/chat';
}
```

### 5. ✅ Đặt lịch xem phòng (Booking/Viewing Appointment)
**Function**: `openBookingModal()`
- Click button "Đặt lịch xem phòng"
- Kiểm tra đăng nhập
- Modal form với các trường:
  - Họ tên (pre-filled từ user data)
  - Số điện thoại (pre-filled)
  - Ngày xem phòng (date picker, min = today)
  - Thời gian xem phòng (dropdown với slots)
  - Ghi chú (optional)

**API**: POST `/api/bookings`
```json
{
  "property": "propertyId",
  "name": "Nguyễn Văn A",
  "phone": "0123456789",
  "viewingDate": "2024-11-05",
  "viewingTime": "14:00",
  "note": "Tôi muốn xem phòng vào chiều thứ 7"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đặt lịch xem phòng thành công",
  "data": {
    "_id": "bookingId",
    "property": {...},
    "tenant": {...},
    "landlord": {...},
    "viewingDate": "2024-11-05",
    "viewingTime": "14:00",
    "status": "pending"
  }
}
```

**Features**:
- Auto-fill user name và phone
- Date validation (không cho chọn ngày quá khứ)
- Time slots: 8:00-18:00
- Success notification với option chuyển đến `/bookings`

### 6. ✅ Lưu/Bỏ lưu tin (Favorites)
**Function**: `handleSaveProperty()`
- Click button "Lưu tin"
- Toggle favorite status
- **POST** `/api/favorites/{propertyId}` - Thêm vào yêu thích
- **DELETE** `/api/favorites/{propertyId}` - Xóa khỏi yêu thích

**UI Changes**:
- **Chưa lưu**: 
  - Icon: `far fa-heart` (outline)
  - Color: Red/Pink gradient
  - Text: "Lưu tin"
- **Đã lưu**:
  - Icon: `fas fa-heart` (solid)
  - Color: Red/Pink solid
  - Text: "Đã lưu"

**Code**:
```javascript
async function handleSaveProperty(event) {
    const btn = event.currentTarget;
    const isSaved = btn.classList.contains('favorite-active');
    
    const method = isSaved ? 'DELETE' : 'POST';
    const response = await fetch(`/api/favorites/${propertyId}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Toggle UI
    btn.classList.toggle('favorite-active');
    // Update icon and text
}
```

### 7. ✅ Báo cáo tin đăng (Report Property)
**Function**: `openReportModal()`
- Click button "Báo cáo ngay"
- Kiểm tra đăng nhập
- Modal form với:
  - Lý do báo cáo (dropdown)
  - Mô tả chi tiết (textarea, required)
  - Email liên hệ (optional, pre-filled)

**Lý do báo cáo**:
- Tin đăng giả mạo
- Lừa đảo
- Trùng lặp
- Nội dung không phù hợp
- Thông tin sai lệch
- Spam
- Lý do khác

**API**: POST `/api/reports` (cần tạo)
```json
{
  "property": "propertyId",
  "reason": "scam",
  "description": "Tin đăng này yêu cầu chuyển tiền trước...",
  "email": "user@example.com"
}
```

**Note**: Hiện tại API chưa được implement, form sẽ hiển thị success message tạm thời.

## Booking Model Updates

### Trước khi cập nhật:
```javascript
{
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  monthlyRent: { type: Number, required: true },
  deposit: { type: Number, required: true },
  totalAmount: { type: Number, required: true }
}
```

### Sau khi cập nhật:
```javascript
{
  // Long-term rental
  startDate: { type: Date },
  endDate: { type: Date },
  monthlyRent: { type: Number },
  deposit: { type: Number },
  totalAmount: { type: Number },
  
  // Viewing appointment
  viewingDate: { type: Date },
  viewingTime: { type: String },
  name: { type: String },
  phone: { type: String },
  note: { type: String }
}
```

**Flexibility**: Model hiện hỗ trợ cả:
1. **Viewing appointment** (chỉ cần viewingDate + viewingTime)
2. **Long-term booking** (cần startDate + endDate + rent info)

## UI/UX Improvements

### Buttons Layout
```
┌─────────────────────────┐
│    📞 Gọi điện          │ (Gray/Black gradient)
├─────────────────────────┤
│    📅 Đặt lịch xem phòng│ (Green gradient) ⭐ NEW
├─────────────────────────┤
│    ✉️ Gửi tin nhắn      │ (Blue gradient)
├─────────────────────────┤
│    ❤️ Lưu tin / Đã lưu  │ (Pink/Red gradient)
└─────────────────────────┘
```

### Modals
1. **Booking Modal**
   - Size: max-w-md
   - Animation: fadeInUp
   - Form validation
   - Auto-fill user data
   - Date/Time selectors

2. **Report Modal**
   - Size: max-w-md
   - Reason dropdown
   - Description textarea
   - Warning banner
   - Auto-fill email

### Notifications
- **Success**: Green background, check icon
- **Error**: Red background, exclamation icon
- **Position**: Fixed top-right
- **Duration**: 3 seconds
- **Animation**: slideDown

## API Endpoints Summary

### Property Detail
- `GET /api/properties/{id}` - Lấy thông tin property (có populate landlord)

### Favorites
- `POST /api/favorites/{propertyId}` - Thêm vào yêu thích
- `DELETE /api/favorites/{propertyId}` - Xóa khỏi yêu thích
- `GET /api/favorites/check/{propertyId}` - Kiểm tra đã yêu thích chưa

### Chat
- `POST /api/chat/conversations` - Tạo/lấy conversation

### Booking
- `POST /api/bookings` - Tạo viewing appointment hoặc booking
- `GET /api/bookings` - Lấy danh sách bookings

### Reports (TODO)
- `POST /api/reports` - Gửi báo cáo tin đăng (chưa implement)

## Dependencies

### Frontend Libraries
- **Leaflet.js 1.9.4**: Hiển thị bản đồ
- **Font Awesome 6.4.0**: Icons
- **Tailwind CSS**: Styling

### Backend
- **Mongoose**: MongoDB ODM
- **Express**: API routes
- **JWT**: Authentication

## Testing Checklist

- [x] Load property detail thành công
- [x] Hiển thị landlord info đầy đủ
- [x] Gọi điện trên mobile device
- [x] Gọi điện trên desktop (copy number)
- [x] Gửi tin nhắn (redirect to chat)
- [x] Đặt lịch xem phòng
- [x] Lưu tin vào favorites
- [x] Bỏ lưu tin khỏi favorites
- [x] Check favorite status khi load
- [ ] Báo cáo tin đăng (cần API)
- [x] Gallery ảnh navigation
- [x] Bản đồ hiển thị vị trí
- [x] Responsive trên mobile

## TODO - Cần làm thêm

### 1. Report API
Tạo file `src/controllers/reportController.js`:
```javascript
exports.createReport = async (req, res) => {
  const report = await Report.create({
    property: req.body.property,
    reporter: req.user.id,
    reason: req.body.reason,
    description: req.body.description,
    email: req.body.email,
    status: 'pending'
  });
  
  // Send notification to admin
  
  res.json({ success: true, data: report });
};
```

### 2. Report Model
```javascript
const ReportSchema = new mongoose.Schema({
  property: { type: ObjectId, ref: 'Property', required: true },
  reporter: { type: ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  email: String,
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminNote: String,
  createdAt: { type: Date, default: Date.now }
});
```

### 3. Email Notifications
- Gửi email cho chủ nhà khi có booking request
- Gửi email xác nhận cho tenant
- Gửi email cho admin khi có report

### 4. Booking Management Page
- Trang `/bookings` để user xem lịch hẹn
- Filter theo status: pending/confirmed/cancelled
- Cancel booking feature

## Version History
- **v1.0.0**: Initial property detail page
- **v2.0.0**: Added chat integration
- **v3.0.0** (Current): Full features - booking, favorites, report

## Developed By
HomeRent Team - 2024
