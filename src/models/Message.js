/**
 * ===================================
 * MESSAGE MODEL - Mongoose
 * Model tin nhắn chat
 * ===================================
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'property'],
    default: 'text'
  },
  attachments: [{
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ['image', 'file']
    },
    filename: String,
    size: Number
  }],
  propertyReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

// Method: Đánh dấu tin nhắn đã đọc
MessageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method: Đánh dấu tất cả tin nhắn trong conversation đã đọc
MessageSchema.statics.markAllAsRead = function(conversationId, userId) {
  return this.updateMany(
    {
      conversation: conversationId,
      receiver: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method: Đếm tin nhắn chưa đọc
MessageSchema.statics.countUnread = function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false
  });
};

// Method: Xóa tin nhắn cho user cụ thể (soft delete)
MessageSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
    
    // Nếu cả 2 users đều xóa, đánh dấu isDeleted
    if (this.deletedBy.length >= 2) {
      this.isDeleted = true;
    }
    
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Message', MessageSchema);
