/**
 * ===================================
 * PROPERTY CONTROLLER
 * Xử lý CRUD cho phòng trọ/nhà
 * ===================================
 */

const Property = require('../models/Property');
const geocodingService = require('../services/geocodingService');
const { uploadMultipleToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

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

    // Parse query
    const queryObj = JSON.parse(queryStr);

    // Log để debug
    console.log('🔍 Query parameters:', req.query);
    console.log('🔍 Parsed query object:', queryObj);

    // Finding resource
    let query = Property.find(queryObj).populate('landlord', 'name email phone avatar');

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
    const limit = parseInt(req.query.limit, 10) || 1000; // Tăng limit lên để hiển thị tất cả properties của user
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Count với query filter
    const total = await Property.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const properties = await query;

    console.log(`✅ Found ${properties.length} properties`);

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
      total: total,
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

    // Tăng view count (sử dụng $inc để tránh conflict với schema)
    await Property.updateOne(
      { _id: req.params.id },
      { $inc: { views: 1 } }
    );
    property.views += 1; // Update local object for response

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
    console.log('📝 === CREATE PROPERTY REQUEST ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files?.length || 0);
    console.log('User:', req.user?.id);
    
    // Validate required fields
    const { type, title, description, price, area, bedrooms, bathrooms, street, province, district, ward } = req.body;

    if (!type || !title || !description || !price || !area || !bedrooms || !bathrooms) {
      console.log('❌ Thiếu thông tin cơ bản');
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    if (!street || !province || !district || !ward) {
      console.log('❌ Thiếu thông tin địa chỉ');
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ địa chỉ (đường, phường, quận, tỉnh)'
      });
    }

    // Tạo địa chỉ đầy đủ
    const fullAddress = `${street}, ${ward}, ${district}, ${province}`;

    // Tự động lấy tọa độ từ địa chỉ sử dụng Geocoding API
    let coordinates = null;
    try {
      console.log(`🌍 Đang lấy tọa độ cho địa chỉ: ${fullAddress}`);
      
      const geoData = await geocodingService.getCoordinatesFromAddress(
        street,
        ward,
        district,
        province
      );
      
      coordinates = [geoData.lng, geoData.lat]; // GeoJSON format: [longitude, latitude]
      
      console.log(`✅ Tọa độ: [${coordinates[0]}, ${coordinates[1]}] (accuracy: ${geoData.accuracy})`);
    } catch (err) {
      console.error('❌ Lỗi khi lấy tọa độ:', err);
      // Sử dụng tọa độ mặc định nếu lỗi
      const defaultCoords = geocodingService.getDefaultCoordinates(district, province);
      coordinates = [defaultCoords.lng, defaultCoords.lat];
    }

    // Prepare property data với Mongoose schema
    const propertyData = {
      propertyType: type,
      title: title,
      description: description,
      price: parseFloat(price),
      area: parseFloat(area),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      address: {
        street: street,
        city: province,
        district: district,
        ward: ward,
        full: fullAddress
      },
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: street,
        ward: ward,
        district: district,
        province: province
      },
      landlord: req.user.id,
      status: 'available' // Mặc định là available (sẵn sàng cho thuê)
    };

    // Handle amenities
    if (req.body.amenities) {
      try {
        const amenitiesData = JSON.parse(req.body.amenities);
        // Nếu là object, assign trực tiếp
        if (typeof amenitiesData === 'object' && !Array.isArray(amenitiesData)) {
          propertyData.amenities = amenitiesData;
        }
      } catch (e) {
        // Nếu parse fail, bỏ qua
        console.warn('Lỗi parse amenities:', e.message);
      }
    }

    // Handle images - Upload lên Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📤 Đang upload ${req.files.length} ảnh lên Cloudinary...`);
      
      try {
        // Upload tất cả ảnh lên Cloudinary
        const uploadResults = await uploadMultipleToCloudinary(req.files, 'properties');
        
        // Lưu URLs từ Cloudinary vào database
        propertyData.images = uploadResults.map(result => result.url);
        
        console.log(`✅ Đã upload ${uploadResults.length} ảnh lên Cloudinary`);
      } catch (uploadError) {
        console.error('❌ Lỗi upload ảnh:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Lỗi khi upload ảnh. Vui lòng thử lại.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng tải lên ít nhất 1 ảnh'
      });
    }

    // Create property
    const property = await Property.create(propertyData);

    // Log the action
    console.log(`✅ Người dùng ${req.user.id} vừa tạo tin đăng ${property._id} tại ${fullAddress} (${coordinates})`);

    res.status(201).json({
      success: true,
      message: 'Đăng tin thành công! Tin đăng của bạn đã được đăng.',
      data: property
    });
  } catch (error) {
    // Không cần xóa local files vì đã upload lên Cloudinary
    // Cloudinary sẽ tự động xóa files local sau khi upload
    console.error('❌ Lỗi tạo property:', error);
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

    // Prepare update data
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      propertyType: req.body.propertyType,
      price: parseFloat(req.body.price),
      area: parseFloat(req.body.area),
      bedrooms: parseInt(req.body.bedrooms),
      bathrooms: parseInt(req.body.bathrooms),
    };

    // Handle address
    if (req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string' 
          ? JSON.parse(req.body.address) 
          : req.body.address;
        
        const fullAddress = `${addressData.street}, ${addressData.ward}, ${addressData.district}, ${addressData.province}`;
        
        updateData.address = {
          street: addressData.street,
          city: addressData.province,
          district: addressData.district,
          ward: addressData.ward,
          full: fullAddress
        };

        // Cập nhật tọa độ nếu địa chỉ thay đổi
        try {
          const geoData = await geocodingService.getCoordinatesFromAddress(
            addressData.street,
            addressData.ward,
            addressData.district,
            addressData.province
          );
          updateData.location = {
            type: 'Point',
            coordinates: [geoData.lng, geoData.lat],
            address: addressData.street,
            ward: addressData.ward,
            district: addressData.district,
            province: addressData.province
          };
        } catch (err) {
          console.warn('Không lấy được tọa độ mới, giữ tọa độ cũ');
        }
      } catch (e) {
        console.warn('Lỗi parse address:', e.message);
      }
    }

    // Handle amenities
    if (req.body.amenities) {
      try {
        const amenitiesData = typeof req.body.amenities === 'string'
          ? JSON.parse(req.body.amenities)
          : req.body.amenities;
        
        // Chỉ cập nhật nếu là object (không phải array)
        if (typeof amenitiesData === 'object' && !Array.isArray(amenitiesData)) {
          // Chỉ cập nhật từng field riêng lẻ để tránh ghi đè cấu trúc
          updateData['amenities.wifi'] = amenitiesData.wifi || false;
          updateData['amenities.ac'] = amenitiesData.ac || false;
          updateData['amenities.parking'] = amenitiesData.parking || false;
          updateData['amenities.kitchen'] = amenitiesData.kitchen || false;
          updateData['amenities.water'] = amenitiesData.water || false;
          updateData['amenities.laundry'] = amenitiesData.laundry || false;
          updateData['amenities.balcony'] = amenitiesData.balcony || false;
          updateData['amenities.security'] = amenitiesData.security || false;
        }
      } catch (e) {
        console.warn('Lỗi parse amenities:', e.message);
      }
    }

    // Handle images
    let finalImages = [];
    
    // Giữ lại ảnh cũ nếu có
    if (req.body.existingImages) {
      try {
        const existingImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        
        if (Array.isArray(existingImages)) {
          finalImages = [...existingImages];
        }
      } catch (e) {
        console.warn('Lỗi parse existingImages:', e.message);
      }
    }
    
    // Thêm ảnh mới - Upload lên Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📤 Đang upload ${req.files.length} ảnh mới lên Cloudinary...`);
      
      try {
        const uploadResults = await uploadMultipleToCloudinary(req.files, 'properties');
        const newImages = uploadResults.map(result => result.url);
        finalImages = [...finalImages, ...newImages];
        
        console.log(`✅ Đã upload ${uploadResults.length} ảnh mới`);
      } catch (uploadError) {
        console.error('❌ Lỗi upload ảnh:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Lỗi khi upload ảnh. Vui lòng thử lại.'
        });
      }
    }
    
    // Cập nhật images nếu có thay đổi
    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }

    // Update property
    property = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log(`Người dùng ${req.user.id} vừa cập nhật tin đăng ${property._id}`);

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài đăng thành công!',
      data: property
    });
  } catch (error) {
    console.error('Lỗi cập nhật property:', error);
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

    // Mongoose - sử dụng deleteOne() thay vì remove()
    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách property của user hiện tại
 * @route   GET /api/properties/my-properties
 * @access  Private
 */
exports.getMyProperties = async (req, res, next) => {
  try {
    console.log('🔍 Getting properties for user:', req.user.id);

    const properties = await Property.find({ landlord: req.user.id })
      .sort('-createdAt')
      .populate('landlord', 'name email phone avatar');

    console.log(`✅ Found ${properties.length} properties for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('❌ Error getting my properties:', error);
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
