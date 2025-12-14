/**
 * ===================================
 * AUTO MODERATION SERVICE
 * Xét duyệt tự động bài đăng với 3 layers
 * ===================================
 */

const axios = require('axios');

const FLASK_PREDICT_URL = 'https://mattie-nonencyclopaedic-qualifiedly.ngrok-free.dev/predict';

/**
 * Danh sách từ cấm - Tục tĩu, lăng mạ, spam
 */
const BANNED_WORDS = [
  // Tục tĩu
  'địt', 'đjt', 'dit', 'đm', 'dm', 'đéo', 'deo', 'đụ', 'du', 'cặc', 'cak', 'lồn', 'lon', 
  'buồi', 'buoi', 'chịch', 'chich', 'vãi', 'vai', 'vlon', 'vcl', 'cc', 'clgt', 'clmm',
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'damn', 'hell',
  
  // Lăng mạ, xúc phạm
  'chó', 'lợn', 'heo', 'khốn', 'đĩ', 'di', 'súc vật', 'súc sinh', 'đồ ngu', 'ngu ngốc',
  'óc chó', 'mất dạy', 'thằng chó', 'con chó', 'thằng lợn', 'con lợn', 'đồ khốn',
  'ngu si', 'ngáo', 'ngu dốt', 'đần độn', 'ngu người', 'điên khùng',
  
  // Lừa đảo, spam
  'lừa đảo', 'lua dao', 'scam', 'ăn cắp', 'an cap', 'trộm cắp', 'trom cap',
  'kiếm tiền nhanh', 'kiem tien nhanh', 'làm giàu', 'lam giau', 'đa cấp', 'da cap',
  'mlm', 'đòi nợ', 'doi no', 'cho vay', 'vay tiền', 'vay tien', 'bitcoin', 'forex',
  'cờ bạc', 'co bac', 'cá cược', 'ca cuoc', 'casino', 'sòng bạc', 'song bac',
  
  // Từ spam thương mại
  'inbox', 'zalo ngay', 'liên hệ ngay', 'lien he ngay', 'click ngay', 'đăng ký ngay',
  'mua ngay', 'khuyến mãi', 'khuyen mai', 'giảm giá', 'giam gia', 'free', 'miễn phí 100%'
];

/**
 * Ký tự đặc biệt spam (lặp lại nhiều lần)
 */
const SPAM_SYMBOLS = /[!@#$%^&*]{3,}|[.]{4,}|[?]{3,}|[~]{3,}/g;

/**
 * Kiểm tra từ cấm và ký tự đặc biệt
 */
function checkBannedContent(text) {
  const issues = [];
  const normalizedText = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd');

  // Check từ cấm
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedText)) {
      issues.push(`Chứa từ ngữ không phù hợp: "${word}"`);
    }
  }

  // Check ký tự đặc biệt spam
  const symbolMatches = text.match(SPAM_SYMBOLS);
  if (symbolMatches) {
    issues.push(`Lạm dụng ký tự đặc biệt: "${symbolMatches.join(', ')}"`);
  }

  // Check CAPS LOCK spam (>70% chữ hoa)
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 10 && upperCount / letterCount > 0.7) {
    issues.push('Lạm dụng chữ hoa (CAPS LOCK spam)');
  }

  return issues;
}

/**
 * Layer 1: Kiểm tra quy tắc cơ bản
 */
function checkBasicRules(property) {
  const title = property.title || '';
  const description = property.description || '';
  
  // Kiểm tra từ cấm và ký tự đặc biệt
  const titleIssues = checkBannedContent(title);
  const descIssues = checkBannedContent(description);
  const bannedContentIssues = [...titleIssues, ...descIssues];
  
  const rules = [
    { name: 'images', check: (property.images?.length || 0) >= 3, weight: 15, message: 'Thiếu ảnh (cần >= 3 ảnh)' },
    { name: 'description', check: (property.description?.length || 0) >= 100, weight: 15, message: 'Mô tả quá ngắn (cần >= 100 ký tự)' },
    { name: 'price', check: property.price >= 500000 && property.price <= 100000000, weight: 15, message: 'Giá không hợp lý (500k - 100tr)' },
    { name: 'area', check: property.area >= 10 && property.area <= 500, weight: 15, message: 'Diện tích không hợp lý (10-500m²)' },
    { name: 'coordinates', check: property.location?.coordinates?.length === 2, weight: 10, message: 'Thiếu tọa độ' },
    { name: 'contact', check: property.contact?.phone?.length >= 10, weight: 10, message: 'Thiếu thông tin liên hệ' },
    { name: 'banned_content', check: bannedContentIssues.length === 0, weight: 20, message: bannedContentIssues.length > 0 ? bannedContentIssues.join('; ') : '' }
  ];

  let score = 0;
  const failedRules = [];

  rules.forEach(rule => {
    if (rule.check) {
      score += rule.weight;
    } else {
      if (rule.message) failedRules.push(rule.message);
    }
  });

  return {
    pass: score >= 70,
    score: score,
    reason: failedRules.length > 0 ? `Không đạt: ${failedRules.join(', ')}` : 'Đạt tất cả quy tắc cơ bản',
    details: failedRules,
    bannedContentDetected: bannedContentIssues.length > 0
  };
}

/**
 * Layer 2: Kiểm tra chất lượng nội dung (AI)
 */
function checkContentQuality(property) {
  const title = property.title || '';
  const description = property.description || '';
  
  const warnings = {
    high: [],
    medium: [],
    low: []
  };

  // 0. CHECK TỪ CẤM & KÝ TỰ ĐẶC BIỆT (CRITICAL - AUTO REJECT)
  const titleBannedIssues = checkBannedContent(title);
  const descBannedIssues = checkBannedContent(description);
  
  if (titleBannedIssues.length > 0) {
    titleBannedIssues.forEach(issue => warnings.high.push(`[TIÊU ĐỀ] ${issue}`));
  }
  if (descBannedIssues.length > 0) {
    descBannedIssues.forEach(issue => warnings.high.push(`[MÔ TẢ] ${issue}`));
  }

  // 1. Spam detection - Repeating patterns
  const repeatingPattern = /(.{3,})\1{1,}/;
  if (repeatingPattern.test(title)) {
    const matches = title.match(repeatingPattern);
    warnings.high.push(`Tiêu đề có chuỗi ký tự lặp lại (spam pattern: "${matches[1]}"...)`);
  }

  // 2. Consonant clusters (phụ âm liên tiếp) - CHECK BOTH TITLE & DESCRIPTION
  const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/gi;
  const titleConsonantMatches = title.match(consonantCluster);
  const descConsonantMatches = description.match(consonantCluster);
  
  if (titleConsonantMatches) {
    warnings.high.push(`Tiêu đề chứa chuỗi phụ âm dài không có nghĩa: "${titleConsonantMatches[0]}"`);
  }
  if (descConsonantMatches && descConsonantMatches.length > 2) {
    warnings.high.push(`Mô tả chứa nhiều chuỗi phụ âm dài (spam): "${descConsonantMatches.join(', ')}"`);
  }

  // 3. Character repetition ratio
  const charCount = {};
  for (const char of title.toLowerCase()) {
    charCount[char] = (charCount[char] || 0) + 1;
  }
  const maxRepeat = Math.max(...Object.values(charCount));
  if (title.length > 0 && maxRepeat / title.length > 0.5) {
    warnings.medium.push('Tiêu đề có tỷ lệ ký tự lặp lại cao (>50%)');
  }

  // 4. Random text detection - Check if description is just random characters
  const randomPattern = /^[a-z]{10,}$/i; // Toàn chữ cái liên tiếp không có khoảng trắng
  if (randomPattern.test(description.trim())) {
    warnings.high.push('Mô tả chỉ là chuỗi ký tự ngẫu nhiên không có nghĩa');
  }

  // 5. Numeric/symbol spam - Description is mostly numbers or symbols
  const alphaCount = (description.match(/[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi) || []).length;
  const totalChars = description.replace(/\s/g, '').length;
  if (totalChars > 0 && alphaCount / totalChars < 0.3) {
    warnings.high.push('Mô tả chủ yếu là số hoặc ký tự đặc biệt (không có nội dung văn bản)');
  }

  // 6. Meaningful word check - Description should have spaces (Vietnamese/English words)
  const wordCount = description.trim().split(/\s+/).length;
  if (description.length >= 30 && wordCount < 5) {
    warnings.high.push('Mô tả không chứa từ có nghĩa (ít hơn 5 từ)');
  }

  // 7. Basic quality checks - STRICTER PENALTIES
  if (title.length < 10) {
    warnings.high.push('Tiêu đề quá ngắn (< 10 ký tự)');
  }
  if (description.length < 30) {
    warnings.high.push('Mô tả quá ngắn (< 30 ký tự)');
  }
  if (description.length < 100) {
    warnings.medium.push('Mô tả thiếu chi tiết (< 100 ký tự)');
  }

  // Tính điểm - INCREASED PENALTIES
  const highPenalty = warnings.high.length * 40;
  const mediumPenalty = warnings.medium.length * 20;
  const lowPenalty = warnings.low.length * 10;
  const score = Math.max(0, 100 - highPenalty - mediumPenalty - lowPenalty);

  const allWarnings = [...warnings.high, ...warnings.medium, ...warnings.low];
  
  return {
    hasIssues: score < 70,
    score: score,
    reason: allWarnings.length > 0 
      ? `Phát hiện ${allWarnings.length} vấn đề về chất lượng nội dung`
      : 'Nội dung chất lượng tốt',
    details: allWarnings
  };
}

/**
 * Layer 3: Kiểm tra giá cả với AI
 */
async function validatePriceWithAI(property) {
  try {
    // Lấy tọa độ từ property
    const lat = property.location?.coordinates?.[1] || null;
    const lng = property.location?.coordinates?.[0] || null;
    
    // Map propertyType sang room_type theo chuẩn Flask
    const roomTypeMap = {
      'phong-tro': 'Phòng trọ',
      'nha-nguyen-can': 'Nhà nguyên căn',
      'can-ho': 'Căn hộ dịch vụ',
      'chung-cu-mini': 'Chung cư mini',
      'studio': 'Studio'
    };
    
    const payload = {
      city: property.address?.city || 'Hồ Chí Minh',
      acreage: property.area || 20,
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      room_type: roomTypeMap[property.propertyType] || 'Phòng trọ',
      district: property.address?.district || 'Quận 1',
      ward: property.address?.ward || '',
      has_ac: property.amenities?.ac || false,
      has_parking: property.amenities?.parking || false,
      has_kitchen: property.amenities?.kitchen || false,
      has_wc: (property.bathrooms || 0) > 0,
      has_furniture: property.amenities?.has_furniture || false,
      has_balcony: property.amenities?.balcony || false,
      has_window: property.amenities?.has_window || false,
      has_mezzanine: property.amenities?.has_mezzanine || false,
      is_studio: property.propertyType === 'studio' ? 1 : 0
    };

    // Thêm lat/lng nếu có
    if (lat && lng) {
      payload.lat = lat;
      payload.lng = lng;
    }

    console.log('🔍 Flask API Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(FLASK_PREDICT_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });

    console.log('✅ Flask API Response:', response.data);

    if (response.data && response.data.predicted_price) {
      const predictedPrice = response.data.predicted_price;
      const actualPrice = property.price;
      const deviation = ((actualPrice - predictedPrice) / predictedPrice) * 100;

      let score = 100;
      if (Math.abs(deviation) > 50) score = 50;
      else if (Math.abs(deviation) > 35) score = 70;
      else if (Math.abs(deviation) > 25) score = 80;
      else if (Math.abs(deviation) > 15) score = 90;

      return {
        reasonable: Math.abs(deviation) <= 30,
        score: score,
        predictedPrice: predictedPrice,
        actualPrice: actualPrice,
        deviation: deviation,
        reason: Math.abs(deviation) <= 30
          ? `Giá hợp lý (chênh lệch ${deviation.toFixed(1)}%)`
          : `Giá chênh lệch quá lớn so với thị trường (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%). Giá đăng ${deviation > 0 ? 'cao hơn' : 'thấp hơn'} dự đoán AI`
      };
    }
  } catch (error) {
    console.error('❌ Lỗi khi gọi Flask API:', error.message);
    if (error.response) {
      console.error('📛 Flask API Error Response:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      console.error('   Headers:', error.response.headers);
    } else if (error.request) {
      console.error('📛 No response from Flask API');
      console.error('   Request:', error.request);
    }
  }

  // Fallback nếu API lỗi
  return {
    reasonable: true,
    score: 80,
    reason: 'Không thể kiểm tra giá (API lỗi), tạm chấp nhận'
  };
}

/**
 * Chạy auto-moderation cho một property
 */
async function runAutoModeration(property) {
  console.log(`🤖 === BẮT ĐẦU XÉT DUYỆT TỰ ĐỘNG: ${property._id} ===`);

  // Chạy 3 layers
  const ruleCheck = checkBasicRules(property);
  const contentCheck = checkContentQuality(property);
  const priceCheck = await validatePriceWithAI(property);

  console.log(`   Layer 1 (Rules): ${ruleCheck.score}%`);
  console.log(`   Layer 2 (Content): ${contentCheck.score}%`);
  console.log(`   Layer 3 (Price): ${priceCheck.score}%`);

  // Tính điểm tổng
  const finalScore = (ruleCheck.score + contentCheck.score + priceCheck.score) / 3;
  console.log(`   📊 Điểm tổng: ${finalScore.toFixed(1)}%`);

  // Phân loại theo điểm
  let status, moderationDecision, failedLayer, failedReason;

  if (finalScore > 85) {
    // TỰ ĐỘNG DUYỆT
    status = 'available';
    moderationDecision = 'auto_approved';
    failedLayer = 'All Layers';
    failedReason = `Chất lượng xuất sắc (${finalScore.toFixed(1)}% > 85%) - Tự động duyệt`;
    console.log(`   ✅ KẾT LUẬN: TỰ ĐỘNG DUYỆT`);
  } else if (finalScore >= 50) {
    // DUYỆT THỦ CÔNG
    status = 'pending';
    moderationDecision = 'pending_review';
    failedLayer = 'Manual Review';
    failedReason = `Điểm trung bình (${finalScore.toFixed(1)}%) - Cần admin xem xét thủ công`;
    console.log(`   ⚠️ KẾT LUẬN: CẦN DUYỆT THỦ CÔNG`);
  } else {
    // TỰ ĐỘNG TỪ CHỐI
    status = 'rejected';
    moderationDecision = 'rejected';
    
    // Xác định layer fail nghiêm trọng nhất
    if (ruleCheck.score < 50) {
      failedLayer = 'Rule-Based';
      failedReason = `Không đạt tiêu chuẩn cơ bản (${ruleCheck.score.toFixed(0)}%): ${ruleCheck.reason}`;
    } else if (contentCheck.score < 50) {
      failedLayer = 'Content AI';
      failedReason = `Chất lượng nội dung rất kém (${contentCheck.score.toFixed(0)}%): ${contentCheck.reason}`;
    } else if (priceCheck.score < 50) {
      failedLayer = 'Price AI';
      failedReason = `Giá hoàn toàn không hợp lý (${priceCheck.score.toFixed(0)}%): ${priceCheck.reason}`;
    } else {
      failedLayer = 'Overall Score';
      failedReason = `Điểm tổng thể quá thấp (${finalScore.toFixed(1)}% < 50%) - Tự động từ chối`;
    }
    console.log(`   ❌ KẾT LUẬN: TỰ ĐỘNG TỪ CHỐI`);
  }

  return {
    status,
    moderationDecision,
    moderationScore: finalScore,
    moderationDetails: {
      rule_score: ruleCheck.score,
      content_score: contentCheck.score,
      price_score: priceCheck.score,
      final_score: finalScore
    },
    moderationReasons: [failedReason],
    moderationSuggestions: [
      ...(ruleCheck.details || []),
      ...(contentCheck.details || [])
    ],
    predictedPrice: priceCheck.predictedPrice,
    moderatedAt: new Date(),
    failedLayer,
    failedReason
  };
}

module.exports = {
  runAutoModeration
};
