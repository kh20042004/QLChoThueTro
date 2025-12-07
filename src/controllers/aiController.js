/**
 * ===================================
 * AI CHAT CONTROLLER
 * Xử lý chat với Gemini AI + NLP Search
 * ===================================
 */

const geminiService = require('../services/geminiService');
const nlpSearchService = require('../services/nlpSearchService');

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

    // Handle quota exceeded or fallback
    if (result.quotaExceeded && !result.fallbackUsed) {
      return res.status(200).json({
        success: true,
        quotaExceeded: true,
        data: {
          message: result.message || 'AI đang quá tải. Vui lòng thử lại sau ít phút. 😔',
          timestamp: result.timestamp || new Date()
        },
        error: result.error
      });
    }

    res.status(200).json({
      success: result.success,
      usingGroq: result.usingGroq || false,
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

    // Lấy danh sách properties để AI có thể gợi ý - SMART FILTERING
    const Property = require('../models/Property');
    
    // Extract filtering hints from message
    const messageLower = message.toLowerCase();
    let smartQuery = { status: 'available' };
    
    // Detect city/location from message
    const cities = ['hồ chí minh', 'hcm', 'sài gòn', 'saigon', 'hà nội', 'hanoi', 'đà nẵng', 'danang', 'cần thơ', 'cantho'];
    const districts = ['quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 
                      'thủ đức', 'bình thạnh', 'tân bình', 'phú nhuận', 'gò vấp', 'bình tân'];
    
    // Location filter
    for (const city of cities) {
      if (messageLower.includes(city)) {
        smartQuery['address.city'] = { $regex: city, $options: 'i' };
        break;
      }
    }
    
    for (const district of districts) {
      if (messageLower.includes(district)) {
        smartQuery['address.district'] = { $regex: district, $options: 'i' };
        break;
      }
    }
    
    // Price filter from message (detect number + triệu/tr/trieu)
    const priceMatch = messageLower.match(/(\d+(?:\.\d+)?)\s*(?:triệu|tr|trieu)/);
    if (priceMatch) {
      const maxPrice = parseFloat(priceMatch[1]) * 1.3; // +30% flexibility
      smartQuery.price = { $lte: maxPrice };
    }
    
    // Property type filter
    if (messageLower.includes('phòng trọ')) smartQuery.propertyType = 'phòng trọ';
    else if (messageLower.includes('chung cư') || messageLower.includes('chung cu')) smartQuery.propertyType = 'chung cư mini';
    else if (messageLower.includes('nhà nguyên căn') || messageLower.includes('nha nguyen can')) smartQuery.propertyType = 'nhà nguyên căn';
    
    const properties = await Property.find(smartQuery)
      .select('title price address.district address.city area propertyType amenities') // Fields cần thiết
      .sort({ createdAt: -1 }) // Ưu tiên phòng mới
      .limit(25) // Tăng lên 25 để có nhiều lựa chọn hơn
      .lean();

    // Convert history format
    const chatHistory = history?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    const result = await geminiService.searchWithAI(message, chatHistory, properties);

    // Nếu quota exceeded và không có fallback, dùng traditional search
    let recommendedProperties = [];
    let fallbackUsed = false;
    let usingGroq = result.usingGroq || false;
    
    if (result.quotaExceeded && !result.usingGroq) {
      // Fallback: Traditional keyword search
      console.log('AI quota exceeded, falling back to traditional search');
      fallbackUsed = true;
      
      // Extract keywords from message
      const messageLower = message.toLowerCase();
      const keywords = messageLower.split(/\s+/).filter(w => w.length > 2);
      
      // Build search query with keyword matching
      const searchConditions = [];
      
      // Search in multiple fields
      keywords.forEach(keyword => {
        searchConditions.push(
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { 'address.city': { $regex: keyword, $options: 'i' } },
          { 'address.district': { $regex: keyword, $options: 'i' } },
          { 'address.ward': { $regex: keyword, $options: 'i' } }
        );
      });
      
      const searchQuery = {
        status: 'available',
        $or: searchConditions.length > 0 ? searchConditions : [
          { status: 'available' } // Return all available if no keywords
        ]
      };
      
      recommendedProperties = await Property.find(searchQuery)
        .select('title propertyType price address area bedrooms bathrooms amenities images status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      
      // If no results with keywords, return latest properties
      if (recommendedProperties.length === 0) {
        recommendedProperties = await Property.find({ status: 'available' })
          .select('title propertyType price address area bedrooms bathrooms amenities images status')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean();
      }
    } else if (result.propertyIds && result.propertyIds.length > 0) {
      // Nếu có propertyIds từ AI, fetch thông tin chi tiết
      recommendedProperties = await Property.find({
        _id: { $in: result.propertyIds }
      })
      .select('title propertyType price address area bedrooms bathrooms amenities images status')
      .lean();
    }

    res.status(200).json({
      success: true,
      fallbackUsed: fallbackUsed,
      usingGroq: usingGroq,
      data: {
        message: result.message,
        isComplete: result.isComplete || fallbackUsed,
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

/**
 * @desc    NLP Search - Tìm kiếm bằng ngôn ngữ tự nhiên
 * @route   POST /api/ai/nlp-search
 * @access  Public
 */
exports.nlpSearch = async (req, res, next) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập câu tìm kiếm'
      });
    }

    console.log('🔍 NLP Search Request:', query);

    const result = await nlpSearchService.searchWithNLP(query, { limit: limit || 50 });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ NLP Search Controller Error:', error);
    next(error);
  }
};

/**
 * @desc    Multi-language Search - Hỗ trợ nhiều ngôn ngữ
 * @route   POST /api/ai/multilang-search
 * @access  Public
 */
exports.multiLangSearch = async (req, res, next) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please enter search query / Vui lòng nhập câu tìm kiếm'
      });
    }

    console.log('🌐 Multi-language Search Request:', query);

    const result = await nlpSearchService.searchMultiLanguage(query, { limit: limit || 50 });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Multi-language Search Error:', error);
    next(error);
  }
};

/**
 * @desc    Parse query - Phân tích câu tìm kiếm
 * @route   POST /api/ai/parse-query
 * @access  Public
 */
exports.parseQuery = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập câu tìm kiếm'
      });
    }

    const parsed = await nlpSearchService.parseNaturalLanguageQuery(query);

    res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('❌ Parse Query Error:', error);
    next(error);
  }
};

module.exports = exports;
