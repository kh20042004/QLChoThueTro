/**
 * ===================================
 * FAVORITE CONTROLLER
 * Xử lý thêm/xóa yêu thích
 * ===================================
 */

const User = require('../models/User');
const Property = require('../models/Property');

/**
 * @desc    Thêm property vào yêu thích
 * @route   POST /api/favorites/:propertyId
 * @access  Private
 */
exports.addFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Kiểm tra property có tồn tại không
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
    }

    // Lấy user
    const user = await User.findById(userId);
    
    // Kiểm tra đã yêu thích chưa
    if (user.favorites.includes(propertyId)) {
      return res.status(400).json({ success: false, message: 'Bạn đã yêu thích phòng này' });
    }

    // Thêm vào favorites
    user.favorites.push(propertyId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã thêm vào yêu thích',
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Xóa property khỏi yêu thích
 * @route   DELETE /api/favorites/:propertyId
 * @access  Private
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Lấy user
    const user = await User.findById(userId);
    
    // Kiểm tra đã yêu thích chưa
    if (!user.favorites.includes(propertyId)) {
      return res.status(400).json({ success: false, message: 'Phòng này không có trong yêu thích' });
    }

    // Xóa khỏi favorites
    user.favorites = user.favorites.filter(id => id.toString() !== propertyId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa khỏi yêu thích',
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Kiểm tra property có trong yêu thích không
 * @route   GET /api/favorites/check/:propertyId
 * @access  Private
 */
exports.checkFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const isFavorite = user.favorites.includes(propertyId);

    res.status(200).json({
      success: true,
      isFavorite: isFavorite,
      favoriteCount: user.favorites.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Lấy danh sách yêu thích của user
 * @route   GET /api/favorites
 * @access  Private
 */
exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Populate favorites data
    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: 'Property',
      select: 'title price location images address ward district city landlord'
    });

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Xóa tất cả yêu thích
 * @route   DELETE /api/favorites
 * @access  Private
 */
exports.clearFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.favorites = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa tất cả yêu thích',
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
