/**
 * ===================================
 * AI CHAT CONTROLLER
 * Xử lý chat với Gemini AI
 * ===================================
 */

const geminiService = require('../services/geminiService');

/**
 * @desc    Chat với AI assistant
 * @route   POST /api/ai/chat
 * @access  Public
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập tin nhắn'
      });
    }

    // Convert history format nếu có
    const chatHistory = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    const result = await geminiService.chat(message, chatHistory);

    res.status(200).json({
      success: result.success,
      data: {
        message: result.message,
        timestamp: result.timestamp
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy gợi ý property dựa trên preferences
 * @route   POST /api/ai/recommend
 * @access  Public
 */
exports.getRecommendation = async (req, res, next) => {
  try {
    const { budget, location, propertyType, amenities } = req.body;

    const result = await geminiService.getPropertyRecommendation({
      budget,
      location,
      propertyType,
      amenities
    });

    res.status(200).json({
      success: result.success,
      data: {
        recommendation: result.recommendation
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Phân tích và cải thiện mô tả property
 * @route   POST /api/ai/analyze-description
 * @access  Private (Landlord)
 */
exports.analyzeDescription = async (req, res, next) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập mô tả cần phân tích'
      });
    }

    const result = await geminiService.analyzePropertyDescription(description);

    res.status(200).json({
      success: result.success,
      data: {
        analysis: result.analysis
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trả lời FAQ
 * @route   POST /api/ai/faq
 * @access  Public
 */
exports.answerFAQ = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập câu hỏi'
      });
    }

    const result = await geminiService.answerFAQ(question);

    res.status(200).json({
      success: result.success,
      data: {
        answer: result.answer
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    AI Search - Tìm kiếm phòng bằng AI hội thoại
 * @route   POST /api/ai/search
 * @access  Public
 */
exports.aiSearch = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập tin nhắn'
      });
    }

    // Lấy danh sách properties để AI có thể gợi ý
    const Property = require('../models/Property');
    const properties = await Property.find({ status: 'available' })
      .select('title propertyType price address area bedrooms amenities')
      .limit(50) // Giới hạn để không quá tải
      .lean();

    // Convert history format
    const chatHistory = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    const result = await geminiService.searchWithAI(message, chatHistory, properties);

    // Nếu có propertyIds, fetch thông tin chi tiết
    let recommendedProperties = [];
    if (result.propertyIds && result.propertyIds.length > 0) {
      recommendedProperties = await Property.find({
        _id: { $in: result.propertyIds }
      })
      .select('title propertyType price address area bedrooms bathrooms amenities images status')
      .lean();
    }

    res.status(200).json({
      success: result.success,
      data: {
        message: result.message,
        isComplete: result.isComplete,
        propertyIds: result.propertyIds || [],
        properties: recommendedProperties,
        timestamp: result.timestamp
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dự đoán giá thuê phòng bằng AI
 * @route   POST /api/ai/predict-price
 * @access  Public
 */
exports.predictPrice = async (req, res, next) => {
  try {
    const { area, location, propertyType, bedrooms, bathrooms, amenities, floor, description } = req.body;

    if (!area || !location || !propertyType) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: diện tích, vị trí, loại hình'
      });
    }

    // Lấy dữ liệu thị trường (các phòng tương tự)
    const Property = require('../models/Property');
    
    const query = {
      status: 'available'
    };

    // Tìm phòng cùng loại
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Tìm phòng cùng khu vực
    if (location?.city) {
      query['address.city'] = location.city;
    }

    const marketData = await Property.find(query)
      .select('propertyType area address price amenities')
      .limit(20) // Lấy 20 phòng tương tự
      .lean();

    const propertyData = {
      area,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      amenities,
      floor,
      description
    };

    const result = await geminiService.predictPrice(propertyData, marketData);

    res.status(200).json({
      success: result.success,
      data: {
        prediction: result.prediction,
        marketDataCount: marketData.length
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Phân tích hình ảnh phòng để hỗ trợ định giá
 * @route   POST /api/ai/analyze-image
 * @access  Public
 */
exports.analyzeImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp URL hình ảnh'
      });
    }

    const result = await geminiService.analyzePropertyImage(imageUrl);

    res.status(200).json({
      success: result.success,
      data: {
        analysis: result.analysis
      },
      error: result.error
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
