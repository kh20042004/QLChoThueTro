# 📧 Hướng dẫn cấu hình Email để gửi thông báo

## 1. Tạo App Password cho Gmail

Để gửi email qua Gmail, bạn cần tạo **App Password** (không dùng mật khẩu Gmail thường):

### Bước 1: Bật xác thực 2 bước (2FA)
1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"** (Xác minh 2 bước)
3. Bật tính năng này nếu chưa bật

### Bước 2: Tạo App Password
1. Truy cập: https://myaccount.google.com/apppasswords
2. Chọn **"Select app"** → Chọn **"Mail"**
3. Chọn **"Select device"** → Chọn **"Other"** → Đặt tên: "Room Rental System"
4. Click **"Generate"**
5. Copy mật khẩu 16 ký tự (dạng: `xxxx xxxx xxxx xxxx`)

## 2. Cập nhật file .env

Mở file `.env` và cập nhật các dòng sau:

```env
# Email Configuration
EMAIL_USERNAME=your-gmail@gmail.com          # Thay bằng Gmail của bạn
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx           # Thay bằng App Password vừa tạo
```

**Ví dụ:**
```env
EMAIL_USERNAME=roomrental@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

## 3. Test gửi email

Sau khi cấu hình:

1. **Restart server**: `npm start`
2. **Đăng bài mới** từ trang web
3. **Kiểm tra email** - Bạn sẽ nhận được email thông báo kết quả xét duyệt

### Email sẽ chứa:
- ✅ **Nếu DUYỆT (>85%)**: Email thông báo bài đăng đã được duyệt
- ⏳ **Nếu CHỜ DUYỆT (50-85%)**: Email thông báo đang chờ admin xem xét
- ❌ **Nếu TỪ CHỐI (<50%)**: Email thông báo bài đăng bị từ chối + lý do chi tiết

## 4. Troubleshooting

### Lỗi: "Invalid login"
- Kiểm tra lại EMAIL_USERNAME và EMAIL_PASSWORD trong .env
- Đảm bảo đã bật 2FA
- Đảm bảo dùng App Password chứ không phải mật khẩu Gmail thường

### Lỗi: "Connection timeout"
- Kiểm tra kết nối Internet
- Có thể Gmail bị chặn ở mạng công ty/trường học → Dùng mạng khác

### Lỗi: "User không có email"
- User cần có email trong database
- Kiểm tra bằng cách vào MongoDB và xem collection `users`

## 5. Tùy chỉnh template email (Optional)

File template: `src/services/emailService.js`

Bạn có thể chỉnh sửa:
- Màu sắc: Thay đổi giá trị hex color (vd: `#667eea`)
- Nội dung: Sửa đổi text trong các biến `subject`, `statusText`, `actionText`
- Logo: Thêm `<img>` tag trong phần header

## 6. Sử dụng SMTP khác (Optional)

Nếu không dùng Gmail, có thể dùng:

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USERNAME=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

---

**Lưu ý**: Sau khi cấu hình xong, nhớ **RESTART SERVER** để áp dụng thay đổi!
