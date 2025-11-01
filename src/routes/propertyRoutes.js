/**
 * ===================================
 * PROPERTY ROUTES
 * Định tuyến cho properties
 * ===================================
 */

const express = require('express');
const router = express.Router();
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertiesInRadius,
  getMyProperties
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getProperties);
router.get('/radius/:zipcode/:distance', getPropertiesInRadius);

// Protected routes - User, landlord và admin
router.get('/my-properties', protect, getMyProperties); // Route riêng cho my-properties (phải đặt trước /:id)
router.post('/', protect, authorize('user', 'landlord', 'admin'), upload.array('images', 10), createProperty);
router.put('/:id', protect, authorize('user', 'landlord', 'admin'), upload.array('images', 10), updateProperty);
router.delete('/:id', protect, authorize('user', 'landlord', 'admin'), deleteProperty);

// Get single property (phải đặt cuối cùng để không conflict với các route khác)
router.get('/:id', getProperty);

module.exports = router;
