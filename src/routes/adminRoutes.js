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
  updateUser,
  getProperties,
  approveProperty,
  rejectProperty,
  deleteProperty,
  deleteUser,
  getNotifications,
  getContacts,
  getContactById,
  updateContactStatus,
  assignContact,
  updateContactPriority,
  deleteContact,
  getContactStatistics
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
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Property management routes
router.get('/properties', getProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteProperty);

// Notification routes
router.get('/notifications', getNotifications);

// Contact management routes
router.get('/contacts/statistics', getContactStatistics);
router.get('/contacts', getContacts);
router.get('/contacts/:id', getContactById);
router.put('/contacts/:id/status', updateContactStatus);
router.put('/contacts/:id/assign', assignContact);
router.put('/contacts/:id/priority', updateContactPriority);
router.delete('/contacts/:id', deleteContact);

module.exports = router;
