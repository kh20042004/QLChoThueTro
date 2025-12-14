/**
 * ===================================
 * CHAT CONTROLLER
 * Xử lý API endpoints cho chức năng chat
 * ===================================
 */

const { Conversation, Message, User, Property, Notification } = require('../models');

/**
 * @desc    Lấy danh sách conversations của user
 * @route   GET /api/chat/conversations
 * @access  Private
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'name avatar email')
      .populate('lastMessage')
      .populate('propertyId', 'title images address')
      .sort({ lastMessageTime: -1 })
      .lean();

    // Tính toán unread count và format dữ liệu
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      // Xử lý unreadCount - có thể là Map hoặc Object
      let unreadCount = 0;
      if (conv.unreadCount) {
        if (typeof conv.unreadCount.get === 'function') {
          unreadCount = conv.unreadCount.get(userId.toString()) || 0;
        } else if (typeof conv.unreadCount === 'object') {
          unreadCount = conv.unreadCount[userId.toString()] || 0;
        }
      }

      return {
        _id: conv._id,
        otherUser,
        property: conv.propertyId,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách cuộc hội thoại'
    });
  }
};

/**
 * @desc    Lấy hoặc tạo conversation giữa 2 users
 * @route   POST /api/chat/conversations
 * @access  Private
 */
exports.createOrGetConversation = async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người nhận'
      });
    }

    // Kiểm tra user tồn tại
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Tìm conversation hiện có
    let conversation = await Conversation.findBetweenUsers(
      currentUserId,
      userId,
      propertyId
    );

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        propertyId: propertyId || null,
        unreadCount: new Map()
      });
    }

    // Populate thông tin
    await conversation.populate('participants', 'name avatar email');
    await conversation.populate('propertyId', 'title images address');
    await conversation.populate('lastMessage');

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo cuộc hội thoại'
    });
  }
};

/**
 * @desc    Lấy messages trong một conversation
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @access  Private
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Kiểm tra user có trong conversation không
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc hội thoại không tồn tại'
      });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
      deletedBy: { $ne: userId }
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('propertyReference', 'title images address price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Đếm tổng số messages
    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
      deletedBy: { $ne: userId }
    });

    // Đánh dấu messages là đã đọc
    await Message.markAllAsRead(conversationId, userId);
    await conversation.resetUnreadCount(userId);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse để messages cũ nhất ở đầu
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy tin nhắn'
    });
  }
};

/**
 * @desc    Gửi tin nhắn (HTTP fallback)
 * @route   POST /api/chat/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content, messageType, attachments } = req.body;
    const userId = req.user._id;

    if (!conversationId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cuộc hội thoại'
      });
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống'
      });
    }

    // Tạo message
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      receiver: receiverId,
      content,
      messageType: messageType || 'text',
      attachments: attachments || []
    });

    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Cập nhật conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.lastMessage = message._id;
      conversation.lastMessageTime = message.createdAt;
      await conversation.incrementUnreadCount(receiverId);
    }

    // Emit socket event nếu có global.io
    if (global.io && global.onlineUsers) {
      const receiverSocketId = global.onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        global.io.to(receiverSocketId).emit('message:received', {
          message,
          conversation: {
            _id: conversationId,
            lastMessage: message,
            lastMessageTime: message.createdAt
          }
        });
      } else {
        // Người nhận offline → Tạo notification
        try {
          const preview = content ? (content.length > 50 ? content.substring(0, 50) + '...' : content) : 'Đã gửi file đính kèm';
          await Notification.create({
            user: receiverId,
            type: 'message_new',
            title: `Tin nhắn mới từ ${req.user.name}`,
            message: preview,
            link: `/chat?conversation=${conversationId}`,
            icon: 'fa-comment',
            color: 'blue',
            data: {
              conversationId: conversationId,
              messageId: message._id,
              senderId: userId,
              senderName: req.user.name
            }
          });
        } catch (notifError) {
          console.error('❌ Error creating message notification:', notifError);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn'
    });
  }
};

/**
 * @desc    Xóa conversation
 * @route   DELETE /api/chat/conversations/:conversationId
 * @access  Private
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc hội thoại không tồn tại'
      });
    }

    // Soft delete: đánh dấu isActive = false
    conversation.isActive = false;
    await conversation.save();

    res.json({
      success: true,
      message: 'Đã xóa cuộc hội thoại'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa cuộc hội thoại'
    });
  }
};

/**
 * @desc    Lấy tổng số tin nhắn chưa đọc
 * @route   GET /api/chat/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countUnread(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số tin nhắn chưa đọc'
    });
  }
};

/**
 * @desc    Tìm kiếm conversations
 * @route   GET /api/chat/search
 * @access  Private
 */
exports.searchConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ khóa tìm kiếm'
      });
    }

    // Tìm users theo tên hoặc email
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: userId }
    }).select('name email avatar').limit(10);

    // Tìm conversations với các users này
    const conversations = await Conversation.find({
      participants: { $in: [userId, ...users.map(u => u._id)] },
      isActive: true
    })
      .populate('participants', 'name avatar email')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      data: {
        users,
        conversations
      }
    });
  } catch (error) {
    console.error('Error searching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm kiếm'
    });
  }
};
