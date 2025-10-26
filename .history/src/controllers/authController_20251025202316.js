/**
 * ===================================
 * AUTH CONTROLLER
 * Xử lý đăng ký, đăng nhập, quên mật khẩu
 * ===================================
 */

const User = require('../models/User');

/**
 * @desc    Đăng ký tài khoản mới
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Kiểm tra user đã tồn tại chưa (Mongoose)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email đã được sử dụng'
      });
    }

    // Tạo user mới (Mongoose) - mặc định role = 'user'
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'user' // Mặc định là người dùng thường
    });

    // Đăng ký thành công - chuyển hướng về trang đăng nhập
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đăng nhập.',
      redirect: '/auth/login'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user (Mongoose) - include password vì select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Đăng nhập thành công - trả về token và chuyển hướng về trang chủ
    const token = user.getSignedJwtToken();
    
    const options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    res
      .status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        redirect: '/',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin user hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // Mongoose - password đã được exclude với select: false
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin user
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    // Xóa các field undefined
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Mongoose - findByIdAndUpdate
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đổi mật khẩu
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    // Kiểm tra mật khẩu cũ
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Mật khẩu hiện tại không đúng'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng xuất
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin hồ sơ
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, dob, bio, gender } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Người dùng không tồn tại'
      });
    }

    // Cập nhật các trường
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Hồ sơ đã được cập nhật',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        bio: user.bio,
        gender: user.gender
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật địa chỉ
 * @route   PUT /api/auth/address
 * @access  Private
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp thông tin địa chỉ'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Người dùng không tồn tại'
      });
    }

    // Cập nhật địa chỉ
    if (address.street) user.address_street = address.street;
    if (address.province) user.address_city = address.province;
    if (address.district) user.address_district = address.district;
    if (address.ward) user.address_ward = address.ward;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Địa chỉ đã được cập nhật',
      data: {
        street: user.address_street,
        province: user.address_city,
        district: user.address_district,
        ward: user.address_ward
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đổi mật khẩu
 * @route   POST /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mật khẩu'
      });
    }

    const user = await User.findByPk(req.user.id);

    // Kiểm tra mật khẩu cũ
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được thay đổi'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật tùy chọn
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { notifications, privacy, security, newsletter } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Người dùng không tồn tại'
      });
    }

    // Lưu preferences (có thể mở rộng để lưu vào database)
    const preferences = {
      notifications: notifications || {},
      privacy: privacy || 'public',
      security: security || {},
      newsletter: newsletter || false
    };

    // Ở đây bạn có thể lưu vào một bảng preferences hoặc JSON field
    console.log('Updated preferences:', preferences);

    res.status(200).json({
      success: true,
      message: 'Tùy chọn đã được lưu',
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tải lên avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn một file'
      });
    }

    const user = await User.findByPk(req.user.id);
    
    // Lưu đường dẫn ảnh (có thể sử dụng cloudinary hoặc S3)
    const avatarPath = `/uploads/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar đã được tải lên',
      avatar: avatarPath
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa tài khoản
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Người dùng không tồn tại'
      });
    }

    // Xóa user
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Tài khoản đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function để gửi token response
const sendTokenResponse = (user, statusCode, res) => {
  // Tạo token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

/**
 * @desc    Đăng nhập bằng Google - Callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
exports.googleCallback = async (req, res, next) => {
  try {
    // User đã được authenticate bởi Passport
    const user = req.user;
    
    // Tạo token
    const token = user.getSignedJwtToken();
    
    const options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Set cookie và chuyển hướng về trang chủ
    res
      .cookie('token', token, options)
      .redirect('/');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập bằng Google - Thất bại
 * @route   GET /api/auth/google/failure
 * @access  Public
 */
exports.googleFailure = (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Đăng nhập Google thất bại'
  });
};
