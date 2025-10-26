/**
 * ===================================
 * GEMINI AI SERVICE
 * Tích hợp Google Gemini 2.5 Flash
 * ===================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Lấy model Gemini 2.5 Flash
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  }
});

/**
 * System prompt cho chatbot tư vấn phòng trọ
 */
const SYSTEM_PROMPT = `Bạn là AI Assistant cho hệ thống cho thuê phòng trọ/nhà ở Việt Nam. 

Vai trò của bạn:
- Tư vấn cho khách hàng về dịch vụ cho thuê phòng trọ, nhà nguyên căn, căn hộ, chung cư mini
- Giải đáp thắc mắc về quy trình thuê phòng, giá cả, tiện ích
- Hỗ trợ tìm kiếm phòng phù hợp với nhu cầu
- Hướng dẫn cách đăng ký tài khoản, đăng tin
- Giải thích các chính sách, quy định của hệ thống

Thông tin về dịch vụ:
- Hệ thống cung cấp: Phòng trọ, Nhà nguyên căn, Căn hộ, Chung cư mini, Homestay
- Hỗ trợ đăng tin miễn phí cho chủ nhà
- Tìm kiếm theo vị trí, giá, diện tích, tiện ích
- Hỗ trợ đặt phòng trực tuyến
- Đánh giá và review từ người thuê thực tế
- Bảo mật thông tin, giao dịch an toàn

Phong cách giao tiếp:
- Thân thiện, nhiệt tình, chuyên nghiệp
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu, súc tích
- Sử dụng emoji phù hợp (🏠, 💰, 📍, ✅, 🔍, ...)
- Hỏi lại để hiểu rõ nhu cầu nếu câu hỏi chưa rõ ràng

Lưu ý:
- Không trả lời các câu hỏi không liên quan đến bất động sản, cho thuê phòng
- Không cung cấp thông tin cá nhân của người dùng
- Không đưa ra lời khuyên pháp lý hoặc tài chính chuyên sâu
- Khuyến khích người dùng liên hệ trực tiếp nếu cần tư vấn chi tiết`;

/**
 * Chat với Gemini AI
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat (optional)
 * @returns {Object} - Response từ AI
 */
exports.chat = async (message, history = []) => {
  try {
    // Lọc và validate history
    const validHistory = (history || []).filter(item => {
      return item && 
             item.role && 
             item.parts && 
             Array.isArray(item.parts) && 
             item.parts.length > 0 &&
             item.parts[0].text &&
             item.parts[0].text.trim() !== '';
    });

    // Tạo chat session với history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Chào bạn! 👋 Tôi là trợ lý AI của hệ thống cho thuê phòng trọ. Tôi có thể giúp gì cho bạn hôm nay? 🏠' }],
        },
        ...validHistory
      ],
    });

    // Gửi message và nhận response
    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      message: text,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu',
      message: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau. 🙏'
    };
  }
};

/**
 * Generate content về property recommendation
 * @param {Object} userPreferences - Sở thích của user
 * @returns {Object} - Gợi ý từ AI
 */
exports.getPropertyRecommendation = async (userPreferences) => {
  try {
    const { budget, location, propertyType, amenities } = userPreferences;

    const prompt = `Dựa trên thông tin sau, hãy tư vấn và gợi ý loại phòng phù hợp:
- Ngân sách: ${budget ? `${budget.toLocaleString('vi-VN')} VNĐ/tháng` : 'Chưa xác định'}
- Khu vực: ${location || 'Chưa xác định'}
- Loại hình: ${propertyType || 'Chưa xác định'}
- Tiện ích mong muốn: ${amenities?.join(', ') || 'Chưa xác định'}

Hãy đưa ra:
1. Đánh giá về khả năng tìm được phòng phù hợp
2. Gợi ý 3 khu vực phù hợp với ngân sách
3. Các tiện ích nên ưu tiên
4. Lời khuyên về giá cả và thời điểm thuê tốt nhất`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      recommendation: text
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Analyze property description và suggest improvements
 * @param {String} description - Mô tả property
 * @returns {Object} - Phân tích và gợi ý
 */
exports.analyzePropertyDescription = async (description) => {
  try {
    const prompt = `Phân tích mô tả phòng trọ sau và đưa ra gợi ý cải thiện:

"${description}"

Hãy:
1. Đánh giá mức độ hấp dẫn của mô tả (1-10)
2. Chỉ ra điểm mạnh và điểm yếu
3. Gợi ý 3-5 cải thiện cụ thể để thu hút khách hàng hơn
4. Viết lại mô tả theo phong cách chuyên nghiệp, hấp dẫn hơn`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      analysis: text
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * AI Search Assistant - Tìm kiếm phòng bằng hội thoại
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat
 * @param {Array} properties - Danh sách properties hiện có
 * @returns {Object} - Response từ AI với kết quả tìm kiếm
 */
exports.searchWithAI = async (message, history = [], properties = []) => {
  try {
    // System prompt đặc biệt cho tìm kiếm
    const searchSystemPrompt = `Bạn là AI Assistant chuyên giúp tìm kiếm phòng trọ/nhà cho thuê tại Việt Nam.

Nhiệm vụ của bạn:
1. Hỏi đáp với khách hàng để hiểu rõ nhu cầu: vị trí, giá, loại phòng, tiện ích
2. Phân tích yêu cầu và đưa ra gợi ý phù hợp
3. Khi đã hiểu rõ nhu cầu, trả về kết quả tìm kiếm

Thông tin bạn cần thu thập:
- 📍 Vị trí/Khu vực mong muốn
- 💰 Ngân sách (khoảng giá)
- 🏠 Loại hình: Phòng trọ, Nhà nguyên căn, Căn hộ, Chung cư mini
- 📏 Diện tích mong muốn (tùy chọn)
- 🛏️ Số phòng ngủ (tùy chọn)
- ⭐ Tiện ích cần thiết: Wifi, Điều hòa, Bếp, Gửi xe, Nóng lạnh...

Phong cách giao tiếp:
- Thân thiện, nhiệt tình như một tư vấn viên thực sự
- Hỏi từng thông tin một, không hỏi quá nhiều cùng lúc
- Sử dụng emoji để sinh động
- Gợi ý các lựa chọn phổ biến nếu user chưa rõ

Danh sách properties hiện có:
${JSON.stringify(properties.map(p => ({
  id: p._id,
  title: p.title,
  type: p.propertyType,
  price: p.price,
  location: p.address,
  area: p.area,
  bedrooms: p.bedrooms,
  amenities: p.amenities
})), null, 2)}

Khi đã có đủ thông tin, hãy:
1. Tóm tắt lại yêu cầu của khách
2. Gợi ý 2-3 phòng phù hợp nhất từ danh sách
3. Giải thích tại sao gợi ý những phòng đó
4. **QUAN TRỌNG**: Kết thúc bằng format đặc biệt:
   [RESULTS:ID1,ID2,ID3]
   Ví dụ: [RESULTS:507f1f77bcf86cd799439011,507f191e810c19729de860ea]

Lưu ý:
- Nếu không có phòng nào phù hợp, hãy gợi ý mở rộng tiêu chí
- Không tự ý tạo ra thông tin phòng không có trong danh sách
- LUÔN trả về [RESULTS:...] ở cuối cùng khi đã gợi ý phòng`;

    // Validate history
    const validHistory = (history || []).filter(item => {
      return item && item.role && item.parts && Array.isArray(item.parts) && 
             item.parts.length > 0 && item.parts[0].text && item.parts[0].text.trim() !== '';
    });

    // Tạo chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: searchSystemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Xin chào! 👋 Tôi là trợ lý tìm kiếm phòng trọ bằng AI. Hãy cho tôi biết bạn đang tìm kiếm loại phòng như thế nào nhé? 🏠' }],
        },
        ...validHistory
      ],
    });

    // Gửi message
    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    // Parse kết quả tìm kiếm
    let propertyIds = [];
    let cleanText = text;
    
    // Tìm [RESULTS:ID1,ID2,ID3]
    const resultsMatch = text.match(/\[RESULTS:(.*?)\]/);
    if (resultsMatch) {
      const idsString = resultsMatch[1];
      propertyIds = idsString.split(',').map(id => id.trim()).filter(id => id);
      cleanText = text.replace(/\[RESULTS:.*?\]/, '').trim();
    }

    const isComplete = propertyIds.length > 0;

    return {
      success: true,
      message: cleanText,
      isComplete: isComplete,
      propertyIds: propertyIds,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('AI Search Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại! 😔'
    };
  }
};

/**
 * Generate FAQ responses
 * @param {String} question - Câu hỏi
 * @returns {Object} - Câu trả lời
 */
exports.answerFAQ = async (question) => {
  try {
    const prompt = `Với vai trò là chuyên gia tư vấn cho thuê phòng trọ tại Việt Nam, hãy trả lời câu hỏi sau một cách chi tiết, chuyên nghiệp:

"${question}"

Yêu cầu:
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu (2-4 đoạn)
- Cung cấp thông tin hữu ích, thực tế
- Sử dụng emoji phù hợp`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      answer: text
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Dự đoán giá thuê phòng bằng AI
 * @param {Object} propertyData - Thông tin phòng
 * @param {Array} marketData - Dữ liệu thị trường (giá các phòng tương tự)
 * @returns {Object} - Giá dự đoán và phân tích
 */
exports.predictPrice = async (propertyData, marketData = []) => {
  try {
    const { area, location, propertyType, bedrooms, bathrooms, amenities, floor, description } = propertyData;

    // Chuẩn bị dữ liệu thị trường
    const marketDataSummary = marketData.map(p => ({
      type: p.propertyType,
      area: p.area,
      location: `${p.address?.district}, ${p.address?.city}`,
      price: p.price,
      amenities: Object.keys(p.amenities || {}).filter(k => p.amenities[k])
    }));

    const prompt = `Bạn là chuyên gia định giá bất động sản cho thuê tại Việt Nam với nhiều năm kinh nghiệm.

THÔNG TIN PHÒNG CẦN ĐỊNH GIÁ:
- Loại hình: ${propertyType}
- Diện tích: ${area}m²
- Vị trí: ${location?.district || ''}, ${location?.city || ''}
- Số phòng ngủ: ${bedrooms || 'N/A'}
- Số phòng tắm: ${bathrooms || 'N/A'}
- Tầng: ${floor || 'N/A'}
- Tiện nghi: ${amenities && Object.keys(amenities).filter(k => amenities[k]).join(', ') || 'Chưa có thông tin'}
- Mô tả: ${description || 'Chưa có mô tả'}

DỮ LIỆU THỊ TRƯỜNG (${marketData.length} phòng tương tự):
${JSON.stringify(marketDataSummary, null, 2)}

NHIỆM VỤ:
1. Phân tích các yếu tố ảnh hưởng đến giá:
   - Vị trí (quận/huyện, khu vực trung tâm hay ngoại ô)
   - Diện tích và số phòng
   - Tiện nghi (wifi, điều hòa, nóng lạnh, gửi xe, bếp...)
   - Loại hình phòng
   - So sánh với giá thị trường

2. Dựa trên phân tích, đưa ra:
   - Giá thuê đề xuất (đơn vị: triệu VNĐ/tháng)
   - Khoảng giá hợp lý (min - max)
   - Lý do định giá
   - Gợi ý để tối ưu giá

YÊU CẦU ĐỊNH DẠNG RESPONSE:
Trả về JSON format như sau (CHỈ trả về JSON, không có text khác):
{
  "suggestedPrice": <số tiền đề xuất THEO VNĐ, ví dụ: 3000000 cho 3 triệu>,
  "priceRange": {
    "min": <giá tối thiểu THEO VNĐ>,
    "max": <giá tối đa THEO VNĐ>
  },
  "confidence": "<high|medium|low>",
  "analysis": {
    "locationScore": <1-10>,
    "amenitiesScore": <1-10>,
    "sizeScore": <1-10>,
    "marketComparison": "<higher|average|lower>"
  },
  "reasoning": "<giải thích ngắn gọn tại sao định giá này>",
  "suggestions": [
    "<gợi ý 1 để tăng giá>",
    "<gợi ý 2>"
  ]
}

VÍ DỤ:
- Nếu giá thuê là 3.5 triệu/tháng, suggestedPrice phải là 3500000
- Nếu khoảng giá là 3-4 triệu, min: 3000000, max: 4000000

LƯU Ý:
- Giá phải hợp lý với thị trường Việt Nam
- Xem xét kỹ vị trí (trung tâm vs ngoại ô)
- Tiện nghi càng đầy đủ thì giá càng cao
- Diện tích lớn hơn thường giá cao hơn theo tỷ lệ
- QUAN TRỌNG: suggestedPrice, min, max phải là số nguyên VNĐ, KHÔNG phải triệu`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    console.log('🤖 AI Response:', text);

    // Parse JSON từ response
    // Loại bỏ markdown code block nếu có
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const prediction = JSON.parse(text);
    
    console.log('📊 Parsed Prediction:', prediction);

    // Validate và fix giá nếu bị 0 hoặc null hoặc format sai
    let needsFix = false;
    
    // Fix 1: Nếu giá = 0 hoặc null
    if (!prediction.suggestedPrice || prediction.suggestedPrice === 0) {
      needsFix = true;
      console.warn('⚠️ Giá đề xuất bị 0 hoặc null');
    }
    
    // Fix 2: Nếu AI trả về giá dưới dạng "triệu" (< 1000) thay vì VNĐ
    if (prediction.suggestedPrice && prediction.suggestedPrice < 1000) {
      console.warn('⚠️ AI trả về giá dạng triệu VNĐ, converting...');
      prediction.suggestedPrice = Math.round(prediction.suggestedPrice * 1000000);
      if (prediction.priceRange) {
        prediction.priceRange.min = Math.round((prediction.priceRange.min || 0) * 1000000);
        prediction.priceRange.max = Math.round((prediction.priceRange.max || 0) * 1000000);
      }
      console.log('✅ Giá sau convert:', prediction.suggestedPrice);
    }
    
    // Fix 3: Nếu vẫn cần fix (giá = 0 ban đầu)
    if (needsFix) {
      console.warn('⚠️ Tính toán lại giá...');
      
      // Tính giá dựa trên market data
      if (marketData.length > 0) {
        const avgPrice = marketData.reduce((sum, p) => sum + (p.price || 0), 0) / marketData.length;
        prediction.suggestedPrice = Math.round(avgPrice);
        prediction.priceRange = {
          min: Math.round(avgPrice * 0.8),
          max: Math.round(avgPrice * 1.2)
        };
        console.log('✅ Giá từ market data:', prediction.suggestedPrice);
      } else {
        // Fallback: Giá mặc định dựa trên diện tích và loại hình
        const basePrice = area * 100000; // 100k/m2 base
        const typeMultiplier = {
          'phong-tro': 1.0,
          'nha-nguyen-can': 1.5,
          'can-ho': 1.8,
          'chung-cu-mini': 1.3,
          'homestay': 1.2
        };
        const multiplier = typeMultiplier[propertyType] || 1.0;
        prediction.suggestedPrice = Math.round(basePrice * multiplier);
        prediction.priceRange = {
          min: Math.round(prediction.suggestedPrice * 0.8),
          max: Math.round(prediction.suggestedPrice * 1.2)
        };
        console.log('✅ Giá fallback:', prediction.suggestedPrice);
      }
    }
    
    // Đảm bảo các giá trị tối thiểu hợp lý
    prediction.suggestedPrice = Math.max(prediction.suggestedPrice || 0, 500000); // Tối thiểu 500k
    if (prediction.priceRange) {
      prediction.priceRange.min = Math.max(prediction.priceRange.min || 0, 500000);
      prediction.priceRange.max = Math.max(prediction.priceRange.max || 0, prediction.suggestedPrice);
    }

    return {
      success: true,
      prediction: prediction
    };
  } catch (error) {
    console.error('Price Prediction Error:', error);
    return {
      success: false,
      error: error.message,
      prediction: null
    };
  }
};

/**
 * Phân tích hình ảnh phòng để đánh giá chất lượng (hỗ trợ định giá)
 * @param {String} imageUrl - URL hình ảnh
 * @returns {Object} - Đánh giá chất lượng
 */
exports.analyzePropertyImage = async (imageUrl) => {
  try {
    // Gemini Vision API để phân tích hình ảnh
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Phân tích hình ảnh phòng trọ/nhà cho thuê này và đánh giá:
1. Chất lượng nội thất (1-10)
2. Mức độ sạch sẽ, gọn gàng (1-10)
3. Ánh sáng tự nhiên (1-10)
4. Tình trạng tổng thể (mới/cũ/xuống cấp)
5. Các tiện nghi nhìn thấy được

Trả về JSON format:
{
  "qualityScore": <1-10>,
  "cleanliness": <1-10>,
  "lighting": <1-10>,
  "condition": "<new|good|average|old>",
  "visibleAmenities": ["item1", "item2"],
  "priceImpact": "<positive|neutral|negative>",
  "notes": "<ghi chú ngắn>"
}`;

    const imagePart = {
      inlineData: {
        data: imageUrl,
        mimeType: 'image/jpeg'
      }
    };

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(text);

    return {
      success: true,
      analysis: analysis
    };
  } catch (error) {
    console.error('Image Analysis Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = exports;
