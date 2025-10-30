/**
 * ===================================
 * FAVORITE ROUTES
 * Định tuyến cho chức năng yêu thích
 * ===================================
 */

const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  checkFavorite,
  getFavorites,
  clearFavorites
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// Tất cả routes yêu cầu xác thực
router.use(protect);

// Get danh sách yêu thích
router.get('/', getFavorites);

// Thêm vào yêu thích
router.post('/:propertyId', addFavorite);

// Xóa khỏi yêu thích
router.delete('/:propertyId', removeFavorite);

// Kiểm tra yêu thích
router.get('/check/:propertyId', checkFavorite);

// Xóa tất cả yêu thích
router.delete('/', clearFavorites);

module.exports = router;
