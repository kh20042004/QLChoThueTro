/**
 * ===================================
 * REVIEW ROUTES
 * Định tuyến cho reviews/đánh giá
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { 
  canReview,
  getPropertyReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getAllReviews,
  moderateReviewStatus,
  adminDeleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/property/:propertyId', getPropertyReviews);

// Protected routes
router.get('/can-review/:propertyId', protect, canReview);
router.get('/my-reviews', protect, getMyReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllReviews);
router.put('/:id/moderate', protect, authorize('admin'), moderateReviewStatus);
router.delete('/:id/admin-delete', protect, authorize('admin'), adminDeleteReview);

module.exports = router;
