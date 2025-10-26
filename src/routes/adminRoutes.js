/**
 * ===================================
 * ADMIN ROUTES
 * API routes cho admin panel
 * ===================================
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentProperties,
  getRecentUsers,
  getActivities,
  getUsers,
  getProperties,
  approveProperty,
  rejectProperty,
  deleteProperty,
  deleteUser
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu đăng nhập và quyền admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-properties', getRecentProperties);
router.get('/dashboard/recent-users', getRecentUsers);
router.get('/dashboard/activities', getActivities);

// User management routes
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Property management routes
router.get('/properties', getProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteProperty);

module.exports = router;
