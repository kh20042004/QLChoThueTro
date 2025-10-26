/**
 * ===================================
 * VISION SERVICE - Gemini Vision API
 * Nhận diện tiện nghi từ ảnh phòng
 * ===================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Lấy model Gemini Pro Vision
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp'
});

/**
 * Danh sách tiện nghi có thể nhận diện
 */
const AMENITIES_LIST = [
  'Điều hòa',
  'Giường',
  'Tủ quần áo',
  'Bàn làm việc',
  'Ghế',
  'Tủ lạnh',
  'Máy giặt',
  'Bếp',
  'Lò vi sóng',
  'Nóng lạnh',
  'TV',
  'Wifi (Router)',
  'Cửa sổ',
  'Ban công',
  'WC/Nhà vệ sinh',
  'Gương',
  'Quạt',
  'Rèm cửa',
  'Đèn',
  'Ổ cắm điện',
  'Sàn gỗ',
  'Gạch lát',
  'Thảm',
  'Kệ sách',
  'Sofa'
];

/**
 * Phân tích ảnh và nhận diện tiện nghi
 * @param {String} imagePath - Đường dẫn tới ảnh
 * @returns {Object} - Kết quả phân tích
 */
exports.analyzeRoomImage = async (imagePath) => {
  try {
    // Đọc file ảnh
    let imageData;
    if (imagePath.startsWith('http')) {
      // Nếu là URL, tải về
      const axios = require('axios');
      const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
      imageData = Buffer.from(response.data, 'binary').toString('base64');
    } else {
      // Nếu là file local
      const fullPath = path.join(__dirname, '../../public', imagePath);
      imageData = fs.readFileSync(fullPath).toString('base64');
    }

    // Tạo prompt cho Gemini
    const prompt = `Phân tích ảnh phòng trọ/căn hộ này và nhận diện các tiện nghi có trong phòng.

Danh sách tiện nghi cần kiểm tra:
${AMENITIES_LIST.join(', ')}

Hãy trả về kết quả theo định dạng JSON như sau:
{
  "detectedAmenities": ["tiện nghi 1", "tiện nghi 2", ...],
  "roomType": "phòng ngủ/phòng khách/bếp/phòng tắm",
  "roomCondition": "mới/cũ/trung bình",
  "cleanliness": "sạch sẽ/bình thường/cần dọn dẹp",
  "naturalLight": "nhiều ánh sáng/trung bình/tối",
  "spaceAssessment": "rộng rãi/trung bình/chật hẹp",
  "estimatedArea": "15-20m²",
  "furnitureQuality": "cao cấp/trung bình/cơ bản",
  "maintenanceLevel": "tốt/trung bình/cần sửa chữa",
  "confidence": 0.85,
  "description": "Mô tả ngắn gọn về phòng",
  "warnings": ["Cảnh báo nếu có (ví dụ: phòng quá tối, bừa bộn, thiếu tiện nghi cơ bản)"]
}

LƯU Ý: 
- Chỉ liệt kê tiện nghi MÀ BẠN THẬT SỰ NHÌN THẤY trong ảnh
- Confidence score từ 0-1 (độ chắc chắn)
- Đánh giá khách quan, trung thực
- Nếu ảnh mờ/tối không rõ, hãy ghi trong warnings`;

    // Gọi Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON từ response
    let analysis;
    try {
      // Loại bỏ markdown code block nếu có
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      analysis = JSON.parse(jsonText);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      // Fallback: tạo response cơ bản
      analysis = {
        detectedAmenities: [],
        roomType: 'không xác định',
        roomCondition: 'không xác định',
        cleanliness: 'không xác định',
        confidence: 0.5,
        description: text.substring(0, 200),
        warnings: ['Không thể phân tích JSON']
      };
    }

    return {
      success: true,
      data: analysis,
      rawResponse: text
    };

  } catch (error) {
    console.error('Vision Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Phân tích nhiều ảnh và tổng hợp kết quả
 * @param {Array} imagePaths - Mảng đường dẫn ảnh
 * @returns {Object} - Kết quả tổng hợp
 */
exports.analyzeMultipleImages = async (imagePaths) => {
  try {
    const results = [];
    const allDetectedAmenities = new Set();

    // Phân tích từng ảnh
    for (const imagePath of imagePaths) {
      const result = await this.analyzeRoomImage(imagePath);
      if (result.success && result.data) {
        results.push({
          imagePath,
          ...result.data
        });

        // Thêm tiện nghi vào set
        if (result.data.detectedAmenities) {
          result.data.detectedAmenities.forEach(amenity => 
            allDetectedAmenities.add(amenity)
          );
        }
      }
    }

    // Tính điểm trung bình
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

    // Phân loại phòng
    const roomTypes = results.map(r => r.roomType).filter(Boolean);
    const mostCommonRoomType = roomTypes.length > 0 
      ? roomTypes.sort((a,b) => 
          roomTypes.filter(v => v===a).length - roomTypes.filter(v => v===b).length
        ).pop()
      : 'không xác định';

    return {
      success: true,
      summary: {
        totalImages: imagePaths.length,
        analyzedImages: results.length,
        allDetectedAmenities: Array.from(allDetectedAmenities),
        averageConfidence: avgConfidence,
        primaryRoomType: mostCommonRoomType
      },
      details: results
    };

  } catch (error) {
    console.error('Multiple Images Analysis Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * So sánh tiện nghi người dùng nhập với tiện nghi AI phát hiện
 * @param {Array} userAmenities - Tiện nghi người dùng khai báo
 * @param {Array} detectedAmenities - Tiện nghi AI phát hiện
 * @returns {Object} - Kết quả so sánh
 */
exports.compareAmenities = (userAmenities, detectedAmenities) => {
  const userSet = new Set(userAmenities.map(a => a.toLowerCase().trim()));
  const detectedSet = new Set(detectedAmenities.map(a => a.toLowerCase().trim()));

  // Tiện nghi được xác nhận (có cả trong user input và AI detect)
  const verified = [...userSet].filter(a => detectedSet.has(a));

  // Tiện nghi người dùng khai báo nhưng AI không thấy
  const notDetected = [...userSet].filter(a => !detectedSet.has(a));

  // Tiện nghi AI thấy nhưng người dùng không khai báo
  const missingFromInput = [...detectedSet].filter(a => !userSet.has(a));

  // Tính accuracy score
  const totalClaimed = userSet.size;
  const verifiedCount = verified.length;
  const accuracyScore = totalClaimed > 0 ? (verifiedCount / totalClaimed) * 100 : 0;

  return {
    verified,
    notDetected,
    missingFromInput,
    accuracyScore: Math.round(accuracyScore),
    isAccurate: accuracyScore >= 70, // Ngưỡng 70% để coi là chính xác
    totalClaimed,
    totalDetected: detectedSet.size,
    verifiedCount
  };
};

/**
 * Đánh giá tổng thể bài đăng
 * @param {Object} propertyData - Dữ liệu property người dùng nhập
 * @param {Array} imagePaths - Mảng đường dẫn ảnh
 * @returns {Object} - Kết quả đánh giá
 */
exports.evaluatePropertyListing = async (propertyData, imagePaths) => {
  try {
    // Phân tích tất cả ảnh
    const imageAnalysis = await this.analyzeMultipleImages(imagePaths);

    if (!imageAnalysis.success) {
      return {
        success: false,
        error: 'Không thể phân tích ảnh'
      };
    }

    // So sánh tiện nghi
    const amenitiesComparison = this.compareAmenities(
      propertyData.amenities || [],
      imageAnalysis.summary.allDetectedAmenities
    );

    // Đánh giá chất lượng ảnh
    const imageQuality = {
      totalImages: imageAnalysis.summary.totalImages,
      clearImages: imageAnalysis.details.filter(d => d.confidence > 0.7).length,
      averageConfidence: imageAnalysis.summary.averageConfidence,
      hasWarnings: imageAnalysis.details.some(d => d.warnings && d.warnings.length > 0)
    };

    // Tính điểm tổng thể (0-100)
    let totalScore = 0;
    const weights = {
      amenitiesAccuracy: 0.4,    // 40%
      imageQuality: 0.3,          // 30%
      imageQuantity: 0.15,        // 15%
      roomCondition: 0.15         // 15%
    };

    // 1. Điểm độ chính xác tiện nghi
    totalScore += amenitiesComparison.accuracyScore * weights.amenitiesAccuracy;

    // 2. Điểm chất lượng ảnh
    const qualityScore = (imageAnalysis.summary.averageConfidence * 100);
    totalScore += qualityScore * weights.imageQuality;

    // 3. Điểm số lượng ảnh (tối ưu 5-8 ảnh)
    const imageCountScore = Math.min(100, (imagePaths.length / 5) * 100);
    totalScore += imageCountScore * weights.imageQuantity;

    // 4. Điểm tình trạng phòng
    const goodConditionCount = imageAnalysis.details.filter(d => 
      d.roomCondition === 'mới' || d.cleanliness === 'sạch sẽ'
    ).length;
    const conditionScore = (goodConditionCount / imageAnalysis.details.length) * 100;
    totalScore += conditionScore * weights.roomCondition;

    // Đề xuất hành động
    let recommendation = 'approved'; // approved, review, rejected
    let reasons = [];

    if (totalScore < 50) {
      recommendation = 'rejected';
      reasons.push('Điểm tổng thể quá thấp');
    } else if (totalScore < 70) {
      recommendation = 'review';
      reasons.push('Cần xem xét thêm');
    }

    if (amenitiesComparison.accuracyScore < 50) {
      recommendation = 'review';
      reasons.push('Tiện nghi không khớp với ảnh');
    }

    if (imagePaths.length < 3) {
      recommendation = 'review';
      reasons.push('Số lượng ảnh quá ít');
    }

    if (imageQuality.hasWarnings) {
      recommendation = 'review';
      reasons.push('Ảnh có cảnh báo về chất lượng');
    }

    return {
      success: true,
      evaluation: {
        totalScore: Math.round(totalScore),
        recommendation,
        reasons,
        amenitiesComparison,
        imageQuality,
        imageAnalysis: imageAnalysis.summary,
        detailedAnalysis: imageAnalysis.details
      }
    };

  } catch (error) {
    console.error('Property Evaluation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = exports;
