# 🏠 QLChoThueTro - Hệ Thống Cho Thuê Nhà/Phòng Trọ

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-brightgreen.svg)
![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Hệ thống web hiện đại cho thuê nhà, phòng trọ, căn hộ tại Việt Nam với tích hợp **AI**, **Machine Learning** và **Real-time Chat**.

## 📋 Mục Lục

- [Tính Năng Chính](#-tính-năng-chính)
- [Tech Stack](#-tech-stack)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình](#-cấu-hình)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Endpoints](#-api-endpoints)
- [Machine Learning](#-machine-learning)
- [Tài Khoản Demo](#-tài-khoản-demo)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Tính Năng Chính

### 🎯 Chức Năng Cơ Bản
- ✅ **Đăng ký/Đăng nhập** - Email/Password + OAuth Google
- ✅ **Quản lý bài đăng** - CRUD phòng trọ/nhà với upload nhiều ảnh
- ✅ **Tìm kiếm nâng cao** - Lọc theo giá, vị trí, diện tích, tiện ích
- ✅ **Bản đồ tương tác** - Hiển thị vị trí phòng trên Goong Maps
- ✅ **Đặt phòng/Xem phòng** - Hệ thống booking hoàn chỉnh
- ✅ **Đánh giá & Review** - Người dùng đánh giá phòng/chủ nhà

### 🤖 AI & Machine Learning
- 🧠 **AI Chatbot** - Trợ lý ảo tư vấn 24/7 (Google Gemini 2.5 Flash + Groq)
- 🔍 **Tìm kiếm NLP** - Hiểu ngôn ngữ tự nhiên ("phòng gần ĐH Công Nghệ")
- 📊 **Dự đoán giá** - ML model dự đoán giá phòng hợp lý (XGBoost)
- 🛡️ **Kiểm duyệt tự động** - Phát hiện spam & bài đăng bất thường (Isolation Forest)

### 💬 Real-time Features
- 💬 **Chat real-time** - WebSocket giữa chủ nhà & người thuê (Socket.IO)
- 🔔 **Thông báo instant** - Cập nhật sự kiện quan trọng ngay lập tức
- 👥 **Trạng thái online/offline** - Hiển thị user đang online

### 🎨 Giao Diện & UX
- 📱 **Responsive design** - Tương thích mobile, tablet, desktop
- 🎨 **Tailwind CSS** - UI hiện đại, đẹp mắt
- ⚡ **Fast loading** - Compression, image optimization

---

## 🛠️ Tech Stack

### Backend
```
Node.js 18+      Express.js      MongoDB (Mongoose)
JWT Auth         Passport.js     Socket.IO
Multer           Cloudinary      Nodemailer
```

### Frontend
```
HTML5            CSS3            Tailwind CSS
JavaScript ES6+  Axios           Goong Maps API
Font Awesome
```

### AI & Machine Learning
```
Python 3.8+      Flask           Google Gemini API
Groq API         XGBoost         Isolation Forest
scikit-learn     pandas          numpy
```

### DevOps & Tools
```
Git              Nodemon         PM2
Winston          Helmet          Morgan
```

---

## 💻 Yêu Cầu Hệ Thống

### Node.js Application
- **Node.js**: 18.x trở lên
- **MongoDB**: 5.0 trở lên (hoặc MongoDB Atlas)
- **npm** hoặc **yarn**

### ML Service (Optional)
- **Python**: 3.8 trở lên
- **pip**: Package manager

### API Keys Cần Thiết
- MongoDB URI (MongoDB Atlas hoặc local)
- Google Gemini API Key
- Groq API Key (optional, dùng làm fallback)
- Cloudinary Account (image storage)
- Goong Maps API Key (bản đồ Việt Nam)
- Email SMTP (Gmail hoặc service khác)

---

## 📦 Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/kh20042004/QLChoThueTro.git
cd QLChoThueTro
```

### 2. Cài Đặt Dependencies

#### Backend (Node.js)
```bash
npm install
```

#### ML Service (Python) - Optional
```bash
cd ml-moderation/scripts
pip install -r requirements.txt
cd ../api
pip install -r requirements.txt
cd ../..
```

### 3. Cấu Hình Environment Variables

Tạo file `.env` ở thư mục root:

```env
# ===================================
# SERVER CONFIGURATION
# ===================================
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3000

# ===================================
# DATABASE
# ===================================
MONGODB_URI=mongodb://localhost:27017/qlchothuetro
# Hoặc dùng MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qlchothuetro

# ===================================
# JWT AUTHENTICATION
# ===================================
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# ===================================
# SESSION
# ===================================
SESSION_SECRET=your-session-secret-key

# ===================================
# OAUTH GOOGLE
# ===================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# ===================================
# EMAIL SERVICE (Gmail)
# ===================================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# ===================================
# AI SERVICES
# ===================================
# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Groq API (Fallback)
GROQ_API_KEY=your-groq-api-key

# ===================================
# CLOUDINARY (Image Storage)
# ===================================
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# ===================================
# GOONG MAPS API (Vietnam Maps)
# ===================================
GOONG_API_KEY=your-goong-api-key
GOONG_MAPTILES_KEY=your-goong-maptiles-key

# ===================================
# ML SERVICE
# ===================================
ML_MODERATION_URL=http://localhost:5000
```

---

## ⚙️ Cấu Hình

### Hướng Dẫn Lấy API Keys

#### 1. MongoDB Atlas (Free)
1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Đăng ký tài khoản miễn phí
3. Tạo cluster mới
4. Lấy connection string
5. Thay `<password>` và `<dbname>` trong URI

#### 2. Google Gemini API
1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng Google Account
3. Tạo API key mới
4. Copy key vào `.env`

#### 3. Groq API (Optional)
1. Truy cập [Groq Console](https://console.groq.com/)
2. Đăng ký tài khoản
3. Tạo API key
4. Copy key vào `.env`

#### 4. Cloudinary
1. Truy cập [Cloudinary](https://cloudinary.com/)
2. Đăng ký tài khoản miễn phí
3. Vào Dashboard → Account Details
4. Copy Cloud Name, API Key, API Secret

#### 5. Goong Maps API
1. Truy cập [Goong.io](https://goong.io/)
2. Đăng ký tài khoản
3. Tạo API key mới
4. Lấy cả API Key và Maptiles Key

#### 6. Gmail SMTP
1. Bật "2-Step Verification" trong Google Account
2. Tạo "App Password":
   - Google Account → Security → 2-Step Verification → App passwords
3. Chọn app: Mail, device: Other
4. Copy password 16 ký tự vào `.env`

---

## 🚀 Chạy Ứng Dụng

### Chạy MongoDB (Local)

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### Chạy Backend Server

#### Development Mode (Auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Server sẽ chạy tại: **http://localhost:3000**

### Chạy ML Service (Optional)

```bash
cd ml-moderation/api
python app.py
```

ML Service sẽ chạy tại: **http://localhost:5000**

### Seed Database (Optional)

```bash
# Seed danh sách trường đại học
npm run seed-universities
```

---

## 📁 Cấu Trúc Dự Án

```
QLChoThueTro/
├── server.js                 # Entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (tạo mới)
├── .gitignore               # Git ignore rules
│
├── src/                      # Source code chính
│   ├── app.js               # Express app setup
│   ├── config/              # Cấu hình (DB, Cloudinary, Passport)
│   ├── models/              # Database schemas (8 models)
│   ├── controllers/         # Business logic (12 controllers)
│   ├── routes/              # API endpoints (13 routes)
│   ├── services/            # Business services (AI, Email, Moderation...)
│   ├── middleware/          # Auth, Error handling, Upload
│   └── socket/              # WebSocket chat handler
│
├── public/                   # Static files
│   ├── css/                 # Stylesheets
│   ├── js/                  # Frontend JavaScript
│   ├── images/              # Static images
│   └── uploads/             # User uploads (ignored by git)
│
├── views/                    # HTML templates
│   ├── index.html           # Trang chủ
│   ├── properties.html      # Danh sách phòng
│   ├── property-detail.html # Chi tiết phòng
│   ├── chat.html            # Chat
│   ├── auth/                # Login, Register
│   ├── admin/               # Admin panel
│   └── partials/            # Reusable components
│
└── ml-moderation/            # Machine Learning Service
    ├── api/                  # Flask API server
    │   ├── app.py           # Main Flask app
    │   ├── moderation_service.py
    │   ├── ml_predictor.py
    │   └── requirements.txt
    ├── models/               # Trained ML models
    ├── data/                 # Training data
    ├── scripts/              # Training scripts
    │   ├── 1_data_preparation.py
    │   ├── 2_train_price_model.py
    │   ├── 3_train_anomaly_model.py
    │   └── run_all.py
    └── notebooks/            # Jupyter notebooks
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          Đăng ký tài khoản
POST   /api/auth/login             Đăng nhập
GET    /api/auth/logout            Đăng xuất
GET    /api/auth/me                Lấy thông tin user hiện tại
PUT    /api/auth/profile           Cập nhật hồ sơ
GET    /api/auth/google            OAuth Google login
```

### Properties
```
GET    /api/properties             Danh sách bài đăng (filter, sort, pagination)
GET    /api/properties/:id         Chi tiết bài đăng
POST   /api/properties             Tạo bài đăng (auth required)
PUT    /api/properties/:id         Chỉnh sửa bài đăng
DELETE /api/properties/:id         Xóa bài đăng
GET    /api/properties/my-properties    Bài đăng của tôi
```

### Bookings
```
GET    /api/bookings               Danh sách booking
POST   /api/bookings               Tạo booking mới
PUT    /api/bookings/:id           Cập nhật booking
PATCH  /api/bookings/:id/confirm   Xác nhận booking
PATCH  /api/bookings/:id/cancel    Hủy booking
```

### Reviews
```
GET    /api/reviews/property/:id   Đánh giá của bài đăng
POST   /api/reviews                Tạo đánh giá
PUT    /api/reviews/:id            Chỉnh sửa đánh giá
DELETE /api/reviews/:id            Xóa đánh giá
```

### AI & Chat
```
POST   /api/ai/chat                Chat với AI
POST   /api/ai/recommend           Gợi ý phòng từ AI
POST   /api/ai/nlp-search          Tìm kiếm NLP
GET    /api/chat/conversations     Danh sách cuộc hội thoại
POST   /api/chat/messages          Gửi tin nhắn
```

### Admin
```
GET    /api/admin/stats            Thống kê hệ thống
GET    /api/admin/users            Quản lý users
GET    /api/admin/properties       Quản lý properties
PATCH  /api/admin/users/:id/block  Block user
```

**Xem chi tiết API**: Sử dụng Postman hoặc kiểm tra file `src/routes/*.js`

---

## 🤖 Machine Learning

### Price Prediction Model (XGBoost)

Dự đoán giá phòng hợp lý dựa trên:
- Vị trí (district, ward, city)
- Diện tích (area)
- Tiện ích (wifi, AC, parking, kitchen...)
- Số phòng ngủ, phòng tắm
- Loại phòng

**Độ chính xác**: R² Score ~ 0.85

### Anomaly Detection (Isolation Forest)

Phát hiện bài đăng bất thường:
- Giá quá thấp/cao so với thị trường
- Text quá ngắn hoặc spam
- Thiếu thông tin quan trọng
- Tiêu đề/mô tả chứa từ khóa spam

### Training Models

```bash
cd ml-moderation/scripts

# Cách 1: Chạy từng bước
python 1_data_preparation.py
python 2_train_price_model.py
python 3_train_anomaly_model.py

# Cách 2: Chạy tất cả
python run_all.py
```

**Lưu ý**: Cần có MongoDB chạy và có dữ liệu properties trong database

---

## 👤 Tài Khoản Demo

### User thường
```
Email: user@example.com
Password: 123456
```

### Chủ nhà (Landlord)
```
Email: landlord@example.com
Password: 123456
```

### Admin
```
Email: admin@example.com
Password: admin123
```

**Lưu ý**: Tài khoản demo chỉ có sau khi seed data

---

## 📸 Screenshots

### Trang chủ
![Homepage](docs/screenshots/homepage.png)

### Tìm kiếm phòng
![Search](docs/screenshots/search.png)

### Chi tiết phòng
![Property Detail](docs/screenshots/property-detail.png)

### Chat real-time
![Chat](docs/screenshots/chat.png)

### AI Chatbot
![Chatbot](docs/screenshots/chatbot.png)

### Admin Dashboard
![Admin](docs/screenshots/admin.png)

---

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB đang chạy
mongosh
# hoặc
mongo
```

### Lỗi "Module not found"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi upload ảnh
- Kiểm tra Cloudinary credentials trong `.env`
- Kiểm tra internet connection

### Lỗi AI không phản hồi
- Kiểm tra API keys (Gemini, Groq)
- Kiểm tra quota API còn không

### Port đã được sử dụng
```bash
# Thay đổi PORT trong .env
PORT=3001
```

---

## 🔒 Security

- ✅ JWT token httpOnly cookies
- ✅ Bcrypt password hashing
- ✅ Helmet.js security headers
- ✅ Rate limiting (100 req/15 min)
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ XSS protection
- ✅ MongoDB injection prevention

---

## 📝 To-Do List

- [ ] Tích hợp thanh toán (Momo, ZaloPay, VNPay)
- [ ] Unit testing (Jest, Mocha)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Mobile app (React Native)
- [ ] Admin analytics dashboard
- [ ] Email verification
- [ ] Forgot password functionality
- [ ] Social media sharing

---

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 License

Dự án này được cấp phép theo giấy phép **MIT License** - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👨‍💻 Author

**KH20042004**
- GitHub: [@kh20042004](https://github.com/kh20042004)
- Email: contact@example.com

---

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Google Gemini](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
- [Cloudinary](https://cloudinary.com/)
- [Goong Maps](https://goong.io/)

---

## 📞 Support

Nếu bạn thích dự án này, hãy cho một ⭐️!

Có vấn đề? [Mở issue](https://github.com/kh20042004/QLChoThueTro/issues)

---

<div align="center">

**Made with ❤️ in Vietnam**

</div>
