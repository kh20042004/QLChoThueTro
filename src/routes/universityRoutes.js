/**
 * ===================================
 * UNIVERSITIES ROUTES
 * API endpoints cho trường đại học
 * ===================================
 */

const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

/**
 * PUBLIC ROUTES
 */

// Lấy danh sách tất cả trường (có lọc, tìm kiếm)
router.get('/', universityController.getAllUniversities);

// Lấy danh sách quận
router.get('/districts/list', universityController.getDistricts);

// Lấy danh sách ngành học
router.get('/specialties/list', universityController.getSpecialties);

// Lấy trường gần nhất theo tọa độ
router.get('/nearby', universityController.getNearbyUniversities);

// Lấy thông tin chi tiết trường
router.get('/:id', universityController.getUniversityById);

/**
 * ADMIN ROUTES
 */

// Tạo trường mới
router.post('/', authenticate, authorizeAdmin, universityController.createUniversity);

// Cập nhật trường
router.put('/:id', authenticate, authorizeAdmin, universityController.updateUniversity);

// Xóa trường
router.delete('/:id', authenticate, authorizeAdmin, universityController.deleteUniversity);

// Kích hoạt/Vô hiệu hóa trường
router.patch('/:id/status', authenticate, authorizeAdmin, universityController.toggleUniversityStatus);

module.exports = router;
