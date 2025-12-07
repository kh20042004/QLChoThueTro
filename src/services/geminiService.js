/**
 * ===================================
 * AI SERVICE (Gemini + Groq Fallback)
 * Tích hợp Google Gemini 2.5 Flash với Groq làm dự phòng
 * ===================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Khởi tạo Groq AI (Fallback)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Lấy model Gemini 2.5 Flash
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-latest',
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
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Check if it's a quota error
      if (error.status === 429) {
        if (i === maxRetries - 1) throw error; // Last retry, throw error
        
        // Extract retry delay from error if available
        let retryDelay = baseDelay * Math.pow(2, i);
        if (error.errorDetails) {
          const retryInfo = error.errorDetails.find(d => d['@type']?.includes('RetryInfo'));
          if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
            retryDelay = seconds * 1000;
          }
        }
        
        console.log(`Quota exceeded. Retrying in ${retryDelay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(retryDelay);
      } else {
        throw error; // Not a quota error, throw immediately
      }
    }
  }
};

/**
 * Chat với Groq AI (Fallback)
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat
 * @returns {Object} - Response từ AI
 */
const chatWithGroq = async (message, history = []) => {
  try {
    // Convert history to Groq format
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];

    // Limit to last 6 messages for faster response
    const recentHistory = history.slice(-6);
    recentHistory.forEach(item => {
      if (item.role && item.parts && item.parts[0]?.text) {
        messages.push({
          role: item.role === 'model' ? 'assistant' : 'user',
          content: item.parts[0].text
        });
      }
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant', // Faster model
      temperature: 0.7,
      max_tokens: 1024, // Reduced for speed
      top_p: 0.95,
    });

    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời.',
      usingGroq: true,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
};

/**
 * Chat với AI (Groq Primary, Gemini Fallback)
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat (optional)
 * @returns {Object} - Response từ AI
 */
exports.chat = async (message, history = []) => {
  // Validate history
  const validHistory = (history || []).filter(item => {
    return item && item.role && item.parts && Array.isArray(item.parts) && 
           item.parts.length > 0 && item.parts[0].text && item.parts[0].text.trim() !== '';
  });

  // Try Groq first (Primary)
  try {
    console.log('🚀 Using Groq AI (Primary)...');
    const groqResult = await chatWithGroq(message, validHistory);
    return {
      ...groqResult,
      usingGroq: true,
      primary: true
    };
  } catch (groqError) {
    console.error('Groq AI Error:', groqError);
    console.log('🔄 Groq failed, switching to Gemini fallback...');
    
    // Fallback to Gemini
    try {
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

      const result = await retryWithBackoff(async () => {
        return await chat.sendMessage(message);
      });
      
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        usingGemini: true,
        fallbackUsed: true,
        timestamp: new Date()
      };
    } catch (geminiError) {
      console.error('Gemini AI Error:', geminiError);
      return {
        success: false,
        error: 'ALL_AI_FAILED',
        message: 'Xin lỗi, cả Groq và Gemini đều đang gặp sự cố. Vui lòng thử lại sau. 😔',
        timestamp: new Date()
      };
    }
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
 * Search với Groq AI (Fallback)
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat
 * @param {Array} properties - Danh sách properties
 * @returns {Object} - Kết quả tìm kiếm
 */
const searchWithGroq = async (message, history = [], properties = []) => {
  try {
    const searchSystemPrompt = `Bạn là AI Assistant chuyên tìm kiếm và tư vấn phòng trọ/nhà cho thuê tại Việt Nam.

NHIỆM VỤ:
1. Hỏi đáp thân thiện để hiểu nhu cầu: vị trí, giá, loại phòng, tiện ích
2. **QUAN TRỌNG**: Chỉ gợi ý phòng THỰC SỰ PHÙ HỢP với yêu cầu (vị trí, giá, loại phòng)
3. Nếu không có phòng phù hợp trong danh sách, hãy THỪA NHẬN và gợi ý mở rộng tiêu chí

DANH SÁCH PHÒNG HIỆN CÓ (${properties.length} phòng đã được lọc sơ bộ):
${properties.slice(0, 25).map((p, i) => 
  `${i+1}. ID:${p._id}
   Tên: ${p.title}
   Giá: ${p.price} triệu/tháng
   Vị trí: ${p.address?.district || 'N/A'}, ${p.address?.city || 'N/A'}
   Diện tích: ${p.area}m²
   Loại: ${p.propertyType || 'N/A'}
   Tiện ích: ${p.amenities?.join(', ') || 'N/A'}`
).join('\n\n')}

QUY TẮC GỢI Ý:
✅ CHỈ gợi ý nếu phòng THỰC SỰ phù hợp với:
   - Vị trí (quận/huyện khớp với yêu cầu)
   - Giá tiền (trong khoảng ±20% ngân sách)
   - Loại phòng (phòng trọ, chung cư, nhà nguyên căn...)
   
❌ KHÔNG gợi ý nếu:
   - Vị trí không khớp (VD: hỏi Quận 4 nhưng gợi Quận 7)
   - Giá quá cao (VD: ngân sách 5tr nhưng gợi phòng 8-10tr)
   - Loại phòng sai (VD: hỏi phòng trọ nhưng gợi nhà nguyên căn)

CÁCH TRẢ LỜI:
- Thân thiện, nhiệt tình, emoji phù hợp (🏠, 💰, 📍, ✅)
- Nếu KHÔNG CÓ phòng phù hợp: "Hiện tại chưa có phòng phù hợp với yêu cầu của bạn. Bạn có thể thử mở rộng..."
- Nếu CÓ phòng phù hợp: Giải thích rõ TẠI SAO phù hợp

FORMAT KẾT QUẢ (bắt buộc khi gợi ý phòng):
[RESULTS:id1,id2,id3]

VÍ DỤ phản hồi đúng:
"Dạ, tôi tìm được 2 phòng phù hợp tại Quận 4 trong ngân sách của bạn:

1. Phòng trọ 40m² tại Quận 1 - 8 triệu/tháng
   Lý do: Gần trường học, giá phù hợp ngân sách

2. Phòng trọ 45m² tại Quận 4 - 9.2 triệu/tháng  
   Lý do: Diện tích rộng hơn, tiện ích đầy đủ

[RESULTS:507f1f77bcf86cd799439011,507f191e810c19729de860ea]"

LƯU Ý:
- KHÔNG tạo thông tin phòng giả
- KHÔNG bỏ qua format [RESULTS:...]
- CHỈ gợi ý phòng có trong danh sách`;

    const messages = [
      { role: 'system', content: searchSystemPrompt }
    ];

    history.forEach(item => {
      if (item.role && item.parts && item.parts[0]?.text) {
        messages.push({
          role: item.role === 'model' ? 'assistant' : 'user',
          content: item.parts[0].text
        });
      }
    });

    messages.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant', // Faster model for search
      temperature: 0.7,
      max_tokens: 800, // Reduced for faster response
      top_p: 0.95,
    });

    const text = completion.choices[0]?.message?.content || '';
    let propertyIds = [];
    let cleanText = text;
    
    // Try to match both [RESULTS:...] and RESULTS:... formats
    const resultsMatch = text.match(/\[?RESULTS:([^\]]+)\]?/i);
    if (resultsMatch) {
      const idsString = resultsMatch[1];
      propertyIds = idsString.split(',').map(id => id.trim()).filter(id => id);
      // Remove the RESULTS pattern from text
      cleanText = text.replace(/\[?RESULTS:[^\]]+\]?/gi, '').trim();
    }

    return {
      success: true,
      message: cleanText,
      isComplete: propertyIds.length > 0,
      propertyIds: propertyIds,
      usingGroq: true,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Groq Search Error:', error);
    throw error;
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
 * AI Search Assistant - Tìm kiếm phòng bằng hội thoại (Groq Primary, Gemini Fallback)
 * @param {String} message - Tin nhắn từ user
 * @param {Array} history - Lịch sử chat
 * @param {Array} properties - Danh sách properties hiện có
 * @returns {Object} - Response từ AI với kết quả tìm kiếm
 */
exports.searchWithAI = async (message, history = [], properties = []) => {
  // Validate history
  const validHistory = (history || []).filter(item => {
    return item && item.role && item.parts && Array.isArray(item.parts) && 
           item.parts.length > 0 && item.parts[0].text && item.parts[0].text.trim() !== '';
  });

  // Try Groq first (Primary)
  try {
    console.log('🚀 Using Groq AI for search (Primary)...');
    const groqResult = await searchWithGroq(message, validHistory, properties);
    return {
      ...groqResult,
      usingGroq: true,
      primary: true
    };
  } catch (groqError) {
    console.error('Groq Search Error:', groqError);
    console.log('🔄 Groq failed, switching to Gemini fallback...');
    
    // Fallback to Gemini
    try {
      // System prompt đặc biệt cho tìm kiếm - GEMINI FALLBACK
      const searchSystemPrompt = `Bạn là AI Assistant chuyên tìm kiếm và tư vấn phòng trọ/nhà cho thuê tại Việt Nam.

NHIỆM VỤ:
1. Hỏi đáp thân thiện để hiểu nhu cầu: vị trí, giá, loại phòng, tiện ích
2. **QUAN TRỌNG**: Chỉ gợi ý phòng THỰC SỰ PHÙ HỢP với yêu cầu (vị trí, giá, loại phòng)
3. Nếu không có phòng phù hợp trong danh sách, hãy THỪA NHẬN và gợi ý mở rộng tiêu chí

DANH SÁCH PHÒNG HIỆN CÓ (${properties.length} phòng đã được lọc sơ bộ):
${JSON.stringify(properties.slice(0, 25).map(p => ({
  id: p._id,
  title: p.title,
  type: p.propertyType,
  price: p.price,
  location: `${p.address?.district || 'N/A'}, ${p.address?.city || 'N/A'}`,
  area: p.area,
  amenities: p.amenities
})), null, 2)}

QUY TẮC GỢI Ý:
✅ CHỈ gợi ý nếu phòng THỰC SỰ phù hợp với:
   - Vị trí (quận/huyện khớp với yêu cầu)
   - Giá tiền (trong khoảng ±20% ngân sách)
   - Loại phòng (phòng trọ, chung cư, nhà nguyên căn...)
   
❌ KHÔNG gợi ý nếu:
   - Vị trí không khớp (VD: hỏi Quận 4 nhưng gợi Quận 7)
   - Giá quá cao (VD: ngân sách 5tr nhưng gợi phòng 8-10tr)
   - Loại phòng sai (VD: hỏi phòng trọ nhưng gợi nhà nguyên căn)

CÁCH TRẢ LỜI:
- Thân thiện, nhiệt tình, emoji phù hợp
- Nếu KHÔNG CÓ phòng phù hợp: "Hiện tại chưa có phòng phù hợp. Bạn có thể thử mở rộng..."
- Nếu CÓ phòng phù hợp: Giải thích rõ TẠI SAO phù hợp

FORMAT KẾT QUẢ (khi gợi ý phòng):
[RESULTS:ID1,ID2,ID3]

Lưu ý:
- LUÔN trả về [RESULTS:...] ở cuối khi đã gợi ý phòng cụ thể`;

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

      // Gửi message với retry logic
      const result = await retryWithBackoff(async () => {
        return await chat.sendMessage(message);
      }, 2, 1000); // Retry up to 2 times for search
      
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
        usingGemini: true,
        fallbackUsed: true,
        timestamp: new Date()
      };
    } catch (geminiError) {
      console.error('Gemini Search Error:', geminiError);
      return {
        success: false,
        error: 'ALL_AI_FAILED',
        quotaExceeded: true,
        message: 'AI search đang quá tải. Hệ thống sẽ tự động chuyển sang tìm kiếm thông thường. 🔍',
      };
    }
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
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-latest' });

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
