/**
 * ===================================
 * CONTACT ROUTES
 * API routes cho liên hệ
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { createContact } = require('../controllers/contactController');

/**
 * @route   POST /api/contacts
 * @desc    Tạo liên hệ mới
 * @access  Public
 */
router.post('/', createContact);

module.exports = router;
