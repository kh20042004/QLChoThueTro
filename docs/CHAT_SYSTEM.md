# Hệ thống Chat với WebSocket (Socket.IO)

## 📋 Tổng quan

Hệ thống chat realtime sử dụng Socket.IO cho giao tiếp hai chiều giữa client và server. Hỗ trợ:
- ✅ Chat realtime với WebSocket
- ✅ Typing indicators (đang nhập...)
- ✅ Read receipts (đã đọc)
- ✅ Online/Offline status
- ✅ Unread message count
- ✅ Message history với pagination
- ✅ File attachments support
- ✅ Property references trong chat

## 🏗️ Cấu trúc

### Models
```
src/models/
├── Conversation.js   # Cuộc hội thoại giữa 2 users
└── Message.js        # Tin nhắn cá nhân
```

### Backend
```
src/
├── socket/
│   └── chatHandler.js        # WebSocket event handlers
├── controllers/
│   └── chatController.js     # HTTP REST API
└── routes/
    └── chatRoutes.js         # API endpoints
```

### Frontend
```
public/js/
└── chat.js                   # Socket.IO client logic

views/
└── chat.html                 # Chat UI
```

## 🔌 WebSocket Events

### Client → Server

| Event | Data | Mô tả |
|-------|------|-------|
| `conversation:join` | `conversationId` | Join vào room cuộc hội thoại |
| `conversation:leave` | `conversationId` | Rời khỏi room |
| `message:send` | `{conversationId, receiverId, content, messageType, attachments}` | Gửi tin nhắn |
| `typing:start` | `{conversationId, receiverId}` | Bắt đầu gõ |
| `typing:stop` | `{conversationId, receiverId}` | Dừng gõ |
| `messages:markAsRead` | `{conversationId}` | Đánh dấu đã đọc |
| `users:getOnlineStatus` | `[userIds]` | Lấy trạng thái online |

### Server → Client

| Event | Data | Mô tả |
|-------|------|-------|
| `user:online` | `{userId}` | User online |
| `user:offline` | `{userId}` | User offline |
| `message:received` | `{message, conversation}` | Nhận tin nhắn mới |
| `message:sent` | `{message}` | Xác nhận gửi tin nhắn |
| `message:new` | `message` | Tin nhắn mới trong room |
| `typing:started` | `{conversationId, userId, userName}` | Ai đó đang gõ |
| `typing:stopped` | `{conversationId, userId}` | Dừng gõ |
| `messages:read` | `{conversationId, readBy}` | Tin nhắn đã được đọc |
| `users:onlineStatus` | `{userId: boolean}` | Trạng thái online |

## 🔐 Authentication

WebSocket sử dụng JWT token:

```javascript
const socket = io({
  auth: {
    token: localStorage.getItem('token')
  }
});
```

Middleware xác thực trong `chatHandler.js`:
- Verify JWT token
- Load user data
- Attach `socket.userId` và `socket.user`

## 📡 REST API Endpoints

### GET `/api/chat/conversations`
Lấy danh sách conversations của user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "conv_id",
      "otherUser": {
        "_id": "user_id",
        "name": "Nguyen Van A",
        "avatar": "url"
      },
      "lastMessage": {...},
      "lastMessageTime": "2025-11-03T...",
      "unreadCount": 3
    }
  ]
}
```

### POST `/api/chat/conversations`
Tạo hoặc lấy conversation giữa 2 users

**Body:**
```json
{
  "userId": "other_user_id",
  "propertyId": "property_id" // optional
}
```

### GET `/api/chat/conversations/:conversationId/messages`
Lấy messages trong conversation

**Query params:**
- `page` (default: 1)
- `limit` (default: 50)

### POST `/api/chat/messages`
Gửi tin nhắn (HTTP fallback nếu không dùng WebSocket)

**Body:**
```json
{
  "conversationId": "conv_id",
  "receiverId": "user_id",
  "content": "Hello",
  "messageType": "text",
  "attachments": []
}
```

### GET `/api/chat/unread-count`
Lấy tổng số tin nhắn chưa đọc

### GET `/api/chat/search?query=...`
Tìm kiếm conversations

### DELETE `/api/chat/conversations/:conversationId`
Xóa conversation (soft delete)

## 💾 Database Schema

### Conversation Schema
```javascript
{
  participants: [ObjectId], // 2 users
  propertyId: ObjectId,     // optional
  lastMessage: ObjectId,
  lastMessageTime: Date,
  unreadCount: Map<String, Number>, // userId → count
  isActive: Boolean,
  timestamps: true
}
```

### Message Schema
```javascript
{
  conversation: ObjectId,
  sender: ObjectId,
  receiver: ObjectId,
  content: String,
  messageType: 'text' | 'image' | 'file' | 'property',
  attachments: [{
    url: String,
    publicId: String,
    type: 'image' | 'file',
    filename: String,
    size: Number
  }],
  propertyReference: ObjectId,
  isRead: Boolean,
  readAt: Date,
  isDeleted: Boolean,
  deletedBy: [ObjectId],
  timestamps: true
}
```

## 🚀 Khởi động

### 1. Cài đặt dependencies
```bash
npm install socket.io
```

### 2. Start server
```bash
npm run dev
```

Server sẽ khởi động với:
- HTTP server: `http://localhost:3000`
- WebSocket server: tự động tích hợp

### 3. Truy cập chat
```
http://localhost:3000/chat
```

## 🔧 Cấu hình

### server.js
```javascript
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

require('./src/socket/chatHandler')(io);
```

### Environment Variables
```env
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:3000
```

## 📱 Client Usage

### Khởi tạo connection
```javascript
const socket = io({
  auth: { token: localStorage.getItem('token') }
});
```

### Gửi tin nhắn
```javascript
socket.emit('message:send', {
  conversationId: 'conv_id',
  receiverId: 'user_id',
  content: 'Hello!',
  messageType: 'text'
});
```

### Lắng nghe tin nhắn mới
```javascript
socket.on('message:received', ({ message, conversation }) => {
  console.log('New message:', message);
  appendMessage(message);
});
```

### Typing indicator
```javascript
// Start typing
socket.emit('typing:start', {
  conversationId: 'conv_id',
  receiverId: 'user_id'
});

// Stop typing
socket.emit('typing:stop', {
  conversationId: 'conv_id',
  receiverId: 'user_id'
});
```

## 🎨 UI Components

### Conversation List
- Avatar với online status dot
- Last message preview
- Unread count badge
- Timestamp

### Chat Area
- Message bubbles (sent/received)
- Typing indicator
- Read receipts (double check)
- Timestamps

### Message Input
- Auto-resize textarea
- Send button
- File attachment (future)
- Emoji picker (future)

## 🔒 Security

1. **Authentication**: JWT token required
2. **Authorization**: Users chỉ thấy conversations của mình
3. **Rate limiting**: Có thể thêm rate limit cho socket events
4. **Input validation**: Validate message content, file size
5. **XSS Protection**: Escape HTML trong messages

## 📊 Performance

### Optimizations
- Message pagination (50 messages/page)
- Lazy loading conversations
- Socket.IO rooms để broadcast hiệu quả
- Index database cho queries nhanh

### Scaling
- Redis adapter cho multiple Socket.IO instances
- Message queue (Bull/RabbitMQ) cho xử lý async
- CDN cho file attachments

## 🐛 Debugging

### Check WebSocket connection
```javascript
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Monitor online users
```javascript
// Server side
console.log('Online users:', global.onlineUsers.size);
```

## 📝 TODO / Future Features

- [ ] Group chat support
- [ ] Voice messages
- [ ] Video call integration
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Search messages
- [ ] Pin conversations
- [ ] Block users
- [ ] Report abuse
- [ ] Push notifications (Firebase)
- [ ] Email notifications
- [ ] Message encryption

## 📚 Resources

- Socket.IO Docs: https://socket.io/docs/v4/
- JWT Authentication: https://jwt.io/
- MongoDB Best Practices: https://www.mongodb.com/docs/manual/

## 👥 Support

For issues or questions, contact the development team.

---

**Last updated:** November 3, 2025
**Version:** 1.0.0
