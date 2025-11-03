/**
 * ===================================
 * SOCKET.IO CHAT HANDLER
 * Xử lý WebSocket cho chức năng chat
 * ===================================
 */

const { Message, Conversation, User, Notification } = require('../models');
const jwt = require('jsonwebtoken');

// Map để lưu userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  // Middleware xác thực
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${socket.user.name} (${userId})`);

    // Thêm user vào danh sách online
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online
    io.emit('user:online', { userId });

    // Join vào room cá nhân
    socket.join(`user:${userId}`);

    // ==========================================
    // EVENT: Join conversation
    // ==========================================
    socket.on('conversation:join', async (conversationId) => {
      try {
        socket.join(`conversation:${conversationId}`);
        console.log(`📥 User ${userId} joined conversation ${conversationId}`);
        
        // Đánh dấu tất cả tin nhắn là đã đọc
        await Message.markAllAsRead(conversationId, userId);
        
        // Cập nhật unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.resetUnreadCount(userId);
          
          // Thông báo cho người gửi
          const otherUserId = conversation.participants.find(
            p => p.toString() !== userId
          );
          
          if (otherUserId && onlineUsers.has(otherUserId.toString())) {
            io.to(`user:${otherUserId}`).emit('messages:read', {
              conversationId,
              readBy: userId
            });
          }
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Không thể tham gia cuộc hội thoại' });
      }
    });

    // ==========================================
    // EVENT: Leave conversation
    // ==========================================
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 User ${userId} left conversation ${conversationId}`);
    });

    // ==========================================
    // EVENT: Send message
    // ==========================================
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, receiverId, content, messageType, attachments } = data;

        // Tạo tin nhắn mới
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          receiver: receiverId,
          content,
          messageType: messageType || 'text',
          attachments: attachments || []
        });

        // Populate sender info
        await message.populate('sender', 'name avatar');

        // Cập nhật conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = message._id;
          conversation.lastMessageTime = message.createdAt;
          
          // Tăng unread count cho receiver
          await conversation.incrementUnreadCount(receiverId);
        }

        // Gửi tin nhắn cho người nhận (nếu online)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:received', {
            message,
            conversation: {
              _id: conversationId,
              lastMessage: message,
              lastMessageTime: message.createdAt
            }
          });
        }

        // Tạo notification cho người nhận (nếu offline hoặc không ở trong conversation)
        if (!receiverSocketId) {
          try {
            const notification = await Notification.create({
              user: receiverId,
              type: 'message_received',
              title: 'Tin nhắn mới',
              message: `${socket.user.name} đã gửi tin nhắn cho bạn`,
              link: `/chat?conversation=${conversationId}`,
              metadata: {
                senderId: userId,
                senderName: socket.user.name,
                conversationId: conversationId
              }
            });

            // Nếu người nhận online, emit notification event
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('notification:new', notification);
            }
          } catch (error) {
            console.error('Error creating message notification:', error);
          }
        }

        // Gửi lại cho người gửi (confirmation)
        socket.emit('message:sent', {
          message,
          conversation: {
            _id: conversationId,
            lastMessage: message,
            lastMessageTime: message.createdAt
          }
        });

        // Broadcast tin nhắn trong conversation room
        socket.to(`conversation:${conversationId}`).emit('message:new', message);

        console.log(`💬 Message sent from ${userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // ==========================================
    // EVENT: Typing indicator
    // ==========================================
    socket.on('typing:start', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:started', {
          conversationId,
          userId,
          userName: socket.user.name
        });
      }
    });

    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stopped', {
          conversationId,
          userId
        });
      }
    });

    // ==========================================
    // EVENT: Mark messages as read
    // ==========================================
    socket.on('messages:markAsRead', async ({ conversationId }) => {
      try {
        await Message.markAllAsRead(conversationId, userId);
        
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.resetUnreadCount(userId);
          
          // Thông báo cho người gửi
          const otherUserId = conversation.participants.find(
            p => p.toString() !== userId
          );
          
          if (otherUserId && onlineUsers.has(otherUserId.toString())) {
            io.to(`user:${otherUserId}`).emit('messages:read', {
              conversationId,
              readBy: userId
            });
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ==========================================
    // EVENT: Get online status
    // ==========================================
    socket.on('users:getOnlineStatus', (userIds) => {
      const onlineStatus = {};
      userIds.forEach(id => {
        onlineStatus[id] = onlineUsers.has(id);
      });
      socket.emit('users:onlineStatus', onlineStatus);
    });

    // ==========================================
    // EVENT: Disconnect
    // ==========================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${userId})`);
      onlineUsers.delete(userId);
      
      // Broadcast user offline
      io.emit('user:offline', { userId });
    });

    // ==========================================
    // EVENT: Error handling
    // ==========================================
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Xuất io instance để sử dụng ở nơi khác
  global.io = io;
  global.onlineUsers = onlineUsers;
};
