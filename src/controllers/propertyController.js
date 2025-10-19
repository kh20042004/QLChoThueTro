/**
 * ===================================
 * PROPERTY CONTROLLER
 * Xử lý CRUD cho phòng trọ/nhà
 * ===================================
 */

const Property = require('../models/Property');

/**
 * @desc    Lấy danh sách tất cả property
 * @route   GET /api/properties
 * @access  Public
 */
exports.getProperties = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Property.find(JSON.parse(queryStr)).populate('landlord', 'name email phone');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Property.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const properties = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: properties.length,
      pagination,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin 1 property theo ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone avatar')
      .populate('reviews');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Tăng view count
    property.views += 1;
    await property.save();

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo property mới
 * @route   POST /api/properties
 * @access  Private (Landlord, Admin)
 */
exports.createProperty = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.landlord = req.user.id;

    const property = await Property.create(req.body);

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật property
 * @route   PUT /api/properties/:id
 * @access  Private (Owner, Admin)
 */
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra ownership
    if (property.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền cập nhật phòng này'
      });
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa property
 * @route   DELETE /api/properties/:id
 * @access  Private (Owner, Admin)
 */
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra ownership
    if (property.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xóa phòng này'
      });
    }

    await property.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tìm kiếm property theo vị trí
 * @route   GET /api/properties/radius/:zipcode/:distance
 * @access  Public
 */
exports.getPropertiesInRadius = async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;

    // Tính toán radius
    const radius = distance / 6378; // Earth radius in km

    const properties = await Property.find({
      location: { $geoWithin: { $centerSphere: [[zipcode, radius]] } }
    });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};
