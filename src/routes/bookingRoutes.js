/**
 * ===================================
 * BOOKING ROUTES
 * Định tuyến cho bookings
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

/**
 * @desc    Lấy tất cả bookings
 * @route   GET /api/bookings
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    let query;

    // Nếu là admin thì lấy tất cả
    if (req.user.role === 'admin') {
      query = Booking.find();
    }
    // Nếu là landlord thì lấy booking của phòng mình
    else if (req.user.role === 'landlord') {
      query = Booking.find({ landlord: req.user.id });
    }
    // User thường chỉ lấy booking của mình
    else {
      query = Booking.find({ tenant: req.user.id });
    }

    const bookings = await query
      .populate('property', 'title price address images')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Tạo booking mới
 * @route   POST /api/bookings
 * @access  Private
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    const Property = require('../models/Property');

    // Thêm tenant ID
    req.body.tenant = req.user.id;

    // Lấy thông tin property để lấy landlord
    const property = await Property.findById(req.body.property);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng'
      });
    }

    // Thêm landlord
    req.body.landlord = property.landlord;
    
    // Nếu không có startDate/endDate, đây là viewing appointment
    if (!req.body.startDate && !req.body.endDate) {
      // Chỉ cần viewingDate và viewingTime
      req.body.status = 'pending';
    } else {
      // Booking thuê dài hạn
      req.body.monthlyRent = property.price;
      req.body.deposit = property.deposit || property.price;
    }

    const booking = await Booking.create(req.body);
    
    // Populate để trả về thông tin đầy đủ
    const populatedBooking = await Booking.findById(booking._id)
      .populate('property', 'title price address images')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Đặt lịch xem phòng thành công',
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Cập nhật booking
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy booking'
      });
    }

    // Chỉ landlord hoặc admin mới được cập nhật
    if (booking.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền cập nhật booking này'
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
