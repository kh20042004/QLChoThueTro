/**
 * ===================================
 * MODERATION CONTROLLER
 * Kiểm duyệt bài đăng với AI
 * ===================================
 */

const Property = require('../models/Property');
const visionService = require('../services/visionService');

/**
 * @desc    Phân tích ảnh phòng với AI
 * @route   POST /api/moderation/analyze-images
 * @access  Private (Landlord, Admin)
 */
exports.analyzePropertyImages = async (req, res, next) => {
  try {
    const { imagePaths } = req.body;

    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp danh sách ảnh'
      });
    }

    // Phân tích nhiều ảnh
    const result = await visionService.analyzeMultipleImages(imagePaths);

    res.status(200).json({
      success: result.success,
      data: result.success ? result : null,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đánh giá bài đăng trước khi submit
 * @route   POST /api/moderation/evaluate
 * @access  Private (Landlord)
 */
exports.evaluatePropertyListing = async (req, res, next) => {
  try {
    const propertyData = req.body;

    if (!propertyData.images || propertyData.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng tải lên ít nhất 1 ảnh'
      });
    }

    // Đánh giá bài đăng
    const evaluation = await visionService.evaluatePropertyListing(
      propertyData,
      propertyData.images
    );

    if (!evaluation.success) {
      return res.status(400).json({
        success: false,
        error: evaluation.error
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation.evaluation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kiểm duyệt bài đăng (Admin)
 * @route   POST /api/moderation/review/:propertyId
 * @access  Private (Admin only)
 */
exports.reviewProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' | 'reject' | 'request_changes'

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài đăng'
      });
    }

    // Phân tích ảnh với AI
    const evaluation = await visionService.evaluatePropertyListing(
      {
        amenities: property.amenities,
        propertyType: property.propertyType,
        price: property.price,
        area: property.area
      },
      property.images
    );

    // Cập nhật trạng thái
    if (action === 'approve') {
      property.status = 'available';
    } else if (action === 'reject') {
      property.status = 'inactive';
    }

    // Lưu kết quả AI vào property (thêm field mới)
    property.aiModeration = {
      evaluatedAt: new Date(),
      totalScore: evaluation.evaluation?.totalScore,
      recommendation: evaluation.evaluation?.recommendation,
      amenitiesAccuracy: evaluation.evaluation?.amenitiesComparison?.accuracyScore,
      imageQuality: evaluation.evaluation?.imageQuality,
      adminAction: action,
      adminNotes: adminNotes || '',
      adminId: req.user.id
    };

    await property.save();

    res.status(200).json({
      success: true,
      message: `Bài đăng đã được ${action === 'approve' ? 'duyệt' : 'từ chối'}`,
      data: {
        property,
        aiEvaluation: evaluation.evaluation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách bài đăng chờ duyệt
 * @route   GET /api/moderation/pending
 * @access  Private (Admin only)
 */
exports.getPendingProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('landlord', 'name email phone')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    So sánh tiện nghi
 * @route   POST /api/moderation/compare-amenities
 * @access  Private
 */
exports.compareAmenities = async (req, res, next) => {
  try {
    const { userAmenities, imagePaths } = req.body;

    if (!userAmenities || !imagePaths) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tiện nghi và ảnh'
      });
    }

    // Phân tích ảnh
    const imageAnalysis = await visionService.analyzeMultipleImages(imagePaths);

    if (!imageAnalysis.success) {
      return res.status(400).json({
        success: false,
        error: 'Không thể phân tích ảnh'
      });
    }

    // So sánh
    const comparison = visionService.compareAmenities(
      userAmenities,
      imageAnalysis.summary.allDetectedAmenities
    );

    res.status(200).json({
      success: true,
      data: {
        comparison,
        detectedAmenities: imageAnalysis.summary.allDetectedAmenities
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Phân tích 1 ảnh đơn
 * @route   POST /api/moderation/analyze-single-image
 * @access  Private
 */
exports.analyzeSingleImage = async (req, res, next) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đường dẫn ảnh'
      });
    }

    const result = await visionService.analyzeRoomImage(imagePath);

    res.status(200).json({
      success: result.success,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
