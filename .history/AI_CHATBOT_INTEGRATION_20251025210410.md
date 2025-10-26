# 🤖 Tích hợp AI Chatbot với Gemini

## Tổng quan
Hệ thống đã được tích hợp chatbot AI sử dụng Google Gemini 2.0 Flash để tư vấn khách hàng về dịch vụ cho thuê phòng trọ.

## Các tính năng chính

### 1. Chat tư vấn tự động
- Trả lời câu hỏi về dịch vụ cho thuê phòng
- Tư vấn tìm phòng phù hợp với nhu cầu
- Hỗ trợ 24/7 bằng tiếng Việt

### 2. Gợi ý phòng thông minh
- Phân tích yêu cầu của người dùng (ngân sách, địa điểm, tiện ích)
- Đề xuất các phòng phù hợp từ database
- Giải thích lý do gợi ý

### 3. Phân tích mô tả phòng (Dành cho chủ nhà)
- Đánh giá chất lượng mô tả bài đăng
- Đề xuất cải thiện nội dung
- Tối ưu hóa từ khóa SEO

### 4. Trả lời FAQ
- Câu hỏi thường gặp về hệ thống
- Hướng dẫn sử dụng
- Chính sách và quy định

## Cấu trúc code

### Backend

#### 1. Gemini Service (`src/services/geminiService.js`)
```javascript
// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Các phương thức:
- chat(message, history) // Chat chính
- getPropertyRecommendation(userPreferences) // Gợi ý phòng
- analyzePropertyDescription(description) // Phân tích mô tả
- answerFAQ(question) // Trả lời FAQ
```

**Đặc điểm:**
- System prompt được tùy chỉnh cho ngữ cảnh cho thuê phòng
- Hỗ trợ conversation history để duy trì ngữ cảnh
- Validate input để tránh lỗi API
- Error handling toàn diện

#### 2. AI Controller (`src/controllers/aiController.js`)
```javascript
// Các endpoint handlers:
- chat() // POST /api/ai/chat
- getRecommendation() // POST /api/ai/recommend
- analyzeDescription() // POST /api/ai/analyze-description
- answerFAQ() // POST /api/ai/faq
```

**Đặc điểm:**
- Validate input từ client
- Error handling và logging
- Phân quyền cho các endpoint đặc biệt
- Format response chuẩn

#### 3. AI Routes (`src/routes/aiRoutes.js`)
```javascript
// Public routes
router.post('/chat', aiController.chat);
router.post('/recommend', aiController.getRecommendation);
router.post('/faq', aiController.answerFAQ);

// Protected routes (Landlord only)
router.post('/analyze-description', protect, authorize('landlord'), aiController.analyzeDescription);
```

### Frontend

#### 1. Chatbot Widget (`public/js/chatbot.js`)
```javascript
class Chatbot {
  // Khởi tạo và quản lý UI
  constructor()
  
  // Các phương thức chính:
  - toggleChatbot() // Mở/đóng chat window
  - sendMessage() // Gửi tin nhắn
  - addMessage(text, sender) // Thêm tin nhắn vào UI
  - showTypingIndicator() // Hiển thị typing animation
  - callChatAPI(message) // Gọi API
  - saveConversationHistory() // Lưu lịch sử
}
```

**Tính năng UI:**
- Floating chat button
- Chat window với animation
- Typing indicator
- Quick reply buttons
- Message history
- Auto-scroll
- Local storage cho conversation history

#### 2. Chatbot Styles (`public/css/chatbot.css`)
- Responsive design
- Modern gradient UI
- Smooth animations
- Mobile-friendly
- Accessibility support

## Cách sử dụng

### 1. Cài đặt

#### Bước 1: Cài đặt dependencies
```bash
npm install @google/generative-ai
```

#### Bước 2: Cấu hình môi trường
Thêm vào file `.env`:
```env
GEMINI_API_KEY=AIzaSyB9C41OXdd3oN8BOsir9Cv-4WfFui_qbis
```

#### Bước 3: Khởi động server
```bash
npm start
```

### 2. Tích hợp vào trang HTML

Thêm vào cuối file HTML (trước `</body>`):
```html
<!-- AI Chatbot Widget -->
<link rel="stylesheet" href="/css/chatbot.css">
<script src="/js/chatbot.js"></script>
```

### 3. Sử dụng API trực tiếp

#### Chat endpoint
```javascript
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Tôi muốn tìm phòng giá rẻ ở quận 1",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Xin chào" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Chào bạn!" }]
    }
  ]
}

Response:
{
  "success": true,
  "reply": "Tôi có thể giúp bạn tìm phòng trọ...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Recommendation endpoint
```javascript
POST /api/ai/recommend
Content-Type: application/json

{
  "budget": 3000000,
  "location": "Quận 1, TP.HCM",
  "preferences": "Gần trường đại học, có wifi"
}

Response:
{
  "success": true,
  "recommendation": "Dựa trên yêu cầu của bạn...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### FAQ endpoint
```javascript
POST /api/ai/faq
Content-Type: application/json

{
  "question": "Làm thế nào để đăng tin?"
}

Response:
{
  "success": true,
  "answer": "Để đăng tin cho thuê phòng...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Analyze Description endpoint (Landlord only)
```javascript
POST /api/ai/analyze-description
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Phòng trọ đẹp, giá rẻ..."
}

Response:
{
  "success": true,
  "analysis": {
    "score": 6.5,
    "strengths": ["Đề cập giá cả", "Mô tả ngắn gọn"],
    "improvements": ["Thiếu thông tin diện tích", "Cần thêm tiện ích"],
    "suggestion": "Mô tả chi tiết hơn về..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## API Specification

### POST /api/ai/chat
**Mô tả:** Chat với AI chatbot

**Request Body:**
```typescript
{
  message: string,        // Tin nhắn từ user (required)
  history?: Array<{      // Lịch sử chat (optional)
    role: 'user' | 'model',
    parts: [{ text: string }]
  }>
}
```

**Response:**
```typescript
{
  success: boolean,
  reply: string,
  timestamp: Date
}
```

### POST /api/ai/recommend
**Mô tả:** Nhận gợi ý phòng từ AI

**Request Body:**
```typescript
{
  budget?: number,        // Ngân sách (optional)
  location?: string,      // Địa điểm (optional)
  preferences?: string    // Yêu cầu khác (optional)
}
```

**Response:**
```typescript
{
  success: boolean,
  recommendation: string,
  timestamp: Date
}
```

### POST /api/ai/faq
**Mô tả:** Hỏi câu hỏi thường gặp

**Request Body:**
```typescript
{
  question: string  // Câu hỏi (required)
}
```

**Response:**
```typescript
{
  success: boolean,
  answer: string,
  timestamp: Date
}
```

### POST /api/ai/analyze-description
**Mô tả:** Phân tích mô tả phòng (Landlord only)

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
{
  description: string  // Mô tả phòng (required)
}
```

**Response:**
```typescript
{
  success: boolean,
  analysis: {
    score: number,
    strengths: string[],
    improvements: string[],
    suggestion: string
  },
  timestamp: Date
}
```

## Testing

### Manual Testing
1. Mở trang web: http://localhost:3000
2. Click vào nút chat (góc dưới bên phải)
3. Nhập tin nhắn và kiểm tra response
4. Test các quick reply buttons
5. Kiểm tra conversation history

### Automated Testing
```bash
node test-chatbot.js
```

Test script sẽ kiểm tra:
- ✓ Chat endpoint
- ✓ Recommendation endpoint
- ✓ FAQ endpoint

## Troubleshooting

### Lỗi thường gặp

#### 1. API Key không hợp lệ
```
Error: Invalid API key
```
**Giải pháp:** Kiểm tra `GEMINI_API_KEY` trong file `.env`

#### 2. History format không đúng
```
Error: required oneof field 'data' must have one initialized field
```
**Giải pháp:** Đã được fix bằng cách validate history trước khi gửi

#### 3. Rate limit exceeded
```
Error: 429 Too Many Requests
```
**Giải pháp:** Thêm rate limiting hoặc đợi một chút rồi thử lại

#### 4. Chatbot không hiển thị
**Kiểm tra:**
- File CSS đã được load chưa
- File JS đã được load chưa
- Console có lỗi không

## Performance Optimization

### 1. Caching
- Cache các câu hỏi FAQ thường gặp
- Lưu conversation history trong localStorage

### 2. Rate Limiting
- Giới hạn số request từ mỗi IP
- Debounce user input

### 3. Error Handling
- Fallback responses khi AI không khả dụng
- Retry logic cho failed requests

## Bảo mật

### 1. API Key
- ✓ Lưu trong environment variables
- ✓ Không commit vào Git
- ✗ Không hardcode trong code

### 2. Input Validation
- ✓ Validate message length
- ✓ Sanitize user input
- ✓ Rate limiting

### 3. Authorization
- ✓ Phân quyền cho endpoint đặc biệt
- ✓ JWT authentication cho protected routes

## Roadmap

### Phase 1 (Hoàn thành) ✓
- [x] Tích hợp Gemini API
- [x] Tạo chatbot UI
- [x] Implement basic chat
- [x] Conversation history

### Phase 2 (Kế hoạch)
- [ ] Tích hợp với database properties
- [ ] Smart search với NLP
- [ ] Multi-language support
- [ ] Voice input/output

### Phase 3 (Tương lai)
- [ ] Image analysis cho property photos
- [ ] Sentiment analysis
- [ ] Chatbot analytics dashboard
- [ ] A/B testing different prompts

## Resources

### Documentation
- [Google Generative AI SDK](https://ai.google.dev/tutorials/node_quickstart)
- [Gemini API Reference](https://ai.google.dev/api/rest)

### Model Information
- Model: `gemini-2.0-flash-exp`
- Language: Vietnamese
- Context Window: Large
- Response Time: ~1-2 seconds

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Xem file `TROUBLESHOOTING.md`
3. Liên hệ team support

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Author:** Room Rental System Team
