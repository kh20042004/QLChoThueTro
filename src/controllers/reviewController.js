/**
 * ===================================
 * REVIEW CONTROLLER
 * Xử lý đánh giá với xác thực booking
 * ===================================
 */

const Review = require('../models/Review');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { moderateReview } = require('../services/reviewModerationService');

/**
 * @desc    Kiểm tra quyền review của user
 * @route   GET /api/reviews/can-review/:propertyId
 * @access  Private
 */
exports.canReview = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const userId = req.user.id;

    // Kiểm tra property có tồn tại không
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra user đã review chưa
    const existingReview = await Review.findOne({
      property: propertyId,
      user: userId
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'Bạn đã đánh giá phòng này rồi',
        existingReview: existingReview
      });
    }

    // Tìm booking phù hợp
    const booking = await Booking.findOne({
      tenant: userId,
      property: propertyId,
      status: { $in: ['confirmed', 'completed'] }
    }).sort({ createdAt: -1 }); // Lấy booking mới nhất

    if (!booking) {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'Bạn chưa đặt lịch xem hoặc thuê phòng này'
      });
    }

    const now = new Date();
    let reviewType = null;
    let message = '';

    // Trường hợp 1: Đã xem phòng
    if (booking.viewingDate && new Date(booking.viewingDate) < now) {
      reviewType = 'viewing';
      message = 'Bạn có thể đánh giá sau khi đã xem phòng';
    }
    // Trường hợp 2: Đã thuê ít nhất 7 ngày
    else if (booking.startDate && new Date(booking.startDate) < now) {
      const daysRented = (now - new Date(booking.startDate)) / (1000 * 60 * 60 * 24);
      
      if (daysRented >= 7) {
        reviewType = 'rented';
        message = 'Bạn có thể đánh giá sau khi đã thuê ít nhất 7 ngày';
      } else {
        return res.status(200).json({
          success: true,
          canReview: false,
          reason: `Vui lòng đợi thêm ${Math.ceil(7 - daysRented)} ngày nữa để đánh giá`
        });
      }
    }
    // Chưa đến ngày xem phòng hoặc thuê
    else {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'Vui lòng đợi sau khi xem phòng hoặc bắt đầu thuê'
      });
    }

    res.status(200).json({
      success: true,
      canReview: true,
      reviewType: reviewType,
      bookingId: booking._id,
      message: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tất cả reviews của 1 property
 * @route   GET /api/reviews/property/:propertyId
 * @access  Public
 */
exports.getPropertyReviews = async (req, res, next) => {
  try {
    // Chỉ lấy reviews đã được approved (public)
    const reviews = await Review.find({ 
      property: req.params.propertyId,
      moderationStatus: 'approved'
    })
      .populate('user', 'name avatar')
      .populate('booking', 'viewingDate startDate endDate')
      .sort('-createdAt');

    // Thống kê
    const stats = {
      total: reviews.length,
      rented: reviews.filter(r => r.reviewType === 'rented').length,
      viewing: reviews.filter(r => r.reviewType === 'viewing').length,
      averageRating: reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0
    };

    res.status(200).json({
      success: true,
      count: reviews.length,
      stats: stats,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo review mới
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = async (req, res, next) => {
  try {
    const { property, rating, title, comment, bookingId, reviewType } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!property || !rating || !title || !comment || !bookingId || !reviewType) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Kiểm tra property có tồn tại không
    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra user đã review chưa
    const existingReview = await Review.findOne({
      property: property,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã đánh giá phòng này rồi'
      });
    }

    // Kiểm tra booking hợp lệ
    const booking = await Booking.findOne({
      _id: bookingId,
      tenant: userId,
      property: property,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error: 'Booking không hợp lệ hoặc chưa được xác nhận'
      });
    }

    // Kiểm tra điều kiện thời gian
    const now = new Date();
    if (reviewType === 'viewing') {
      if (!booking.viewingDate || new Date(booking.viewingDate) >= now) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chưa xem phòng hoặc chưa đến ngày xem phòng'
        });
      }
    } else if (reviewType === 'rented') {
      if (!booking.startDate || new Date(booking.startDate) >= now) {
        return res.status(403).json({
          success: false,
          error: 'Bạn chưa bắt đầu thuê phòng'
        });
      }
      
      const daysRented = (now - new Date(booking.startDate)) / (1000 * 60 * 60 * 24);
      if (daysRented < 7) {
        return res.status(403).json({
          success: false,
          error: 'Vui lòng đợi ít nhất 7 ngày sau khi thuê để đánh giá'
        });
      }
    }

    // Tạo review với verified = true
    // Lấy lịch sử reviews của user
    const userReviewHistory = await Review.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approvedReviews: { 
            $sum: { $cond: [{ $eq: ['$moderationStatus', 'approved'] }, 1, 0] } 
          },
          rejectedReviews: { 
            $sum: { $cond: [{ $eq: ['$moderationStatus', 'rejected'] }, 1, 0] } 
          }
        }
      }
    ]);

    const userHistory = userReviewHistory[0] || { 
      totalReviews: 0, 
      approvedReviews: 0, 
      rejectedReviews: 0 
    };

    // Chạy auto moderation
    const moderationResult = await moderateReview({
      rating,
      comment,
      title,
      reviewType,
      verified: true
    }, userHistory);

    const review = await Review.create({
      property: property,
      user: userId,
      rating: rating,
      title: title,
      comment: comment,
      reviewType: reviewType,
      booking: bookingId,
      verified: true,
      // Moderation fields
      moderationStatus: moderationResult.status,
      trustScore: moderationResult.trustScore,
      autoApproved: moderationResult.autoApproved,
      autoRejected: moderationResult.autoRejected,
      moderationReason: moderationResult.moderationReason,
      moderationDetails: moderationResult.moderationDetails,
      moderatedAt: moderationResult.moderatedAt
    });

    // Populate thông tin
    await review.populate('user', 'name avatar');
    await review.populate('booking', 'viewingDate startDate endDate');
    await review.populate('property', 'title');

    // AUTO-DELETE: Nếu Trust Score < 40, xóa luôn review
    if (moderationResult.trustScore < 40) {
      console.log(`🗑️ AUTO-DELETE: Review ${review._id} has trust score ${moderationResult.trustScore} < 40`);
      
      // Tạo notification thông báo bị từ chối
      await Notification.create({
        user: userId,
        type: 'review_rejected',
        title: 'Đánh giá bị từ chối',
        message: `Đánh giá của bạn cho "${propertyDoc.title}" đã bị từ chối tự động. Lý do: Điểm tin cậy quá thấp (${moderationResult.trustScore}/100). ${moderationResult.moderationReason}`,
        link: '/my-reviews',
        icon: 'fa-exclamation-triangle',
        color: 'red',
        data: {
          reviewId: review._id,
          propertyId: property,
          propertyTitle: propertyDoc.title,
          trustScore: moderationResult.trustScore,
          reason: moderationResult.moderationReason,
          autoDeleted: true
        }
      });

      // Xóa review
      await Review.findByIdAndDelete(review._id);
      
      return res.status(400).json({
        success: false,
        error: `Đánh giá của bạn không đạt tiêu chuẩn (Điểm tin cậy: ${moderationResult.trustScore}/100). Lý do: ${moderationResult.moderationReason}`,
        trustScore: moderationResult.trustScore,
        autoDeleted: true
      });
    }

    // Tạo notification cho user nếu bị reject (nhưng không tự động xóa)
    if (moderationResult.autoRejected) {
      await Notification.create({
        user: userId,
        type: 'review_rejected',
        title: 'Đánh giá bị từ chối',
        message: `Đánh giá của bạn cho "${propertyDoc.title}" đã bị từ chối. Lý do: ${moderationResult.moderationReason}`,
        link: '/my-reviews',
        icon: 'fa-exclamation-triangle',
        color: 'red',
        data: {
          reviewId: review._id,
          propertyId: property,
          propertyTitle: propertyDoc.title,
          trustScore: moderationResult.trustScore,
          reason: moderationResult.moderationReason
        }
      });
    }
    // Notification khi pending (chờ duyệt)
    else if (moderationResult.status === 'pending') {
      await Notification.create({
        user: userId,
        type: 'review_pending',
        title: 'Đánh giá đang chờ kiểm duyệt',
        message: `Đánh giá của bạn cho "${propertyDoc.title}" đang được kiểm duyệt bởi quản trị viên.`,
        link: '/my-reviews',
        icon: 'fa-clock',
        color: 'yellow',
        data: {
          reviewId: review._id,
          propertyId: property,
          propertyTitle: propertyDoc.title,
          trustScore: moderationResult.trustScore
        }
      });
    }
    // Notification khi auto approved
    else if (moderationResult.autoApproved) {
      await Notification.create({
        user: userId,
        type: 'review_approved',
        title: 'Đánh giá đã được phê duyệt',
        message: `Đánh giá của bạn cho "${propertyDoc.title}" đã được tự động phê duyệt và hiển thị công khai.`,
        link: `/property/${property}`,
        icon: 'fa-check-circle',
        color: 'green',
        data: {
          reviewId: review._id,
          propertyId: property,
          propertyTitle: propertyDoc.title,
          trustScore: moderationResult.trustScore
        }
      });

      // Thông báo cho chủ nhà về review mới
      try {
        if (propertyDoc.landlord) {
          await Notification.create({
            user: propertyDoc.landlord,
            type: 'review_new',
            title: 'Có đánh giá mới',
            message: `Bài đăng "${propertyDoc.title}" của bạn vừa nhận được đánh giá ${review.rating}⭐ từ ${req.user.name}`,
            link: `/properties/${property}#reviews`,
            icon: 'fa-star',
            color: review.rating >= 4 ? 'green' : (review.rating >= 3 ? 'yellow' : 'orange'),
            data: {
              reviewId: review._id,
              propertyId: property,
              propertyTitle: propertyDoc.title,
              rating: review.rating,
              reviewerName: req.user.name
            }
          });
        }
      } catch (notifError) {
        console.error('❌ Error creating landlord review notification:', notifError);
      }
    }

    // Thông báo kết quả moderation
    let message = 'Đánh giá của bạn đã được gửi thành công';
    if (moderationResult.autoApproved) {
      message = '✅ Đánh giá của bạn đã được tự động phê duyệt và hiển thị công khai';
    } else if (moderationResult.autoRejected) {
      message = `❌ Đánh giá của bạn đã bị từ chối. Lý do: ${moderationResult.moderationReason}`;
    } else {
      message = '⏳ Đánh giá của bạn đang chờ kiểm duyệt và sẽ được hiển thị sau khi được phê duyệt';
    }

    res.status(201).json({
      success: true,
      message: message,
      data: review,
      moderation: {
        status: moderationResult.status,
        trustScore: moderationResult.trustScore,
        reason: moderationResult.moderationReason
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật review
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner)
 */
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền cập nhật đánh giá này'
      });
    }

    // Chỉ cho phép update rating, title, comment
    const { rating, title, comment } = req.body;
    review = await Review.findByIdAndUpdate(
      req.params.id, 
      { rating, title, comment },
      { new: true, runValidators: true }
    ).populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật đánh giá',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Owner, Admin)
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xóa đánh giá này'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa đánh giá',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy reviews của user hiện tại
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('property', 'title images address')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// =======================================
// ADMIN MODERATION FUNCTIONS
// =======================================

/**
 * @desc    Lấy tất cả reviews (Admin)
 * @route   GET /api/reviews/admin/all
 * @access  Private/Admin
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, property } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.moderationStatus = status;
    if (property) filter.property = property;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get reviews
    let query = Review.find(filter)
      .populate('user', 'name email avatar')
      .populate('property', 'title address images')
      .populate('booking', 'viewingDate startDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    let reviews = await query;
    
    // Search filter (if provided)
    if (search) {
      reviews = reviews.filter(review => {
        const searchLower = search.toLowerCase();
        return (
          review.title?.toLowerCase().includes(searchLower) ||
          review.comment?.toLowerCase().includes(searchLower) ||
          review.user?.name?.toLowerCase().includes(searchLower) ||
          review.property?.title?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Get total count
    const total = await Review.countDocuments(filter);
    
    // Get stats
    const stats = {
      total: await Review.countDocuments(),
      pending: await Review.countDocuments({ moderationStatus: 'pending' }),
      approved: await Review.countDocuments({ moderationStatus: 'approved' }),
      rejected: await Review.countDocuments({ moderationStatus: 'rejected' }),
      autoApproved: await Review.countDocuments({ autoApproved: true }),
      autoRejected: await Review.countDocuments({ autoRejected: true })
    };
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách reviews'
    });
  }
};

/**
 * @desc    Cập nhật trạng thái moderation (Admin)
 * @route   PUT /api/reviews/:id/moderate
 * @access  Private/Admin
 */
exports.moderateReviewStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }
    
    review.moderationStatus = status;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    
    if (reason) {
      review.moderationReason = reason;
    }
    
    await review.save();
    
    await review.populate('user', 'name email');
    await review.populate('property', 'title');
    
    // Tạo notification cho user
    if (status === 'approved') {
      await Notification.create({
        user: review.user._id,
        type: 'review_approved',
        title: 'Đánh giá đã được phê duyệt',
        message: `Đánh giá của bạn cho "${review.property.title}" đã được quản trị viên phê duyệt và hiển thị công khai.`,
        link: `/property/${review.property._id}`,
        icon: 'fa-check-circle',
        color: 'green',
        data: {
          reviewId: review._id,
          propertyId: review.property._id,
          propertyTitle: review.property.title
        }
      });

      // Thông báo cho chủ nhà về review được duyệt
      try {
        const property = await require('../models/Property').findById(review.property._id).select('landlord title');
        if (property && property.landlord) {
          await Notification.create({
            user: property.landlord,
            type: 'review_new',
            title: 'Có đánh giá mới',
            message: `Bài đăng "${property.title}" của bạn vừa nhận được đánh giá ${review.rating}⭐ từ ${review.user.name}`,
            link: `/properties/${property._id}#reviews`,
            icon: 'fa-star',
            color: review.rating >= 4 ? 'green' : (review.rating >= 3 ? 'yellow' : 'orange'),
            data: {
              reviewId: review._id,
              propertyId: property._id,
              propertyTitle: property.title,
              rating: review.rating,
              reviewerName: review.user.name
            }
          });
        }
      } catch (notifError) {
        console.error('❌ Error creating landlord review notification:', notifError);
      }
    } else if (status === 'rejected') {
      await Notification.create({
        user: review.user._id,
        type: 'review_rejected',
        title: 'Đánh giá bị từ chối',
        message: `Đánh giá của bạn cho "${review.property.title}" đã bị quản trị viên từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
        link: '/my-reviews',
        icon: 'fa-times-circle',
        color: 'red',
        data: {
          reviewId: review._id,
          propertyId: review.property._id,
          propertyTitle: review.property.title,
          reason: reason
        }
      });
    }
    
    res.json({
      success: true,
      message: `Review đã ${status === 'approved' ? 'được phê duyệt' : status === 'rejected' ? 'bị từ chối' : 'chuyển về chờ duyệt'}`,
      data: review
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm duyệt review'
    });
  }
};

/**
 * @desc    Xóa review (Admin)
 * @route   DELETE /api/reviews/:id/admin-delete
 * @access  Private/Admin
 */
exports.adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy review'
      });
    }
    
    await review.deleteOne();
    
    res.json({
      success: true,
      message: 'Đã xóa review'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa review'
    });
  }
};
