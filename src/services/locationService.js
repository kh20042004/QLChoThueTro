/**
 * ===================================
 * LOCATION SERVICE
 * Tích hợp API Tỉnh thành - Quận huyện - Phường xã
 * API: https://provinces.open-api.vn/api/
 * Note: Nếu SSL cert expired, sử dụng http thay vì https
 * ===================================
 */

const axios = require('axios');
const https = require('https');

// Thử HTTPS trước, nếu lỗi SSL sẽ fallback sang HTTP
const BASE_URL = 'https://provinces.open-api.vn/api';
const BASE_URL_FALLBACK = 'http://provinces.open-api.vn/api';

// Tạo axios instance với config bỏ qua SSL verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Helper function để gọi API với fallback
 */
async function fetchWithFallback(endpoint) {
    try {
        // Thử HTTPS với SSL verification disabled
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            httpsAgent,
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        // Nếu HTTPS fail, thử HTTP
        try {
            console.log(`HTTPS failed, trying HTTP for ${endpoint}`);
            const response = await axios.get(`${BASE_URL_FALLBACK}${endpoint}`, {
                timeout: 10000
            });
            return response.data;
        } catch (fallbackError) {
            console.error(`Both HTTPS and HTTP failed for ${endpoint}`);
            throw error;
        }
    }
}

// Tạo axios instance với SSL verification disabled (do API có SSL certificate hết hạn)
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    timeout: 10000 // 10 seconds timeout
});

// Cache để tránh gọi API quá nhiều lần
let provincesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Mapping tên tỉnh/thành (slug) sang mã code
 * Các tên phổ biến để dễ sử dụng API
 */
const PROVINCE_SLUG_TO_CODE = {
    'hanoi': '01',
    'ha-noi': '01',
    'hochiminh': '79',
    'ho-chi-minh': '79',
    'saigon': '79',
    'sai-gon': '79',
    'danang': '48',
    'da-nang': '48',
    'haiphong': '31',
    'hai-phong': '31',
    'cantho': '92',
    'can-tho': '92',
    'binhduong': '74',
    'binh-duong': '74',
    'dongnai': '75',
    'dong-nai': '75',
    'vungtau': '77',
    'vung-tau': '77',
    'nghean': '40',
    'nghe-an': '40',
    'hue': '46',
    'nhatrang': '56',
    'nha-trang': '56',
    'dalat': '68',
    'da-lat': '68'
};

/**
 * Normalize string để so sánh (bỏ dấu, lowercase, bỏ khoảng trắng)
 */
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, ''); // Chỉ giữ chữ và số
}

/**
 * Tìm mã code từ tên tỉnh (slug hoặc full name)
 * @param {string} input - Có thể là code (01, 79), slug (hanoi, ho-chi-minh), hoặc tên đầy đủ (Hà Nội)
 * @returns {Promise<string|null>} - Province code hoặc null nếu không tìm thấy
 */
async function findProvinceCode(input) {
    if (!input) return null;
    
    const normalized = normalizeString(input);
    
    // 1. Kiểm tra xem đã là code chưa (2 chữ số)
    if (/^\d{1,2}$/.test(input)) {
        return input.padStart(2, '0'); // Đảm bảo 2 chữ số (01, 02, ...)
    }
    
    // 2. Kiểm tra trong mapping slug
    if (PROVINCE_SLUG_TO_CODE[normalized]) {
        return PROVINCE_SLUG_TO_CODE[normalized];
    }
    
    // 3. Tìm trong danh sách tỉnh thành (search by name)
    try {
        const provinces = await getAllProvinces();
        const found = provinces.find(p => 
            normalizeString(p.name) === normalized ||
            normalizeString(p.code_name) === normalized
        );
        
        if (found) {
            return String(found.code);
        }
    } catch (error) {
        console.error('Error finding province code:', error.message);
    }
    
    return null;
}

/**
 * Lấy tất cả tỉnh/thành phố
 */
async function getAllProvinces() {
    try {
        return await fetchWithFallback('/p/');
    } catch (error) {
        console.error('Error fetching provinces:', error.message);
        
        // Nếu có cache cũ, trả về cache
        if (provincesCache) {
            console.log('⚠️ Using cached provinces data');
            return provincesCache;
        }
        
        throw new Error('Không thể lấy danh sách tỉnh thành');
    }
}

/**
 * Lấy chi tiết tỉnh/thành phố theo code (bao gồm danh sách quận/huyện)
 * @param {string} provinceCodeOrName - Mã tỉnh/thành phố, slug, hoặc tên đầy đủ
 * @param {number} depth - Độ sâu dữ liệu (1: có districts, 2: có districts + wards)
 */
async function getProvinceByCode(provinceCodeOrName, depth = 2) {
    try {
        // Tìm code thực sự từ input
        const provinceCode = await findProvinceCode(provinceCodeOrName);
        
        if (!provinceCode) {
            throw new Error(`Không tìm thấy tỉnh thành: ${provinceCodeOrName}`);
        }
        
        console.log(`✓ Resolved "${provinceCodeOrName}" -> code: ${provinceCode}`);
        
        return await fetchWithFallback(`/p/${provinceCode}?depth=${depth}`);
    } catch (error) {
        console.error(`Error fetching province ${provinceCodeOrName}:`, error.message);
        
        // Log chi tiết lỗi từ API
        if (error.response) {
            console.error(`API Status: ${error.response.status}`);
            console.error(`API Data:`, error.response.data);
        }
        
        throw new Error(error.message || 'Không thể lấy thông tin tỉnh thành');
    }
}

/**
 * Lấy tất cả quận/huyện
 */
async function getAllDistricts() {
    try {
        return await fetchWithFallback('/d/');
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
        return await fetchWithFallback(`/d/${districtCode}?depth=${depth}`);
    } catch (error) {
        console.error(`Error fetching district ${districtCode}:`, error.message);
        throw new Error('Không thể lấy thông tin quận huyện');
    }
}

/**
 * Lấy danh sách quận/huyện theo mã tỉnh
 * @param {string} provinceCodeOrName - Mã tỉnh/thành phố, slug, hoặc tên đầy đủ
 */
async function getDistrictsByProvince(provinceCodeOrName) {
    try {
        console.log(`🔍 Getting districts for: ${provinceCodeOrName}`);
        
        // Phải dùng depth=2 vì API external không trả về districts với depth=1
        const province = await getProvinceByCode(provinceCodeOrName, 2);
        
        if (!province.districts || province.districts.length === 0) {
            console.warn(`⚠️ No districts found for province: ${provinceCodeOrName}`);
            return [];
        }
        
        console.log(`✓ Found ${province.districts.length} districts`);
        return province.districts;
    } catch (error) {
        console.error(`Error fetching districts for province ${provinceCodeOrName}:`, error.message);
        throw error; // Re-throw để giữ error message chi tiết
    }
}

/**
 * Lấy tất cả phường/xã
 */
async function getAllWards() {
    try {
        return await fetchWithFallback('/w/');
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
        return await fetchWithFallback(`/w/${wardCode}`);
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
 * @param {string} provinceCodeOrName - Mã tỉnh/thành phố, slug, hoặc tên đầy đủ
 */
async function getWardsByProvince(provinceCodeOrName) {
    try {
        const province = await getProvinceByCode(provinceCodeOrName, 2);
        
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
    searchLocation,
    findProvinceCode // Export helper function
};
