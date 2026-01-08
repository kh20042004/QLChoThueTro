# 📋 Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và dự án tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-08

### 🎉 Initial Release

#### ✨ Added
- **Authentication System**
  - Email/Password registration & login
  - JWT token authentication
  - OAuth Google login integration
  - User profile management
  - Role-based access control (user, landlord, admin)

- **Property Management**
  - CRUD operations for properties
  - Multi-image upload with Cloudinary
  - Property listing with advanced filters
  - Search by price, location, area, amenities
  - Interactive map integration (Goong Maps)
  - Property status management (available, rented, deleted)

- **Booking System**
  - Create viewing appointments
  - Rental booking management
  - Booking status tracking (pending, confirmed, active, completed, cancelled)
  - Landlord booking dashboard

- **Review System**
  - Property reviews and ratings (1-5 stars)
  - Review moderation
  - Verified reviews
  - Review images upload

- **Real-time Chat**
  - WebSocket-based messaging (Socket.IO)
  - One-to-one chat between users
  - Message types: text, image, file, property reference
  - Read receipts
  - Online/offline status
  - Typing indicators

- **AI Integration**
  - AI Chatbot with Google Gemini 2.5 Flash
  - Groq API as fallback
  - Natural Language Processing search
  - Property recommendations
  - Retry with exponential backoff

- **ML Moderation**
  - Automated property moderation
  - Price prediction model (XGBoost)
  - Anomaly detection (Isolation Forest)
  - Rule-based validation
  - Email notifications for moderation results
  - Moderation score calculation

- **Notification System**
  - Real-time notifications
  - Notification types: booking, review, message, moderation
  - Read/unread status
  - Notification badge

- **Admin Dashboard**
  - User management
  - Property moderation
  - System statistics
  - Block/unblock users
  - Approve/reject properties

- **Location Features**
  - Address autocomplete
  - Map picker for property location
  - Nearby properties search
  - University locations database
  - Geocoding service

- **Frontend**
  - Responsive design (mobile, tablet, desktop)
  - Tailwind CSS styling
  - Interactive UI components
  - Image optimization
  - Form validation

- **Security**
  - Bcrypt password hashing
  - JWT httpOnly cookies
  - Helmet.js security headers
  - CORS protection
  - Rate limiting (100 requests/15 min)
  - Input sanitization
  - XSS protection

- **Performance**
  - Compression middleware
  - Image optimization with Sharp
  - Database query optimization
  - Pagination for large datasets

- **DevOps**
  - Nodemon for development
  - Environment variables configuration
  - Winston logger
  - Morgan HTTP logger
  - Error handling middleware

#### 📝 Documentation
- Comprehensive README.md
- Quick setup guide (SETUP.md)
- Contributing guidelines (CONTRIBUTING.md)
- MIT License
- .env.example template
- API documentation in code comments

#### 🗄️ Database Models
- User model (authentication, profile)
- Property model (listings)
- Booking model (appointments, rentals)
- Review model (ratings, comments)
- Message model (chat messages)
- Conversation model (chat conversations)
- Notification model (system notifications)
- University model (university locations)
- Contact model (contact form submissions)

#### 🛠️ Technical Stack
- **Backend**: Node.js 18+, Express.js 4.x
- **Database**: MongoDB 5.0+ (Mongoose ORM)
- **AI/ML**: Python 3.8+, Flask, XGBoost, scikit-learn
- **Frontend**: HTML5, CSS3, Tailwind CSS, Vanilla JavaScript
- **Real-time**: Socket.IO 4.x
- **Cloud**: Cloudinary (images), MongoDB Atlas (database)
- **APIs**: Google Gemini, Groq, Goong Maps

---

## [Unreleased]

### 🚀 Planned Features
- Payment integration (Momo, ZaloPay, VNPay)
- Email verification
- Forgot password functionality
- Unit testing (Jest, Mocha)
- API documentation (Swagger/OpenAPI)
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Mobile app (React Native)
- Advanced analytics dashboard
- SEO optimization
- Social media sharing
- Property comparison tool
- Dark mode
- Multi-language support

### 🐛 Known Issues
- None reported yet

---

## Version History

- **1.0.0** (2026-01-08) - Initial release

---

## Legend

- 🎉 **Major release**
- ✨ **Added** - New features
- 🔧 **Changed** - Changes in existing functionality
- 🐛 **Fixed** - Bug fixes
- 🗑️ **Deprecated** - Soon-to-be removed features
- ❌ **Removed** - Removed features
- 🔒 **Security** - Vulnerability fixes
- 📝 **Documentation** - Documentation changes

---

*Keep this changelog updated with every significant change!*
