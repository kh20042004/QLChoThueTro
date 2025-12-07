/**
 * ===================================
 * MODERATION ROUTES (Admin)
 * Quản lý bài đăng pending review
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Property = require('../models/Property');

/**
 * @desc    Lấy danh sách bài đăng pending review
 * @route   GET /api/moderation/pending
 * @access  Private/Admin
 */
router.get('/pending', protect, authorize('admin'), async (req, res, next) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 })
      .select('title price area address moderationScore moderationReasons predictedPrice createdAt');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Lấy thống kê moderation
 * @route   GET /api/moderation/stats
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const total = await Property.countDocuments({});
    const autoApproved = await Property.countDocuments({ 
      status: 'available',
      moderationScore: { $gte: 0.85 }
    });
    const pendingReview = await Property.countDocuments({ status: 'pending' });
    const rejected = await Property.countDocuments({ status: 'inactive' });

    // Average moderation score
    const avgScoreResult = await Property.aggregate([
      { $match: { moderationScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$moderationScore' } } }
    ]);
    const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        autoApproved,
        pendingReview,
        rejected,
        avgScore: avgScore.toFixed(3),
        autoApprovalRate: total > 0 ? ((autoApproved / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Manually approve một property
 * @route   PUT /api/moderation/:id/approve
 * @access  Private/Admin
 */
router.put('/:id/approve', protect, authorize('admin'), async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'available',
        moderatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài đăng'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã duyệt bài đăng',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Manually reject một property
 * @route   PUT /api/moderation/:id/reject
 * @access  Private/Admin
 */
router.put('/:id/reject', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'inactive',
        moderatedAt: Date.now(),
        $push: { moderationReasons: reason || 'Từ chối bởi admin' }
      },
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài đăng'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã từ chối bài đăng',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
