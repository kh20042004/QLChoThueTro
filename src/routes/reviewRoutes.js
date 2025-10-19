/**
 * ===================================
 * REVIEW ROUTES
 * Định tuyến cho reviews/đánh giá
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @desc    Lấy tất cả reviews hoặc reviews của 1 property
 * @route   GET /api/reviews
 * @route   GET /api/reviews?property=:propertyId
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    
    let query;
    if (req.query.property) {
      query = Review.find({ property: req.query.property });
    } else {
      query = Review.find();
    }

    const reviews = await query
      .populate('user', 'name avatar')
      .populate('property', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Tạo review mới
 * @route   POST /api/reviews
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const Property = require('../models/Property');

    // Thêm user vào body
    req.body.user = req.user.id;

    // Kiểm tra property có tồn tại không
    const property = await Property.findById(req.body.property);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra user đã review chưa
    const existingReview = await Review.findOne({
      property: req.body.property,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã đánh giá phòng này rồi'
      });
    }

    const review = await Review.create(req.body);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Cập nhật review
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner)
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
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

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Xóa review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Owner, Admin)
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const Review = require('../models/Review');
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

    await review.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
