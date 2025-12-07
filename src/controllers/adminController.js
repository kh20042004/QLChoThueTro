/**
 * ===================================
 * ADMIN CONTROLLER
 * Xử lý các API cho admin panel
 * ===================================
 */

const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

/**
 * @desc    Lấy thống kê tổng quan cho dashboard
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Đếm tổng số users
    const totalUsers = await User.countDocuments();
    
    // Đếm tổng số properties
    const totalProperties = await Property.countDocuments();
    
    // Đếm tổng số bookings
    const totalBookings = await Booking.countDocuments();
    
    // Tính tổng doanh thu (từ các bookings đã hoàn thành)
    const revenueData = await Booking.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Tính phần trăm tăng trưởng (so với tháng trước)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usersLastMonth = await User.countDocuments({ 
      createdAt: { $lt: thisMonth } 
    });
    const usersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: thisMonth } 
    });
    const userGrowth = usersLastMonth > 0 
      ? ((usersThisMonth / usersLastMonth) * 100).toFixed(1) 
      : 0;

    const propertiesLastMonth = await Property.countDocuments({ 
      createdAt: { $lt: thisMonth } 
    });
    const propertiesThisMonth = await Property.countDocuments({ 
      createdAt: { $gte: thisMonth } 
    });
    const propertyGrowth = propertiesLastMonth > 0 
      ? ((propertiesThisMonth / propertiesLastMonth) * 100).toFixed(1) 
      : 0;

    const bookingsLastMonth = await Booking.countDocuments({ 
      createdAt: { $lt: thisMonth } 
    });
    const bookingsThisMonth = await Booking.countDocuments({ 
      createdAt: { $gte: thisMonth } 
    });
    const bookingGrowth = bookingsLastMonth > 0 
      ? ((bookingsThisMonth / bookingsLastMonth) * 100).toFixed(1) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          growth: userGrowth
        },
        properties: {
          total: totalProperties,
          growth: propertyGrowth
        },
        bookings: {
          total: totalBookings,
          growth: bookingGrowth
        },
        revenue: {
          total: totalRevenue,
          growth: 23 // Mock for now
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách properties mới nhất
 * @route   GET /api/admin/dashboard/recent-properties
 * @access  Private/Admin
 */
exports.getRecentProperties = async (req, res, next) => {
  try {
    const properties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('landlord', 'name email')
      .select('title price images status createdAt');

    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách users mới nhất
 * @route   GET /api/admin/dashboard/recent-users
 * @access  Private/Admin
 */
exports.getRecentUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role avatar createdAt');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy activity log
 * @route   GET /api/admin/dashboard/activities
 * @access  Private/Admin
 */
exports.getActivities = async (req, res, next) => {
  try {
    // Lấy các hoạt động gần đây (users mới, properties mới, bookings mới)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name createdAt');

    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('landlord', 'name')
      .select('title landlord createdAt');

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('tenant', 'name')
      .select('tenant createdAt');

    // Merge và sắp xếp theo thời gian
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        user: user.name,
        message: 'đã đăng ký tài khoản',
        time: user.createdAt,
        icon: 'user-plus',
        color: 'blue'
      });
    });

    recentProperties.forEach(property => {
      activities.push({
        type: 'property_posted',
        user: property.landlord?.name || 'Unknown',
        message: 'đã đăng tin mới',
        time: property.createdAt,
        icon: 'check',
        color: 'green'
      });
    });

    recentBookings.forEach(booking => {
      activities.push({
        type: 'booking_created',
        user: booking.tenant?.name || 'Unknown',
        message: 'đã đặt phòng',
        time: booking.createdAt,
        icon: 'calendar',
        color: 'orange'
      });
    });

    // Sắp xếp theo thời gian mới nhất
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 10) // Lấy 10 hoạt động mới nhất
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả properties
 * @route   GET /api/admin/properties
 * @access  Private/Admin
 */
exports.getProperties = async (req, res, next) => {
  try {
    const properties = await Property.find()
      .sort({ createdAt: -1 })
      .populate('landlord', 'name email');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duyệt property
 * @route   PUT /api/admin/properties/:id/approve
 * @access  Private/Admin
 */
exports.approveProperty = async (req, res, next) => {
  try {
    console.log('🔍 Approving property:', req.params.id);
    console.log('👤 Admin:', req.user.id);
    
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'available',
        moderationDecision: 'auto_approved', // ✅ FIX: Thêm moderationDecision để hiển thị trên trang công khai
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('landlord', 'name email');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bất động sản'
      });
    }

    console.log('✅ Property approved:', property._id);
    console.log(`   Status: ${property.status}`);
    console.log(`   ML Decision: ${property.moderationDecision}`);

    // Tạo thông báo cho chủ nhà
    if (property.landlord && property.landlord._id) {
      try {
        await Notification.create({
          user: property.landlord._id,
          type: 'property_approved',
          title: 'Bài đăng đã được duyệt',
          message: `Chúc mừng! Bài đăng "${property.title}" của bạn đã được admin phê duyệt và đang hiển thị công khai.`,
          link: `/properties/${property._id}`,
          relatedProperty: property._id
        });
        console.log(`📧 Sent approval notification to user ${property.landlord._id}`);
      } catch (notifError) {
        console.error('❌ Error creating approval notification:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Đã duyệt bất động sản thành công và gửi thông báo',
      data: property
    });
  } catch (error) {
    console.error('❌ Error approving property:', error);
    next(error);
  }
};

/**
 * @desc    Từ chối property
 * @route   PUT /api/admin/properties/:id/reject
 * @access  Private/Admin
 */
exports.rejectProperty = async (req, res, next) => {
  try {
    console.log('🔍 Rejecting property:', req.params.id);
    console.log('👤 Admin:', req.user.id);
    
    const { reason } = req.body;
    
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('landlord', 'name email');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bất động sản'
      });
    }

    console.log('❌ Property rejected:', property._id);

    // Tạo thông báo cho chủ nhà
    if (property.landlord && property.landlord._id) {
      try {
        const rejectReason = reason || 'Bài đăng không đạt tiêu chuẩn của hệ thống';
        await Notification.create({
          user: property.landlord._id,
          type: 'property_rejected',
          title: 'Bài đăng bị từ chối',
          message: `Bài đăng "${property.title}" của bạn đã bị admin từ chối. Lý do: ${rejectReason}. Vui lòng chỉnh sửa và đăng lại.`,
          link: `/my-properties`,
          relatedProperty: property._id
        });
        console.log(`📧 Sent rejection notification to user ${property.landlord._id}`);
      } catch (notifError) {
        console.error('❌ Error creating rejection notification:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Đã từ chối bất động sản và gửi thông báo',
      data: property
    });
  } catch (error) {
    console.error('❌ Error rejecting property:', error);
    next(error);
  }
};

/**
 * @desc    Xóa property
 * @route   DELETE /api/admin/properties/:id
 * @access  Private/Admin
 */
exports.deleteProperty = async (req, res, next) => {
  try {
    console.log('🔍 Deleting property:', req.params.id);
    
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bất động sản'
      });
    }

    console.log('✅ Property deleted:', property._id);

    res.status(200).json({
      success: true,
      message: 'Đã xóa bất động sản thành công',
      data: {}
    });
  } catch (error) {
    console.error('❌ Error deleting property:', error);
    next(error);
  }
};

/**
 * @desc    Xóa user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
/**
 * @desc    Cập nhật thông tin user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    
    // Tạo object chứa các trường cần update
    const updateData = {};
    if (role) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông báo cho admin
 * @route   GET /api/admin/notifications
 * @access  Private/Admin
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = [];

    // 1. Bài đăng mới chờ duyệt
    const pendingProperties = await Property.find({ status: 'pending' })
      .populate('landlord', 'name avatar')
      .sort('-createdAt')
      .limit(10)
      .select('title createdAt landlord');

    pendingProperties.forEach(property => {
      notifications.push({
        id: `property-${property._id}`,
        type: 'pending_property',
        title: 'Bài đăng mới chờ duyệt',
        message: `${property.landlord?.name || 'User'} đã đăng: ${property.title}`,
        link: `/admin/properties`,
        avatar: property.landlord?.avatar || 'https://aic.com.vn/avatar-fb-mac-dinh/',
        time: property.createdAt,
        isRead: false
      });
    });

    // 2. Booking mới
    const recentBookings = await Booking.find({ status: 'pending' })
      .populate('tenant', 'name avatar')
      .populate('property', 'title')
      .sort('-createdAt')
      .limit(5)
      .select('tenant property createdAt');

    recentBookings.forEach(booking => {
      notifications.push({
        id: `booking-${booking._id}`,
        type: 'new_booking',
        title: 'Booking mới',
        message: `${booking.tenant?.name || 'User'} đã đặt: ${booking.property?.title}`,
        link: `/admin/bookings`,
        avatar: booking.tenant?.avatar || 'https://aic.com.vn/avatar-fb-mac-dinh/',
        time: booking.createdAt,
        isRead: false
      });
    });

    // 3. Review mới
    const recentReviews = await Review.find()
      .populate('user', 'name avatar')
      .populate('property', 'title')
      .sort('-createdAt')
      .limit(5)
      .select('user property rating createdAt');

    recentReviews.forEach(review => {
      notifications.push({
        id: `review-${review._id}`,
        type: 'new_review',
        title: 'Đánh giá mới',
        message: `${review.user?.name || 'User'} đã đánh giá ${review.rating}⭐: ${review.property?.title}`,
        link: `/admin/reviews`,
        avatar: review.user?.avatar || 'https://aic.com.vn/avatar-fb-mac-dinh/',
        time: review.createdAt,
        isRead: false
      });
    });

    // Sắp xếp theo thời gian mới nhất
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Giới hạn tổng số thông báo
    const limitedNotifications = notifications.slice(0, 20);

    res.status(200).json({
      success: true,
      count: limitedNotifications.length,
      unreadCount: limitedNotifications.filter(n => !n.isRead).length,
      data: limitedNotifications
    });
  } catch (error) {
    next(error);
  }
};

