# 🚀 Hướng Dẫn Setup Nhanh - QLChoThueTro

## Bước 1: Cài Đặt Môi Trường

### Cài đặt Node.js
- Tải về: https://nodejs.org/ (Phiên bản 18.x trở lên)
- Kiểm tra: `node --version` và `npm --version`

### Cài đặt MongoDB
**Cách 1: MongoDB Local (Windows)**
- Tải về: https://www.mongodb.com/try/download/community
- Cài đặt và chạy MongoDB Compass
- Khởi động MongoDB: `mongod`

**Cách 2: MongoDB Atlas (Cloud - Khuyên dùng)**
- Đăng ký miễn phí: https://www.mongodb.com/cloud/atlas/register
- Tạo cluster → Lấy connection string
- Miễn phí 512MB

---

## Bước 2: Clone & Install

```bash
# Clone repository
git clone https://github.com/kh20042004/QLChoThueTro.git
cd QLChoThueTro

# Cài đặt dependencies
npm install
```

---

## Bước 3: Cấu Hình .env

```bash
# Copy file mẫu
cp .env.example .env

# Hoặc trên Windows:
copy .env.example .env
```

### Cấu hình tối thiểu để chạy:

```env
NODE_ENV=development
PORT=3000

# Database (chọn 1 trong 2)
# Local:
MONGODB_URI=mongodb://localhost:27017/qlchothuetro
# Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qlchothuetro

# JWT Secret (tự tạo chuỗi random)
JWT_SECRET=my-super-secret-key-123456
SESSION_SECRET=my-session-secret-789

# Email (dùng Gmail - xem hướng dẫn bên dưới)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# AI - Gemini (Miễn phí - xem hướng dẫn bên dưới)
GEMINI_API_KEY=your-gemini-key

# Cloudinary (Miễn phí - xem hướng dẫn bên dưới)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Goong Maps (Miễn phí - xem hướng dẫn bên dưới)
GOONG_API_KEY=your-goong-key
GOONG_MAPTILES_KEY=your-maptiles-key
```

---

## Bước 4: Lấy API Keys (Tất cả MIỄN PHÍ)

### 1. Gemini API (AI Chatbot) ⚡ CỰC NHANH
```
1. Vào: https://makersuite.google.com/app/apikey
2. Đăng nhập Google
3. Click "Create API Key" → Copy
4. Dán vào GEMINI_API_KEY trong .env
⏱️ Thời gian: 30 giây
```

### 2. Cloudinary (Upload Ảnh) 📸
```
1. Vào: https://cloudinary.com/users/register_free
2. Đăng ký tài khoản miễn phí
3. Vào Dashboard → Account Details
4. Copy: Cloud Name, API Key, API Secret
5. Dán vào .env
⏱️ Thời gian: 2 phút
```

### 3. Goong Maps (Bản Đồ VN) 🗺️
```
1. Vào: https://account.goong.io/register
2. Đăng ký tài khoản
3. Vào My API Keys
4. Lấy: API Key và Maptiles Key
5. Dán vào .env
⏱️ Thời gian: 2 phút
```

### 4. Gmail App Password (Gửi Email) 📧
```
1. Vào Google Account → Security
2. Bật "2-Step Verification"
3. Vào "App passwords"
4. Tạo password cho "Mail" → "Other"
5. Copy password 16 ký tự
6. Dán vào MAIL_PASSWORD trong .env
⏱️ Thời gian: 3 phút
```

### 5. Google OAuth (Optional - Đăng nhập Google)
```
1. Vào: https://console.cloud.google.com/
2. Tạo project mới
3. Enable Google+ API
4. Tạo OAuth 2.0 credentials
5. Thêm callback: http://localhost:3000/api/auth/google/callback
6. Copy Client ID và Client Secret
7. Dán vào .env
⏱️ Thời gian: 5 phút
```

---

## Bước 5: Chạy Ứng Dụng

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

**Truy cập**: http://localhost:3000

---

## Bước 6: Test Ứng Dụng

### Tạo tài khoản đầu tiên
1. Vào http://localhost:3000
2. Click "Đăng ký" → Điền thông tin
3. Đăng nhập

### Test AI Chatbot
1. Click icon chat góc dưới phải
2. Hỏi: "Tôi muốn tìm phòng trọ gần ĐH Công Nghệ"

### Test đăng tin
1. Đăng nhập → Click "Đăng tin"
2. Điền thông tin phòng
3. Upload ảnh
4. Đăng tin → Hệ thống sẽ tự động kiểm duyệt

---

## ⚠️ Troubleshooting

### Lỗi: "Cannot connect to MongoDB"
```bash
# Kiểm tra MongoDB đang chạy
mongosh
# Hoặc
mongo

# Nếu dùng Atlas, check connection string trong .env
```

### Lỗi: "Module not found"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: "Port 3000 is already in use"
```env
# Đổi port trong .env
PORT=3001
```

### Lỗi upload ảnh
- Check Cloudinary credentials
- Check internet connection

### AI không hoạt động
- Check GEMINI_API_KEY
- Check API quota (https://makersuite.google.com/app/apikey)

---

## 📱 Tính Năng Có Thể Test

✅ **Không cần API keys:**
- Đăng ký/Đăng nhập (email/password)
- Tìm kiếm phòng
- Xem chi tiết phòng
- Filter theo giá, vị trí, tiện ích

✅ **Cần Cloudinary:**
- Đăng tin có upload ảnh
- Cập nhật avatar

✅ **Cần Gemini API:**
- Chat với AI chatbot
- Gợi ý phòng thông minh

✅ **Cần Goong Maps:**
- Hiển thị bản đồ vị trí phòng
- Tìm kiếm theo bán kính

✅ **Cần Email:**
- Nhận thông báo kết quả kiểm duyệt
- Reset password (chưa hoàn thiện)

---

## 🎯 Roadmap Setup

### Setup tối thiểu (5 phút):
1. ✅ MongoDB (local hoặc Atlas)
2. ✅ .env với JWT_SECRET
3. ✅ Chạy `npm install && npm run dev`

### Setup đầy đủ (15 phút):
1. ✅ MongoDB
2. ✅ Gemini API
3. ✅ Cloudinary
4. ✅ Goong Maps
5. ✅ Gmail SMTP

### Setup pro (30 phút):
1. ✅ Tất cả ở trên
2. ✅ Google OAuth
3. ✅ ML Service (Python Flask)

---

## 🚀 Shortcuts

### Chạy nhanh (MongoDB local + API cơ bản)
```bash
# Tạo .env đơn giản
echo "NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/qlchothuetro
JWT_SECRET=my-secret-key-12345
SESSION_SECRET=my-session-key-67890" > .env

# Install & Run
npm install
npm run dev
```

### Setup MongoDB Atlas nhanh
```bash
# 1. Đăng ký Atlas
# 2. Create cluster (M0 Free)
# 3. Create Database User
# 4. Whitelist IP: 0.0.0.0/0 (cho phép tất cả)
# 5. Copy connection string
# 6. Thay vào MONGODB_URI trong .env
```

---

## 📚 Video Hướng Dẫn

### Lấy Gemini API Key
https://www.youtube.com/watch?v=... (Cập nhật sau)

### Setup MongoDB Atlas
https://www.youtube.com/watch?v=... (Cập nhật sau)

### Cấu hình Cloudinary
https://www.youtube.com/watch?v=... (Cập nhật sau)

---

## 💡 Tips

1. **Dùng MongoDB Atlas** thay vì local → Không cần cài MongoDB
2. **Gemini API miễn phí** → Không cần credit card
3. **Cloudinary Free tier** → 25GB storage, 25GB bandwidth/tháng
4. **Goong Maps Free** → 50,000 requests/tháng
5. **Dùng .env.example** → Copy và điền thông tin

---

## 🆘 Cần Giúp Đỡ?

- 📧 Email: contact@example.com
- 💬 GitHub Issues: https://github.com/kh20042004/QLChoThueTro/issues
- 📖 Đọc README.md chi tiết

---

## ✅ Checklist Setup

- [ ] Cài Node.js 18+
- [ ] Clone repository
- [ ] `npm install`
- [ ] Setup MongoDB (local hoặc Atlas)
- [ ] Tạo file .env
- [ ] Lấy Gemini API Key
- [ ] Lấy Cloudinary keys
- [ ] Lấy Goong Maps keys
- [ ] Cấu hình Gmail SMTP
- [ ] `npm run dev`
- [ ] Test http://localhost:3000
- [ ] Đăng ký tài khoản
- [ ] Test AI chatbot
- [ ] Test đăng tin

---

**Thời gian setup dự kiến**: 15-30 phút (với tất cả API keys)

**Made with ❤️ in Vietnam**
