/**
 * ===================================
 * AUTH MIDDLEWARE
 * Middleware xác thực và phân quyền
 * ===================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware bảo vệ routes - Yêu cầu đăng nhập
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra token trong header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Hoặc kiểm tra trong cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để truy cập'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ token (không lấy password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Người dùng không tồn tại'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware phân quyền theo role
 * @param  {...string} roles - Các role được phép truy cập
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.user.role} không có quyền truy cập`
      });
    }
    next();
  };
};

/**
 * Middleware kiểm tra user đã verify email chưa
 */
exports.verifyEmail = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      error: 'Vui lòng xác thực email trước khi sử dụng tính năng này'
    });
  }
  next();
};

/**
 * Alias cho protect middleware - Xác thực user
 */
exports.authenticate = exports.protect;

/**
 * Middleware phân quyền Admin
 */
exports.authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ admin mới được phép.'
    });
  }
  next();
};
