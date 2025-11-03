/**
 * ===================================
 * NOTIFICATION MODEL
 * Schema cho thông báo người dùng
 * ===================================
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'booking_confirmed',      // Đơn đặt phòng được xác nhận
      'booking_rejected',       // Đơn đặt phòng bị từ chối
      'booking_cancelled',      // Đơn đặt phòng bị hủy
      'booking_new',           // Có đơn đặt phòng mới (cho landlord)
      'property_approved',     // Bài đăng được duyệt
      'property_rejected',     // Bài đăng bị từ chối
      'property_expiring',     // Bài đăng sắp hết hạn
      'property_expired',      // Bài đăng đã hết hạn
      'property_new_nearby',   // Có bài đăng mới gần khu vực yêu thích
      'review_new',           // Có đánh giá mới
      'message_new',          // Tin nhắn mới
      'payment_success',      // Thanh toán thành công
      'payment_failed',       // Thanh toán thất bại
      'system',              // Thông báo hệ thống
      'promotion'            // Khuyến mãi
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,  // URL để redirect khi click
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,  // Dữ liệu bổ sung (property ID, booking ID, etc.)
    default: {}
  },
  icon: {
    type: String,  // FontAwesome icon class
    default: 'fa-bell'
  },
  color: {
    type: String,  // Color for border/icon (blue, green, yellow, red, etc.)
    default: 'blue'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return this.createdAt.toLocaleDateString('vi-VN');
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    
    // Emit socket event if socket.io is available
    if (global.io) {
      global.io.to(`user:${data.user}`).emit('notification:new', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  try {
    const result = await this.updateMany(
      { 
        _id: { $in: notificationIds },
        user: userId
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { 
        user: userId,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({
      user: userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
