/**
 * ===================================
 * LOCATION CONTROLLER
 * Xử lý API Tỉnh thành - Quận huyện - Phường xã
 * ===================================
 */

const locationService = require('../services/locationService');

/**
 * Lấy tất cả tỉnh/thành phố
 * GET /api/locations/provinces
 */
exports.getAllProvinces = async (req, res) => {
    try {
        const provinces = await locationService.getAllProvinces();
        
        res.json({
            success: true,
            data: provinces,
            count: provinces.length
        });
    } catch (error) {
        console.error('Error in getAllProvinces:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách tỉnh thành'
        });
    }
};

/**
 * Lấy chi tiết tỉnh/thành phố (có thể bao gồm quận/huyện và phường/xã)
 * GET /api/locations/provinces/:code
 * Query params: depth (1 hoặc 2)
 */
exports.getProvinceByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const depth = parseInt(req.query.depth) || 2;
        
        const province = await locationService.getProvinceByCode(code, depth);
        
        res.json({
            success: true,
            data: province
        });
    } catch (error) {
        console.error('Error in getProvinceByCode:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy thông tin tỉnh thành'
        });
    }
};

/**
 * Lấy tất cả quận/huyện
 * GET /api/locations/districts
 */
exports.getAllDistricts = async (req, res) => {
    try {
        const districts = await locationService.getAllDistricts();
        
        res.json({
            success: true,
            data: districts,
            count: districts.length
        });
    } catch (error) {
        console.error('Error in getAllDistricts:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách quận huyện'
        });
    }
};

/**
 * Lấy chi tiết quận/huyện (có thể bao gồm phường/xã)
 * GET /api/locations/districts/:code
 * Query params: depth (2 để lấy cả wards)
 */
exports.getDistrictByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const depth = parseInt(req.query.depth) || 2;
        
        const district = await locationService.getDistrictByCode(code, depth);
        
        res.json({
            success: true,
            data: district
        });
    } catch (error) {
        console.error('Error in getDistrictByCode:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy thông tin quận huyện'
        });
    }
};

/**
 * Lấy danh sách quận/huyện theo tỉnh
 * GET /api/locations/provinces/:provinceCode/districts
 */
exports.getDistrictsByProvince = async (req, res) => {
    try {
        const { provinceCode } = req.params;
        
        const districts = await locationService.getDistrictsByProvince(provinceCode);
        
        res.json({
            success: true,
            data: districts,
            count: districts.length
        });
    } catch (error) {
        console.error('Error in getDistrictsByProvince:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách quận huyện'
        });
    }
};

/**
 * Lấy tất cả phường/xã
 * GET /api/locations/wards
 */
exports.getAllWards = async (req, res) => {
    try {
        const wards = await locationService.getAllWards();
        
        res.json({
            success: true,
            data: wards,
            count: wards.length
        });
    } catch (error) {
        console.error('Error in getAllWards:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách phường xã'
        });
    }
};

/**
 * Lấy chi tiết phường/xã
 * GET /api/locations/wards/:code
 */
exports.getWardByCode = async (req, res) => {
    try {
        const { code } = req.params;
        
        const ward = await locationService.getWardByCode(code);
        
        res.json({
            success: true,
            data: ward
        });
    } catch (error) {
        console.error('Error in getWardByCode:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy thông tin phường xã'
        });
    }
};

/**
 * Lấy danh sách phường/xã theo quận/huyện
 * GET /api/locations/districts/:districtCode/wards
 */
exports.getWardsByDistrict = async (req, res) => {
    try {
        const { districtCode } = req.params;
        
        const wards = await locationService.getWardsByDistrict(districtCode);
        
        res.json({
            success: true,
            data: wards,
            count: wards.length
        });
    } catch (error) {
        console.error('Error in getWardsByDistrict:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách phường xã'
        });
    }
};

/**
 * Lấy tất cả phường/xã theo tỉnh
 * GET /api/locations/provinces/:provinceCode/wards
 */
exports.getWardsByProvince = async (req, res) => {
    try {
        const { provinceCode } = req.params;
        
        const wards = await locationService.getWardsByProvince(provinceCode);
        
        res.json({
            success: true,
            data: wards,
            count: wards.length
        });
    } catch (error) {
        console.error('Error in getWardsByProvince:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi lấy danh sách phường xã'
        });
    }
};

/**
 * Tìm kiếm địa điểm
 * GET /api/locations/search?q=keyword&type=all
 */
exports.searchLocation = async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            });
        }
        
        const results = await locationService.searchLocation(q, type);
        
        res.json({
            success: true,
            data: results,
            query: q,
            type: type
        });
    } catch (error) {
        console.error('Error in searchLocation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi khi tìm kiếm địa điểm'
        });
    }
};
