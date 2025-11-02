/**
 * ===================================
 * CLOUDINARY CONFIGURATION
 * Cấu hình upload ảnh lên Cloudinary
 * ===================================
 */

const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload file lên Cloudinary
 * @param {string} filePath - Đường dẫn file local
 * @param {string} folder - Thư mục trên Cloudinary
 * @returns {Promise<Object>} - Thông tin file đã upload
 */
const uploadToCloudinary = async (filePath, folder = 'properties') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Giới hạn kích thước
        { quality: 'auto:good' }, // Tự động tối ưu chất lượng
        { fetch_format: 'auto' } // Tự động chọn format tốt nhất (webp, jpg)
      ]
    });

    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Lỗi khi upload ảnh lên cloud');
  }
};

/**
 * Xóa file trên Cloudinary
 * @param {string} publicId - Public ID của file trên Cloudinary
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error('Lỗi khi xóa ảnh trên cloud');
  }
};

/**
 * Upload nhiều file lên Cloudinary
 * @param {Array} files - Mảng files từ Multer
 * @param {string} folder - Thư mục trên Cloudinary
 * @returns {Promise<Array>} - Mảng URL ảnh đã upload
 */
const uploadMultipleToCloudinary = async (files, folder = 'properties') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file.path, folder));
    const results = await Promise.all(uploadPromises);
    
    // Xóa files local sau khi upload lên cloud
    const fs = require('fs');
    files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Lỗi xóa file local:', err);
      });
    });
    
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary
};
