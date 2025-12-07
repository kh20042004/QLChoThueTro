/**
 * ===================================
 * BOOKING ROUTES
 * Định tuyến cho bookings
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createBooking,
    getMyBookings,
    getBooking,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    getAllBookings
} = require('../controllers/bookingController');

/**
 * @desc    Lấy tất cả bookings
 * @route   GET /api/bookings
 * @access  Private
 */
router.get('/', protect, getMyBookings);

/**
 * @desc    Lấy tất cả bookings (Admin)
 * @route   GET /api/bookings/admin/all
 * @access  Private/Admin
 */
router.get('/admin/all', protect, authorize('admin'), getAllBookings);

/**
 * @desc    Tạo booking mới
 * @route   POST /api/bookings
 * @access  Private
 */
router.post('/', protect, createBooking);

/**
 * @desc    Lấy chi tiết booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
router.get('/:id', protect, getBooking);

/**
 * @desc    Cập nhật status booking (Admin)
 * @route   PUT /api/bookings/:id/status
 * @access  Private/Admin
 */
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);

/**
 * @desc    Cập nhật booking (cancel, update status)
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
router.put('/:id', protect, updateBooking);

/**
 * @desc    Xóa booking (Admin)
 * @route   DELETE /api/bookings/:id
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), deleteBooking);

/**
 * @desc    Xóa booking (Admin)
 * @route   DELETE /api/bookings/:id/delete
 * @access  Private/Admin
 */
router.delete('/:id/delete', protect, authorize('admin'), deleteBooking);

module.exports = router;
