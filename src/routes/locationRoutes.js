/**
 * ===================================
 * LOCATION ROUTES
 * API endpoints cho Tỉnh thành - Quận huyện - Phường xã
 * ===================================
 */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

/**
 * PROVINCES - Tỉnh/Thành phố
 */

// Lấy tất cả tỉnh/thành phố
router.get('/provinces', locationController.getAllProvinces);

// Lấy chi tiết tỉnh/thành phố theo code (có quận/huyện và phường/xã nếu depth=2)
router.get('/provinces/:code', locationController.getProvinceByCode);

// Lấy danh sách quận/huyện theo tỉnh
router.get('/provinces/:provinceCode/districts', locationController.getDistrictsByProvince);

// Lấy tất cả phường/xã theo tỉnh
router.get('/provinces/:provinceCode/wards', locationController.getWardsByProvince);

/**
 * DISTRICTS - Quận/Huyện
 */

// Lấy tất cả quận/huyện
router.get('/districts', locationController.getAllDistricts);

// Lấy chi tiết quận/huyện theo code (có phường/xã nếu depth=2)
router.get('/districts/:code', locationController.getDistrictByCode);

// Lấy danh sách phường/xã theo quận/huyện
router.get('/districts/:districtCode/wards', locationController.getWardsByDistrict);

/**
 * WARDS - Phường/Xã
 */

// Lấy tất cả phường/xã
router.get('/wards', locationController.getAllWards);

// Lấy chi tiết phường/xã theo code
router.get('/wards/:code', locationController.getWardByCode);

/**
 * SEARCH - Tìm kiếm
 */

// Tìm kiếm địa điểm
// Query params: q (keyword), type (province/district/ward/all)
router.get('/search', locationController.searchLocation);

module.exports = router;
