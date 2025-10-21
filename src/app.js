const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Session (phải đặt trước passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve views as static files
app.use('/views', express.static(path.join(__dirname, '../views')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// View Routes - Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// View Routes - Trang giới thiệu
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/about.html'));
});

// View Routes - Trang liên hệ
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/contact.html'));
});

// View Routes - Trang danh sách phòng
app.get('/properties', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/properties.html'));
});

// View Routes - Trang chi tiết phòng
app.get('/properties/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/property-detail.html'));
});

// View Routes - Trang đăng nhập
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/auth/login.html'));
});

// View Routes - Trang đăng ký
app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/auth/register.html'));
});
 
// 404 handler - chỉ cho các route HTML, bỏ qua static files
app.use((req, res, next) => {
  // Bỏ qua các request cho static files (css, js, images, fonts)
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return res.status(404).end();
  }
  
  const error = new Error('Không tìm thấy trang');
  error.status = 404;
  next(error);
});

// Error handler
app.use(errorHandler);

module.exports = app;
