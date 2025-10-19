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
  getPropertiesInRadius
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProperties);
router.get('/:id', getProperty);
router.get('/radius/:zipcode/:distance', getPropertiesInRadius);

// Protected routes - Chỉ landlord và admin
router.post('/', protect, authorize('landlord', 'admin'), createProperty);
router.put('/:id', protect, authorize('landlord', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('landlord', 'admin'), deleteProperty);

module.exports = router;
