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
4. Kết thúc bằng [SEARCH_COMPLETE] để hệ thống hiển thị kết quả

Lưu ý:
- Nếu không có phòng nào phù hợp, hãy gợi ý mở rộng tiêu chí
- Không tự ý tạo ra thông tin phòng không có trong danh sách`;

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

    // Kiểm tra xem AI đã hoàn thành tìm kiếm chưa
    const isComplete = text.includes('[SEARCH_COMPLETE]');
    const cleanText = text.replace('[SEARCH_COMPLETE]', '').trim();

    return {
      success: true,
      message: cleanText,
      isComplete: isComplete,
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

module.exports = exports;
