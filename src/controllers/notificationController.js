/**
 * ===================================
 * NOTIFICATION CONTROLLER
 * Xử lý API endpoints cho thông báo
 * ===================================
 */

const { Notification } = require('../models');

/**
 * @desc    Lấy danh sách notifications của user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, filter = 'all' } = req.query;

    const query = { user: userId };
    
    // Filter by read status
    if (filter === 'unread') {
      query.isRead = false;
    } else if (filter === 'read') {
      query.isRead = true;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Notification.countDocuments(query)
    ]);

    // Add timeAgo to each notification
    const now = new Date();
    notifications.forEach(notif => {
      const diff = now - notif.createdAt;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) notif.timeAgo = 'Vừa xong';
      else if (minutes < 60) notif.timeAgo = `${minutes} phút trước`;
      else if (hours < 24) notif.timeAgo = `${hours} giờ trước`;
      else if (days < 7) notif.timeAgo = `${days} ngày trước`;
      else notif.timeAgo = notif.createdAt.toLocaleDateString('vi-VN');
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thông báo'
    });
  }
};

/**
 * @desc    Lấy số lượng notifications chưa đọc
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số thông báo chưa đọc'
    });
  }
};

/**
 * @desc    Lấy chi tiết một notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      user: userId
    }).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Add timeAgo
    const now = new Date();
    const diff = now - notification.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) notification.timeAgo = 'Vừa xong';
    else if (minutes < 60) notification.timeAgo = `${minutes} phút trước`;
    else if (hours < 24) notification.timeAgo = `${hours} giờ trước`;
    else if (days < 7) notification.timeAgo = `${days} ngày trước`;
    else notification.timeAgo = notification.createdAt.toLocaleDateString('vi-VN');

    res.json(notification);
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy chi tiết thông báo'
    });
  }
};

/**
 * @desc    Đánh dấu notification đã đọc
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu đã đọc'
    });
  }
};

/**
 * @desc    Đánh dấu nhiều notifications đã đọc
 * @route   PUT /api/notifications/read-multiple
 * @access  Private
 */
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user._id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID không hợp lệ'
      });
    }

    const result = await Notification.markAsRead(userId, ids);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu đã đọc'
    });
  }
};

/**
 * @desc    Đánh dấu tất cả notifications đã đọc
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu tất cả đã đọc'
    });
  }
};

/**
 * @desc    Xóa notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo'
    });
  }
};

/**
 * @desc    Xóa notification theo reviewId (cho admin cleanup)
 * @route   DELETE /api/notifications/by-review/:reviewId
 * @access  Private
 */
exports.deleteByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Delete all notifications related to this review
    const result = await Notification.deleteMany({
      'data.reviewId': reviewId
    });

    console.log(`🗑️ Deleted ${result.deletedCount} notification(s) for review ${reviewId}`);

    res.json({
      success: true,
      message: 'Đã xóa thông báo liên quan',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting notifications by reviewId:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo'
    });
  }
};

/**
 * @desc    Xóa tất cả notifications
 * @route   DELETE /api/notifications/all
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.deleteMany({ user: userId });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa tất cả thông báo'
    });
  }
};

/**
 * @desc    Tạo notification mới (Helper function - for internal use)
 * @param   {Object} data - Notification data
 * @returns {Promise<Notification>}
 */
exports.createNotification = async (data) => {
  try {
    return await Notification.createNotification(data);
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
