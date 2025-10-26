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
 * @desc    Tìm kiếm phòng bằng AI (Natural Language Search)
 * @route   POST /api/ai/search
 * @access  Public
 */
exports.searchWithAI = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập yêu cầu tìm kiếm'
      });
    }

    // Bước 1: Parse query thành filters
    const parseResult = await geminiService.parseSearchQuery(query);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error
      });
    }

    // Bước 2: Tìm kiếm phòng thực tế từ database
    const Property = require('../models/Property');
    const filters = parseResult.filters;
    
    // Build MongoDB query
    const searchQuery = { status: 'available' };
    
    if (filters.propertyType) {
      searchQuery.propertyType = filters.propertyType;
    }
    
    if (filters.location) {
      // Tìm kiếm theo district hoặc city
      searchQuery.$or = [
        { 'address.district': new RegExp(filters.location, 'i') },
        { 'address.city': new RegExp(filters.location, 'i') }
      ];
    }
    
    if (filters.priceMin || filters.priceMax) {
      searchQuery.price = {};
      if (filters.priceMin) searchQuery.price.$gte = filters.priceMin * 1000000;
      if (filters.priceMax) searchQuery.price.$lte = filters.priceMax * 1000000;
    }
    
    if (filters.area) {
      // Tìm phòng có diện tích gần với yêu cầu (±10m²)
      searchQuery.area = { 
        $gte: filters.area - 10, 
        $lte: filters.area + 10 
      };
    }
    
    if (filters.bedrooms) {
      searchQuery.bedrooms = filters.bedrooms;
    }
    
    // Tìm kiếm properties
    let properties = await Property.find(searchQuery)
      .limit(6)
      .sort('-createdAt')
      .populate('landlord', 'name email phone')
      .lean();
    
    // Nếu có yêu cầu về amenities, filter thêm
    if (filters.amenities && filters.amenities.length > 0) {
      properties = properties.filter(prop => {
        if (!prop.amenities) return false;
        // Kiểm tra có ít nhất 1 amenity khớp
        return filters.amenities.some(amenity => prop.amenities[amenity] === true);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        filters: filters,
        summary: parseResult.summary,
        properties: properties,
        count: properties.length
      }
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

module.exports = exports;
