/**
 * ===================================
 * CONVERSATION MODEL - Mongoose
 * Model cuộc hội thoại giữa users
 * ===================================
 */

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null // Nếu chat về một property cụ thể
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map() // Key: userId, Value: số tin nhắn chưa đọc
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageTime: -1 });
ConversationSchema.index({ propertyId: 1 });

// Virtual để lấy messages
ConversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation'
});

// Method: Lấy cuộc hội thoại giữa 2 users
ConversationSchema.statics.findBetweenUsers = async function(userId1, userId2, propertyId = null) {
  const query = {
    participants: { $all: [userId1, userId2] },
    $expr: { $eq: [{ $size: "$participants" }, 2] }
  };
  
  if (propertyId) {
    query.propertyId = propertyId;
  }
  
  return this.findOne(query);
};

// Method: Cập nhật số tin nhắn chưa đọc
ConversationSchema.methods.incrementUnreadCount = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method: Reset số tin nhắn chưa đọc
ConversationSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Method: Lấy số tin nhắn chưa đọc của user
ConversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

module.exports = mongoose.model('Conversation', ConversationSchema);
