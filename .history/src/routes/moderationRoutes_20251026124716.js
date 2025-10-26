/**
 * ===================================
 * MODERATION ROUTES
 * Định tuyến cho kiểm duyệt với AI
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const moderationController = require('../controllers/moderationController');

/**
 * @desc    Phân tích nhiều ảnh
 * @route   POST /api/moderation/analyze-images
 * @access  Private (Landlord, Admin)
 */
router.post('/analyze-images', protect, moderationController.analyzePropertyImages);

/**
 * @desc    Đánh giá bài đăng trước khi submit
 * @route   POST /api/moderation/evaluate
 * @access  Private (Landlord)
 */
router.post('/evaluate', protect, moderationController.evaluatePropertyListing);

/**
 * @desc    So sánh tiện nghi user input vs AI detect
 * @route   POST /api/moderation/compare-amenities
 * @access  Private
 */
router.post('/compare-amenities', protect, moderationController.compareAmenities);

/**
 * @desc    Phân tích 1 ảnh đơn
 * @route   POST /api/moderation/analyze-single-image
 * @access  Private
 */
router.post('/analyze-single-image', protect, moderationController.analyzeSingleImage);

/**
 * @desc    Lấy danh sách bài đăng chờ duyệt
 * @route   GET /api/moderation/pending
 * @access  Private (Admin only)
 */
router.get('/pending', protect, authorize('admin'), moderationController.getPendingProperties);

/**
 * @desc    Kiểm duyệt bài đăng
 * @route   POST /api/moderation/review/:propertyId
 * @access  Private (Admin only)
 */
router.post('/review/:propertyId', protect, authorize('admin'), moderationController.reviewProperty);

module.exports = router;
