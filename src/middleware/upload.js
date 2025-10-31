/**
 * ===================================
 * UPLOAD MIDDLEWARE
 * Xử lý upload file với Multer
 * ===================================
 */

const multer = require('multer');
const path = require('path');

// Cấu hình storage
const storage = multer.diskStorage({
  // Thư mục lưu file
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  // Tên file
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file - Chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra loại file
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;

  // Kiểm tra extension
  const hasValidExtension = allowedExtensions.test(file.originalname);
  
  // Kiểm tra MIME type
  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

  // Chấp nhận nếu extension hợp lệ (mimetype có thể không chính xác)
  if (hasValidExtension || hasValidMimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'));
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

// Export các middleware
module.exports = upload;
