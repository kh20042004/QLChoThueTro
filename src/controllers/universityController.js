/**
 * ===================================
 * UNIVERSITIES CONTROLLER
 * Xử lý logic các trường đại học
 * ===================================
 */

const University = require('../models/University');
const colors = require('../config/colors');

/**
 * Lấy danh sách tất cả các trường đại học
 */
exports.getAllUniversities = async (req, res) => {
  try {
    const { district, search, limit = 20, skip = 0 } = req.query;

    let query = { isActive: true };

    // Lọc theo quận
    if (district) {
      query.district = district;
    }

    // Tìm kiếm theo tên hoặc đặc thù
    if (search) {
      query.$text = { $search: search };
    }

    const universities = await University.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ name: 1 });

    const total = await University.countDocuments(query);

    res.json({
      success: true,
      data: universities,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error getAllUniversities: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thông tin chi tiết một trường
 */
exports.getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findById(id);

    if (!university) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trường đại học' });
    }

    res.json({ success: true, data: university });
  } catch (error) {
    console.error(`${colors.red}Error getUniversityById: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy trường đại học gần nhất theo tọa độ
 * Query params: latitude, longitude, maxDistance (mặc định 5km)
 */
exports.getNearbyUniversities = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp latitude và longitude'
      });
    }

    const universities = await University.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });

    res.json({ success: true, data: universities });
  } catch (error) {
    console.error(`${colors.red}Error getNearbyUniversities: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách quận
 */
exports.getDistricts = async (req, res) => {
  try {
    const districts = await University.distinct('district');
    res.json({ success: true, data: districts.sort() });
  } catch (error) {
    console.error(`${colors.red}Error getDistricts: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách các ngành học/chuyên ngành
 */
exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await University.distinct('specialties');
    res.json({ success: true, data: specialties.sort() });
  } catch (error) {
    console.error(`${colors.red}Error getSpecialties: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [Admin] Tạo trường đại học mới
 */
exports.createUniversity = async (req, res) => {
  try {
    const { name, shortName, address, district, phone, email, website, coordinates, specialties } = req.body;

    // Kiểm tra shortName đã tồn tại chưa
    const existing = await University.findOne({ shortName });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã trường đã tồn tại' });
    }

    const university = new University({
      name,
      shortName,
      address,
      district,
      phone,
      email,
      website,
      specialties: specialties || [],
      location: {
        type: 'Point',
        coordinates: coordinates || [106.6825, 10.8017] // Default HCM center
      }
    });

    await university.save();

    res.status(201).json({ success: true, data: university });
  } catch (error) {
    console.error(`${colors.red}Error createUniversity: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [Admin] Cập nhật trường đại học
 */
exports.updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const university = await University.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!university) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trường đại học' });
    }

    res.json({ success: true, data: university });
  } catch (error) {
    console.error(`${colors.red}Error updateUniversity: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [Admin] Xóa trường đại học
 */
exports.deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findByIdAndDelete(id);

    if (!university) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trường đại học' });
    }

    res.json({ success: true, message: 'Xóa trường đại học thành công' });
  } catch (error) {
    console.error(`${colors.red}Error deleteUniversity: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [Admin] Kích hoạt/Vô hiệu hóa trường đại học
 */
exports.toggleUniversityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const university = await University.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!university) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trường đại học' });
    }

    res.json({ success: true, data: university });
  } catch (error) {
    console.error(`${colors.red}Error toggleUniversityStatus: ${error.message}${colors.reset}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
