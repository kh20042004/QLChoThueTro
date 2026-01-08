# 🤝 Contributing to QLChoThueTro

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án! 

## 📋 Quy Trình Đóng Góp

### 1. Fork Repository
- Nhấn nút "Fork" ở góc trên bên phải
- Clone repository về máy:
```bash
git clone https://github.com/your-username/QLChoThueTro.git
cd QLChoThueTro
```

### 2. Tạo Branch Mới
```bash
git checkout -b feature/ten-tinh-nang
# hoặc
git checkout -b fix/ten-loi-can-sua
```

### 3. Làm Việc & Commit
```bash
# Làm các thay đổi của bạn
# Test kỹ trước khi commit

git add .
git commit -m "feat: thêm tính năng XYZ"
```

### 4. Push & Pull Request
```bash
git push origin feature/ten-tinh-nang
```
- Vào GitHub → Mở Pull Request
- Mô tả rõ ràng những gì bạn đã làm

---

## 📝 Commit Message Convention

Sử dụng format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Cập nhật tài liệu
- `style`: Format code (không ảnh hưởng logic)
- `refactor`: Cải thiện code
- `test`: Thêm/sửa tests
- `chore`: Công việc maintenance

### Examples:
```bash
feat(auth): add Google OAuth login
fix(chat): resolve message not sending issue
docs(readme): update installation guide
style(property): format code with prettier
refactor(api): optimize database queries
test(booking): add unit tests for booking service
chore(deps): update dependencies
```

---

## 🎨 Code Style

### JavaScript/Node.js
- Sử dụng **ES6+** syntax
- **camelCase** cho variables và functions
- **PascalCase** cho classes và components
- **UPPER_CASE** cho constants
- Indent: **2 spaces**
- Quotes: **Single quotes** ('') cho strings
- Semicolons: **Required**

```javascript
// ✅ Good
const userName = 'John Doe';
const MAX_RETRY = 3;

function getUserById(id) {
  return users.find(user => user.id === id);
}

// ❌ Bad
const user_name = "John Doe"
const maxRetry = 3

function get_user_by_id(id) {
  return users.find(user => user.id === id)
}
```

### Python (ML Service)
- Follow **PEP 8**
- **snake_case** cho functions và variables
- **PascalCase** cho classes
- Indent: **4 spaces**
- Docstrings: Required cho functions

```python
# ✅ Good
def calculate_price_score(property_data):
    """Calculate moderation score for property price."""
    predicted_price = model.predict(features)
    return score

# ❌ Bad
def CalculatePriceScore(propertyData):
    predictedPrice = model.predict(features)
    return score
```

---

## 🧪 Testing

### Before Submit PR:
```bash
# Test backend
npm run dev

# Test các chức năng:
# - Đăng ký/Đăng nhập
# - CRUD properties
# - Chat
# - AI chatbot
# - Upload ảnh
```

### Test ML Service:
```bash
cd ml-moderation/api
python app.py

# Test endpoints:
# - GET /
# - POST /api/moderate
```

---

## 📂 File Structure Convention

### Controllers:
```javascript
// src/controllers/exampleController.js
/**
 * @desc    Mô tả function
 * @route   GET/POST /api/example
 * @access  Public/Private
 */
exports.functionName = async (req, res, next) => {
  try {
    // Logic
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
```

### Models:
```javascript
// src/models/Example.js
const mongoose = require('mongoose');

const ExampleSchema = new mongoose.Schema({
  field: {
    type: String,
    required: [true, 'Error message']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Example', ExampleSchema);
```

### Routes:
```javascript
// src/routes/exampleRoutes.js
const express = require('express');
const router = express.Router();
const { functionName } = require('../controllers/exampleController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', functionName);

// Protected routes
router.post('/', protect, authorize('user', 'admin'), functionName);

module.exports = router;
```

---

## 🐛 Bug Reports

Khi báo lỗi, vui lòng cung cấp:

1. **Mô tả rõ ràng** về lỗi
2. **Các bước tái hiện** lỗi:
   ```
   1. Vào trang X
   2. Click button Y
   3. Kết quả: Z (mong đợi: W)
   ```
3. **Environment**:
   - OS: Windows/Mac/Linux
   - Node.js version
   - MongoDB version
   - Browser (nếu frontend issue)
4. **Screenshots** (nếu có)
5. **Console logs/Error messages**

---

## 💡 Feature Requests

Khi đề xuất tính năng mới:

1. **Mô tả tính năng** rõ ràng
2. **Use case**: Tại sao cần tính năng này?
3. **Giải pháp đề xuất** (nếu có)
4. **Alternatives** đã cân nhắc

---

## 📌 Areas to Contribute

### 🔥 High Priority
- [ ] Tích hợp thanh toán (Momo, ZaloPay, VNPay)
- [ ] Email verification
- [ ] Forgot password functionality
- [ ] Unit tests
- [ ] API documentation (Swagger)

### 🌟 Medium Priority
- [ ] Admin analytics dashboard
- [ ] Advanced search filters
- [ ] Property comparison
- [ ] User rating system
- [ ] Notification preferences

### 💡 Nice to Have
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Social media sharing
- [ ] Export reports (PDF)

---

## ✅ Pull Request Checklist

Trước khi submit PR, check:

- [ ] Code chạy không có lỗi
- [ ] Follow code style guide
- [ ] Commit messages rõ ràng
- [ ] Update README.md (nếu cần)
- [ ] Test tất cả chức năng liên quan
- [ ] Không có console.log() debug code
- [ ] Không commit file .env
- [ ] Không commit node_modules/
- [ ] PR description rõ ràng

---

## 🚫 What NOT to Do

❌ **Don't**:
- Commit file `.env` (chứa API keys)
- Commit `node_modules/`
- Commit files trong `public/uploads/`
- Commit Python `__pycache__/`
- Commit ML models (`.pkl`, `.h5`)
- Hard-code API keys trong code
- Push trực tiếp lên `main` branch
- Create PR without testing

---

## 🎯 Best Practices

### 1. Error Handling
```javascript
// ✅ Always use try-catch
exports.example = async (req, res, next) => {
  try {
    const result = await SomeModel.find();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

### 2. Validation
```javascript
// ✅ Validate input
const { title, price } = req.body;

if (!title || !price) {
  return res.status(400).json({
    success: false,
    error: 'Vui lòng nhập đầy đủ thông tin'
  });
}
```

### 3. Comments
```javascript
// ✅ Comment cho logic phức tạp
// Calculate moderation score based on multiple factors
const score = (priceScore * 0.4) + (contentScore * 0.3) + (imageScore * 0.3);
```

### 4. Security
```javascript
// ✅ Never expose sensitive data
res.json({
  success: true,
  data: {
    id: user._id,
    name: user.name,
    email: user.email
    // ❌ Don't send: password, resetToken, etc.
  }
});
```

---

## 📖 Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

## 🙏 Thank You!

Mỗi contribution, dù lớn hay nhỏ, đều được đánh giá cao!

Có câu hỏi? [Mở issue](https://github.com/kh20042004/QLChoThueTro/issues) hoặc liên hệ maintainers.

---

**Happy Coding! 🚀**
