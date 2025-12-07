/**
 * ===================================
 * NLP SEARCH SERVICE
 * AI-Powered Search with Natural Language Processing
 * Priority: Groq (Primary) → Gemini (Fallback)
 * ===================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Property = require('../models/Property');

// Khởi tạo Groq AI (Primary)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Khởi tạo Gemini AI (Fallback)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-latest',
  generationConfig: {
    temperature: 0.3,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

/**
 * Danh sách trường đại học phổ biến tại Việt Nam
 * Key: viết tắt hoặc tên gọi thường dùng (lowercase)
 */
const UNIVERSITIES = {
  // Đại học Bách Khoa
  'bk': { name: 'Đại học Bách Khoa', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  'bach khoa': { name: 'Đại học Bách Khoa', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  'hcmut': { name: 'Đại học Bách Khoa', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  'bách khoa': { name: 'Đại học Bách Khoa', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Khoa học Tự nhiên
  'khtn': { name: 'Đại học Khoa học Tự nhiên', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  'hcmus': { name: 'Đại học Khoa học Tự nhiên', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  'khoa hoc tu nhien': { name: 'Đại học Khoa học Tự nhiên', district: 'Quận Thủ Đức', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Kinh tế
  'ueh': { name: 'Đại học Kinh tế', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  'kinh te': { name: 'Đại học Kinh tế', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  'kinh tế': { name: 'Đại học Kinh tế', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Sư phạm
  'su pham': { name: 'Đại học Sư phạm', district: 'Quận 5', city: 'TP. Hồ Chí Minh' },
  'sư phạm': { name: 'Đại học Sư phạm', district: 'Quận 5', city: 'TP. Hồ Chí Minh' },
  'hcmue': { name: 'Đại học Sư phạm', district: 'Quận 5', city: 'TP. Hồ Chí Minh' },
  'sp': { name: 'Đại học Sư phạm', district: 'Quận 5', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Tôn Đức Thắng
  'ton duc thang': { name: 'Đại học Tôn Đức Thắng', district: 'Quận 7', city: 'TP. Hồ Chí Minh' },
  'tôn đức thắng': { name: 'Đại học Tôn Đức Thắng', district: 'Quận 7', city: 'TP. Hồ Chí Minh' },
  'tdtu': { name: 'Đại học Tôn Đức Thắng', district: 'Quận 7', city: 'TP. Hồ Chí Minh' },
  'tdt': { name: 'Đại học Tôn Đức Thắng', district: 'Quận 7', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Văn Lang
  'van lang': { name: 'Đại học Văn Lang', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  'văn lang': { name: 'Đại học Văn Lang', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  'vl': { name: 'Đại học Văn Lang', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Ngoại ngữ - Tin học
  'huflit': { name: 'Đại học Ngoại ngữ - Tin học', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  
  // Đại học Công nghệ TP.HCM - HUTECH
  'hutech': { name: 'Đại học Công nghệ TP.HCM', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
  'cong nghe': { name: 'Đại học Công nghệ TP.HCM', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh' },
};

/**
 * Expand university abbreviations trong query
 * VD: "ueh" → "gần Đại học Kinh tế UEH ở Quận Bình Thạnh"
 */
function expandUniversityQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Kiểm tra nếu đã được expand rồi (tránh double expansion)
  if (lowerQuery.includes('gần đại học') || lowerQuery.includes('tại quận')) {
    return query; // Đã expand rồi
  }
  
  // Tìm university match
  for (const [key, uni] of Object.entries(UNIVERSITIES)) {
    // Match whole word hoặc kèm "gần", "near", "ở"
    const patterns = [
      new RegExp(`\\b${key}\\b`, 'i'),
      new RegExp(`gần\\s*${key}\\b`, 'i'),
      new RegExp(`near\\s*${key}\\b`, 'i'),
      new RegExp(`ở\\s*${key}\\b`, 'i'),
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(lowerQuery)) {
        // Expand query với thông tin đầy đủ
        const expanded = `${query} gần ${uni.name} tại ${uni.district} ${uni.city}`;
        console.log(`🎓 University detected: "${key}" → "${uni.name}" (${uni.district})`);
        console.log(`🔄 Expanded query: "${query}" → "${expanded}"`);
        return expanded;
      }
    }
  }
  
  return query; // Không tìm thấy university
}

/**
 * Parse query bằng NLP (AI)
 * @param {string} query - Câu truy vấn ngôn ngữ tự nhiên
 * @returns {Promise<Object>} - Parsed search parameters
 */
async function parseNaturalLanguageQuery(query) {
  try {
    // Expand university abbreviations trước khi parse
    const expandedQuery = expandUniversityQuery(query);
    
    const prompt = `Bạn là AI chuyên phân tích câu tìm kiếm bất động sản.
Hãy phân tích câu sau và trích xuất thông tin theo định dạng JSON chính xác:

Câu tìm kiếm: "${expandedQuery}"

Trả về JSON với các trường (chỉ trả JSON, không giải thích):
{
  "propertyType": "phong-tro" | "nha-nguyen-can" | "can-ho" | "chung-cu-mini" | "homestay" | null,
  "priceMin": number | null,
  "priceMax": number | null,
  "areaMin": number | null,
  "areaMax": number | null,
  "location": {
    "city": string | null,
    "district": string | null,
    "ward": string | null,
    "university": string | null
  },
  "amenities": {
    "wifi": boolean,
    "ac": boolean,
    "parking": boolean,
    "kitchen": boolean,
    "water": boolean,
    "laundry": boolean,
    "balcony": boolean,
    "security": boolean
  },
  "preferences": {
    "gender": "male" | "female" | "all" | null,
    "pets": boolean | null,
    "smoking": boolean | null
  },
  "bedrooms": number | null,
  "bathrooms": number | null,
  "intent": string
}

Lưu ý:
- Giá bằng triệu (3tr = 3000000, 5 triệu = 5000000)
- "3-4tr" → priceMin: 3000000, priceMax: 4000000
- "dưới 5tr" → priceMax: 5000000
- "trên 10tr" → priceMin: 10000000
- Diện tích tính bằng m² (20-30m → areaMin: 20, areaMax: 30)
- "gần BK/Bách Khoa" → university: "Đại học Bách Khoa"
- "cho nữ/nữ ở" → gender: "female"
- "cho nam" → gender: "male"
- "ban công" → balcony: true
- "có wifi" → wifi: true
- intent: mô tả ngắn gọn ý định tìm kiếm`;

    // Try Groq first (Primary)
    try {
      console.log('🚀 Using Groq AI for NLP parsing...');
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // Extract JSON từ response
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Post-processing: Chuẩn hóa dữ liệu
      if (parsed.location?.university) {
        const uniKey = parsed.location.university.toLowerCase();
        for (const [key, uni] of Object.entries(UNIVERSITIES)) {
          if (uniKey.includes(key)) {
            parsed.location.district = uni.district;
            parsed.location.city = uni.city;
            break;
          }
        }
      }
      
      console.log('✅ Groq NLP Parsed Query:', JSON.stringify(parsed, null, 2));
      return parsed;
      
    } catch (groqError) {
      console.warn('⚠️ Groq failed, trying Gemini fallback:', groqError.message);
      
      // Fallback to Gemini
      try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON từ response
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '');
        }
        
        const parsed = JSON.parse(jsonText);
        
        // Post-processing
        if (parsed.location?.university) {
          const uniKey = parsed.location.university.toLowerCase();
          for (const [key, uni] of Object.entries(UNIVERSITIES)) {
            if (uniKey.includes(key)) {
              parsed.location.district = uni.district;
              parsed.location.city = uni.city;
              break;
            }
          }
        }
        
        console.log('✅ Gemini NLP Parsed Query:', JSON.stringify(parsed, null, 2));
        return parsed;
        
      } catch (geminiError) {
        console.error('❌ Both AI services failed:', geminiError.message);
        // Final fallback: Simple parsing
        console.log('🔄 Using fallback parsing...');
        return parseQueryFallback(query);
      }
    }
    
  } catch (error) {
    console.error('❌ NLP Parse Error:', error.message);
    console.log('🔄 Using fallback parsing...');
    return parseQueryFallback(query);
  }
}

/**
 * Fallback parser khi AI không khả dụng
 * @param {string} query - Query string
 * @returns {Object} - Parsed object
 */
function parseQueryFallback(query) {
  const parsed = {
    propertyType: null,
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    location: {},
    amenities: {},
    preferences: {},
    intent: query
  };
  
  const lowerQuery = query.toLowerCase();
  
  // Extract price
  const pricePatterns = [
    /([0-9]+)-([0-9]+)\s*(tr|triệu|trieu|million)/i,
    /dưới\s*([0-9]+)\s*(tr|triệu|trieu)/i,
    /trên\s*([0-9]+)\s*(tr|triệu|trieu)/i,
    /under\s*([0-9]+)\s*(million|m)/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (match[0].includes('-')) {
        parsed.priceMin = parseInt(match[1]) * 1000000;
        parsed.priceMax = parseInt(match[2]) * 1000000;
      } else if (match[0].match(/dưới|under/i)) {
        parsed.priceMax = parseInt(match[1]) * 1000000;
      } else if (match[0].match(/trên|over/i)) {
        parsed.priceMin = parseInt(match[1]) * 1000000;
      }
      break;
    }
  }
  
  // Extract location
  if (lowerQuery.includes('bk') || lowerQuery.includes('bách khoa') || lowerQuery.includes('bach khoa')) {
    parsed.location.district = 'Quận Thủ Đức';
    parsed.location.university = 'Đại học Bách Khoa';
  }
  
  const districts = ['quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 
                     'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 'thủ đức', 'bình thạnh'];
  for (const district of districts) {
    if (lowerQuery.includes(district)) {
      parsed.location.district = district.charAt(0).toUpperCase() + district.slice(1);
      break;
    }
  }
  
  // Extract amenities
  if (lowerQuery.includes('wifi')) parsed.amenities.wifi = true;
  if (lowerQuery.includes('máy lạnh') || lowerQuery.includes('ac')) parsed.amenities.ac = true;
  if (lowerQuery.includes('ban công') || lowerQuery.includes('balcony')) parsed.amenities.balcony = true;
  if (lowerQuery.includes('đậu xe') || lowerQuery.includes('parking')) parsed.amenities.parking = true;
  
  // Extract gender
  if (lowerQuery.includes('nữ') || lowerQuery.includes('female') || lowerQuery.includes('cho nữ')) {
    parsed.preferences.gender = 'female';
  } else if (lowerQuery.includes('nam') || lowerQuery.includes('male') || lowerQuery.includes('cho nam')) {
    parsed.preferences.gender = 'male';
  }
  
  console.log('🔄 Fallback Parsed:', JSON.stringify(parsed, null, 2));
  return parsed;
}

/**
 * Property Type Mapping - 2 chiều Vietnamese ⟷ Slug
 */
const PROPERTY_TYPE_MAPPING = {
  // Slug format (DB format)
  'phong-tro': ['phong-tro', 'phòng trọ', 'phong tro', 'room', 'rental room'],
  'nha-nguyen-can': ['nha-nguyen-can', 'nhà nguyên căn', 'nha nguyen can', 'whole house', 'house'],
  'can-ho': ['can-ho', 'căn hộ', 'can ho', 'apartment', 'flat'],
  'chung-cu-mini': ['chung-cu-mini', 'chung cư mini', 'chung cu mini', 'mini apartment'],
  'homestay': ['homestay', 'home stay']
};

/**
 * Normalize property type - Chuyển bất kỳ format nào về slug format
 */
function normalizePropertyType(input) {
  if (!input) return null;
  
  const normalized = input.toLowerCase().trim();
  
  // Tìm trong mapping
  for (const [slug, variants] of Object.entries(PROPERTY_TYPE_MAPPING)) {
    if (variants.some(v => normalized === v || normalized.includes(v))) {
      return slug;
    }
  }
  
  // Nếu không tìm thấy, return input gốc
  return normalized;
}

/**
 * Build MongoDB query từ parsed parameters
 * @param {Object} parsed - Parsed parameters từ NLP
 * @returns {Object} - MongoDB query object
 */
function buildMongoQuery(parsed) {
  const query = {};
  
  // Chỉ hiển thị bài đã duyệt
  query.moderationDecision = 'auto_approved';
  query.status = 'available';
  
  // Property type - Normalize để đảm bảo tìm đúng
  if (parsed.propertyType) {
    const normalizedType = normalizePropertyType(parsed.propertyType);
    console.log(`🏠 PropertyType: "${parsed.propertyType}" → "${normalizedType}"`);
    
    // Sử dụng $in để match với nhiều variants
    const variants = PROPERTY_TYPE_MAPPING[normalizedType] || [normalizedType];
    query.propertyType = { $in: variants };
  }
  
  // Price range
  if (parsed.priceMin || parsed.priceMax) {
    query.price = {};
    if (parsed.priceMin) query.price.$gte = parsed.priceMin;
    if (parsed.priceMax) query.price.$lte = parsed.priceMax;
  }
  
  // Area range
  if (parsed.areaMin || parsed.areaMax) {
    query.area = {};
    
    // Nếu areaMin === areaMax (chỉ 1 giá trị), mở rộng range ±10m²
    if (parsed.areaMin && parsed.areaMax && parsed.areaMin === parsed.areaMax) {
      const targetArea = parsed.areaMin;
      query.area.$gte = targetArea - 10;
      query.area.$lte = targetArea + 10;
      console.log(`📏 Area range expanded: ${targetArea}m² → ${targetArea - 10}-${targetArea + 10}m²`);
    } else {
      if (parsed.areaMin) query.area.$gte = parsed.areaMin;
      if (parsed.areaMax) query.area.$lte = parsed.areaMax;
    }
  }
  
  // Location - Normalize để tìm chính xác
  if (parsed.location) {
    if (parsed.location.city) {
      // Normalize city name
      const cityVariants = [
        parsed.location.city,
        'Hồ Chí Minh',
        'TP. Hồ Chí Minh', 
        'TP.HCM',
        'TPHCM',
        'Sài Gòn',
        'Saigon'
      ];
      query['address.city'] = { $regex: cityVariants.join('|'), $options: 'i' };
      console.log(`🌆 City variants: ${cityVariants.join(', ')}`);
    }
    
    if (parsed.location.district) {
      // Normalize district: "Quận 1" = "Q1" = "Q.1" = "quan 1"
      let districtQuery = parsed.location.district;
      
      // Nếu có "Quận" thì tạo variants
      const districtMatch = districtQuery.match(/quận\s*(\d+|thủ đức)/i);
      if (districtMatch) {
        const number = districtMatch[1];
        const variants = [
          `Quận ${number}`,
          `quận ${number}`,
          `Q${number}`,
          `Q.${number}`,
          `quan ${number}`
        ];
        if (number.toLowerCase() === 'thủ đức') {
          variants.push('Thủ Đức', 'Thu Duc', 'Quận Thủ Đức');
        }
        query['address.district'] = { $regex: variants.join('|'), $options: 'i' };
        console.log(`📍 District variants: ${variants.join(', ')}`);
      } else {
        // Các quận/huyện khác (Bình Thạnh, Gò Vấp...)
        query['address.district'] = { $regex: districtQuery, $options: 'i' };
      }
    }
    
    if (parsed.location.ward) {
      query['address.ward'] = { $regex: parsed.location.ward, $options: 'i' };
    }
  }
  
  // Amenities
  if (parsed.amenities) {
    Object.entries(parsed.amenities).forEach(([key, value]) => {
      if (value === true) {
        query[`amenities.${key}`] = true;
      }
    });
  }
  
  // Bedrooms/Bathrooms
  if (parsed.bedrooms) {
    query.bedrooms = { $gte: parsed.bedrooms };
  }
  if (parsed.bathrooms) {
    query.bathrooms = { $gte: parsed.bathrooms };
  }
  
  // Gender preferences (trong rules field)
  if (parsed.preferences?.gender && parsed.preferences.gender !== 'all') {
    const genderMap = {
      'female': ['nữ', 'female', 'chị em'],
      'male': ['nam', 'male', 'anh em']
    };
    const keywords = genderMap[parsed.preferences.gender] || [];
    if (keywords.length > 0) {
      query.rules = { $regex: keywords.join('|'), $options: 'i' };
    }
  }
  
  console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));
  return query;
}

/**
 * Semantic search với ranking - Cải thiện độ chính xác
 * @param {Object} parsed - Parsed parameters
 * @param {Array} properties - Danh sách properties từ DB
 * @returns {Array} - Ranked properties
 */
function rankPropertiesByRelevance(parsed, properties) {
  return properties.map(property => {
    let score = 0;
    const scoreDetails = {};
    
    // 1. Property Type Exact Match (15 điểm)
    if (parsed.propertyType && property.propertyType) {
      const normalizedParsed = normalizePropertyType(parsed.propertyType);
      const normalizedProperty = normalizePropertyType(property.propertyType);
      if (normalizedParsed === normalizedProperty) {
        score += 15;
        scoreDetails.propertyType = 15;
      }
    }
    
    // 2. District Exact Match (25 điểm)
    if (parsed.location?.district && property.address?.district) {
      const parsedDistrict = parsed.location.district.toLowerCase();
      const propertyDistrict = property.address.district.toLowerCase();
      
      // Exact match
      if (propertyDistrict.includes(parsedDistrict) || parsedDistrict.includes(propertyDistrict)) {
        score += 25;
        scoreDetails.district = 25;
      }
    }
    
    // 3. University Proximity (20 điểm nếu có university)
    if (parsed.location?.university) {
      const uniName = parsed.location.university.toLowerCase();
      const propTitle = (property.title || '').toLowerCase();
      const propDesc = (property.description || '').toLowerCase();
      const propDistrict = (property.address?.district || '').toLowerCase();
      
      // Tìm university info từ parsed query
      let targetUniversity = null;
      for (const [key, uni] of Object.entries(UNIVERSITIES)) {
        const uniLower = uni.name.toLowerCase();
        if (uniName.includes(key) || uniName.includes(uniLower) || key === uniName) {
          targetUniversity = { key, ...uni };
          break;
        }
      }
      
      if (targetUniversity) {
        let universityMatched = false;
        
        // Check 1: Title/Description mentions EXACT university
        if (propTitle.includes(targetUniversity.key) || 
            propTitle.includes(targetUniversity.name.toLowerCase()) ||
            propDesc.includes(targetUniversity.key) || 
            propDesc.includes(targetUniversity.name.toLowerCase())) {
          score += 20;
          scoreDetails.university = 20;
          universityMatched = true;
        }
        
        // Check 2: ONLY same district (không mention) - điểm thấp hơn
        if (!universityMatched) {
          const uniDistrict = targetUniversity.district.toLowerCase();
          // Chỉ tính điểm nếu cùng quận VÀ không mention trường khác
          if (propDistrict.includes(uniDistrict) || uniDistrict.includes(propDistrict)) {
            // Kiểm tra KHÔNG mention trường khác
            const otherUniversities = Object.entries(UNIVERSITIES)
              .filter(([k, _]) => k !== targetUniversity.key)
              .map(([k, _]) => k);
            
            const mentionsOtherUni = otherUniversities.some(otherKey => 
              propTitle.includes(otherKey) || propDesc.includes(otherKey)
            );
            
            if (!mentionsOtherUni) {
              score += 10; // Giảm từ 15 xuống 10 để phân biệt rõ hơn
              scoreDetails.university = 10;
            }
          }
        }
      }
    }
    
    // 4. Price Range Match (20 điểm)
    if (parsed.priceMin || parsed.priceMax) {
      const price = property.price || 0;
      
      // Exact range match
      if (parsed.priceMin && parsed.priceMax) {
        if (price >= parsed.priceMin && price <= parsed.priceMax) {
          // Perfect fit
          const mid = (parsed.priceMin + parsed.priceMax) / 2;
          const diff = Math.abs(price - mid);
          const maxDiff = parsed.priceMax - parsed.priceMin;
          score += 20 * (1 - diff / maxDiff);
          scoreDetails.price = Math.round(20 * (1 - diff / maxDiff));
        }
      } else if (parsed.priceMin && price >= parsed.priceMin) {
        score += 15;
        scoreDetails.price = 15;
      } else if (parsed.priceMax && price <= parsed.priceMax) {
        score += 15;
        scoreDetails.price = 15;
      }
    }
    
    // 5. Area Range Match (10 điểm)
    if (parsed.areaMin || parsed.areaMax) {
      const area = property.area || 0;
      
      if (parsed.areaMin && parsed.areaMax) {
        if (area >= parsed.areaMin && area <= parsed.areaMax) {
          score += 10;
          scoreDetails.area = 10;
        }
      } else if (parsed.areaMin && area >= parsed.areaMin) {
        score += 7;
        scoreDetails.area = 7;
      } else if (parsed.areaMax && area <= parsed.areaMax) {
        score += 7;
        scoreDetails.area = 7;
      }
    }
    
    // 6. Amenities Match (10 điểm)
    if (parsed.amenities) {
      const requestedAmenities = Object.entries(parsed.amenities)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key);
      
      if (requestedAmenities.length > 0) {
        const matchedAmenities = requestedAmenities.filter(
          amenity => property.amenities?.[amenity] === true
        );
        const amenityScore = 10 * (matchedAmenities.length / requestedAmenities.length);
        score += amenityScore;
        scoreDetails.amenities = Math.round(amenityScore);
      }
    }
    
    // 7. Gender Preference Match (5 điểm)
    if (parsed.preferences?.gender && parsed.preferences.gender !== 'all' && property.rules) {
      const genderMap = {
        'female': ['nữ', 'female', 'chị em'],
        'male': ['nam', 'male', 'anh em']
      };
      const keywords = genderMap[parsed.preferences.gender] || [];
      const rulesLower = property.rules.toLowerCase();
      
      if (keywords.some(k => rulesLower.includes(k))) {
        score += 5;
        scoreDetails.gender = 5;
      }
    }
    
    // 8. Quality & Moderation Score (5 điểm)
    if (property.moderationScore) {
      score += 5 * property.moderationScore;
      scoreDetails.quality = Math.round(5 * property.moderationScore);
    }
    
    // 9. Recency Bonus (5 điểm cho bài đăng mới)
    if (property.createdAt) {
      const daysSinceCreated = (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        const recencyScore = 5 * (1 - daysSinceCreated / 7);
        score += recencyScore;
        scoreDetails.recency = Math.round(recencyScore);
      }
    }
    
    return {
      ...property,
      relevanceScore: Math.round(score * 10) / 10, // 1 decimal
      scoreDetails
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Main search function với độ chính xác cao
 * @param {string} query - Natural language query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
async function searchWithNLP(query, options = {}) {
  try {
    console.log('🔍 NLP Search Query:', query);
    
    // Step 1: Parse query bằng AI
    const parsed = await parseNaturalLanguageQuery(query);
    
    // Step 2: Build MongoDB query
    const mongoQuery = buildMongoQuery(parsed);
    
    // Step 3: Execute search với limit cao hơn để có thể rank
    const properties = await Property.find(mongoQuery)
      .populate('landlord', 'name email phone avatar')
      .limit(options.limit || 100) // Tăng limit để có nhiều candidates
      .lean();
    
    console.log(`✅ Found ${properties.length} properties from database`);
    
    // Step 4: Rank by relevance
    const rankedProperties = rankPropertiesByRelevance(parsed, properties);
    
    // Step 5: Apply minimum score threshold
    const minScore = options.minScore || 20; // Chỉ lấy properties có score >= 20
    const filteredProperties = rankedProperties.filter(p => p.relevanceScore >= minScore);
    
    console.log(`✅ ${filteredProperties.length} properties passed relevance threshold (>= ${minScore})`);
    
    // Step 6: Limit final results
    const finalResults = filteredProperties.slice(0, options.maxResults || 20);
    
    // Log top 5 scores for debugging
    if (finalResults.length > 0) {
      console.log('🏆 Top 5 relevance scores:');
      finalResults.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. [${p.relevanceScore}] ${p.title} - ${JSON.stringify(p.scoreDetails)}`);
      });
    }
    
    return {
      success: true,
      query: query,
      parsed: parsed,
      count: finalResults.length,
      totalMatches: properties.length,
      data: finalResults,
      message: parsed.intent || 'Tìm kiếm thành công'
    };
    
  } catch (error) {
    console.error('❌ NLP Search Error:', error);
    throw error;
  }
}

/**
 * Multi-language support - Dịch query sang tiếng Việt
 * @param {string} query - Query in any language
 * @returns {Promise<string>} - Vietnamese query
 */
async function translateToVietnamese(query) {
  try {
    // Expand university abbreviations TRƯỚC KHI dịch
    const expandedQuery = expandUniversityQuery(query);
    
    // Detect if query is already Vietnamese
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    if (vietnameseRegex.test(expandedQuery)) {
      return expandedQuery; // Already Vietnamese
    }
    
    const prompt = `Translate this property search query to Vietnamese:
"${expandedQuery}"

Reply ONLY with the Vietnamese translation, no explanation.`;

    // Try Groq first
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 100,
      });

      const translation = completion.choices[0]?.message?.content?.trim() || query;
      console.log(`🌐 Groq Translated: "${query}" → "${translation}"`);
      return translation;
      
    } catch (groqError) {
      console.warn('⚠️ Groq translation failed, using Gemini:', groqError.message);
      
      // Fallback to Gemini
      const result = await geminiModel.generateContent(prompt);
      const translation = result.response.text().trim();
      console.log(`🌐 Gemini Translated: "${query}" → "${translation}"`);
      return translation;
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    return query; // Fallback to original
  }
}

/**
 * Search with auto-translation
 * @param {string} query - Query in any language
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
async function searchMultiLanguage(query, options = {}) {
  try {
    // Step 1: Translate to Vietnamese if needed
    const vietnameseQuery = await translateToVietnamese(query);
    
    // Step 2: Search with Vietnamese query
    const results = await searchWithNLP(vietnameseQuery, options);
    
    return {
      ...results,
      originalQuery: query,
      translatedQuery: vietnameseQuery !== query ? vietnameseQuery : null
    };
    
  } catch (error) {
    console.error('❌ Multi-language Search Error:', error);
    throw error;
  }
}

module.exports = {
  parseNaturalLanguageQuery,
  buildMongoQuery,
  rankPropertiesByRelevance,
  searchWithNLP,
  translateToVietnamese,
  searchMultiLanguage,
  normalizePropertyType,
  expandUniversityQuery,
  PROPERTY_TYPE_MAPPING,
  UNIVERSITIES
};
