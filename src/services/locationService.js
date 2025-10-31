/**
 * ===================================
 * LOCATION SERVICE
 * Tích hợp API Tỉnh thành - Quận huyện - Phường xã
 * API: https://provinces.open-api.vn/api/
 * ===================================
 */

const axios = require('axios');

const BASE_URL = 'https://provinces.open-api.vn/api';

/**
 * Lấy tất cả tỉnh/thành phố
 */
async function getAllProvinces() {
    try {
        const response = await axios.get(`${BASE_URL}/p/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching provinces:', error.message);
        throw new Error('Không thể lấy danh sách tỉnh thành');
    }
}

/**
 * Lấy chi tiết tỉnh/thành phố theo code (bao gồm danh sách quận/huyện)
 * @param {string} provinceCode - Mã tỉnh/thành phố
 * @param {number} depth - Độ sâu dữ liệu (1: có districts, 2: có districts + wards)
 */
async function getProvinceByCode(provinceCode, depth = 2) {
    try {
        const response = await axios.get(`${BASE_URL}/p/${provinceCode}?depth=${depth}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching province ${provinceCode}:`, error.message);
        throw new Error('Không thể lấy thông tin tỉnh thành');
    }
}

/**
 * Lấy tất cả quận/huyện
 */
async function getAllDistricts() {
    try {
        const response = await axios.get(`${BASE_URL}/d/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching districts:', error.message);
        throw new Error('Không thể lấy danh sách quận huyện');
    }
}

/**
 * Lấy chi tiết quận/huyện theo code (bao gồm danh sách phường/xã)
 * @param {string} districtCode - Mã quận/huyện
 * @param {number} depth - Độ sâu dữ liệu (2: có wards)
 */
async function getDistrictByCode(districtCode, depth = 2) {
    try {
        const response = await axios.get(`${BASE_URL}/d/${districtCode}?depth=${depth}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching district ${districtCode}:`, error.message);
        throw new Error('Không thể lấy thông tin quận huyện');
    }
}

/**
 * Lấy danh sách quận/huyện theo mã tỉnh
 * @param {string} provinceCode - Mã tỉnh/thành phố
 */
async function getDistrictsByProvince(provinceCode) {
    try {
        // Phải dùng depth=2 vì API external không trả về districts với depth=1
        const province = await getProvinceByCode(provinceCode, 2);
        return province.districts || [];
    } catch (error) {
        console.error(`Error fetching districts for province ${provinceCode}:`, error.message);
        throw new Error('Không thể lấy danh sách quận huyện');
    }
}

/**
 * Lấy tất cả phường/xã
 */
async function getAllWards() {
    try {
        const response = await axios.get(`${BASE_URL}/w/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching wards:', error.message);
        throw new Error('Không thể lấy danh sách phường xã');
    }
}

/**
 * Lấy chi tiết phường/xã theo code
 * @param {string} wardCode - Mã phường/xã
 */
async function getWardByCode(wardCode) {
    try {
        const response = await axios.get(`${BASE_URL}/w/${wardCode}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ward ${wardCode}:`, error.message);
        throw new Error('Không thể lấy thông tin phường xã');
    }
}

/**
 * Lấy danh sách phường/xã theo mã quận/huyện
 * @param {string} districtCode - Mã quận/huyện
 */
async function getWardsByDistrict(districtCode) {
    try {
        const district = await getDistrictByCode(districtCode, 2);
        return district.wards || [];
    } catch (error) {
        console.error(`Error fetching wards for district ${districtCode}:`, error.message);
        throw new Error('Không thể lấy danh sách phường xã');
    }
}

/**
 * Lấy danh sách phường/xã theo mã tỉnh (tất cả phường trong tỉnh)
 * @param {string} provinceCode - Mã tỉnh/thành phố
 */
async function getWardsByProvince(provinceCode) {
    try {
        const province = await getProvinceByCode(provinceCode, 2);
        
        if (!province.districts) {
            return [];
        }

        // Gộp tất cả wards từ các districts
        const allWards = [];
        province.districts.forEach(district => {
            if (district.wards && Array.isArray(district.wards)) {
                district.wards.forEach(ward => {
                    allWards.push({
                        ...ward,
                        district_code: district.code,
                        district_name: district.name
                    });
                });
            }
        });

        return allWards;
    } catch (error) {
        console.error(`Error fetching wards for province ${provinceCode}:`, error.message);
        throw new Error('Không thể lấy danh sách phường xã');
    }
}

/**
 * Tìm kiếm địa điểm theo tên
 * @param {string} query - Từ khóa tìm kiếm
 * @param {string} type - Loại địa điểm: 'province', 'district', 'ward', hoặc 'all'
 */
async function searchLocation(query, type = 'all') {
    try {
        const results = {
            provinces: [],
            districts: [],
            wards: []
        };

        const searchQuery = query.toLowerCase().trim();

        if (type === 'province' || type === 'all') {
            const provinces = await getAllProvinces();
            results.provinces = provinces.filter(p => 
                p.name.toLowerCase().includes(searchQuery) ||
                p.name_en?.toLowerCase().includes(searchQuery)
            );
        }

        if (type === 'district' || type === 'all') {
            const districts = await getAllDistricts();
            results.districts = districts.filter(d => 
                d.name.toLowerCase().includes(searchQuery) ||
                d.name_en?.toLowerCase().includes(searchQuery)
            );
        }

        if (type === 'ward' || type === 'all') {
            const wards = await getAllWards();
            results.wards = wards.filter(w => 
                w.name.toLowerCase().includes(searchQuery) ||
                w.name_en?.toLowerCase().includes(searchQuery)
            );
        }

        return results;
    } catch (error) {
        console.error('Error searching location:', error.message);
        throw new Error('Không thể tìm kiếm địa điểm');
    }
}

module.exports = {
    getAllProvinces,
    getProvinceByCode,
    getAllDistricts,
    getDistrictByCode,
    getDistrictsByProvince,
    getAllWards,
    getWardByCode,
    getWardsByDistrict,
    getWardsByProvince,
    searchLocation
};
