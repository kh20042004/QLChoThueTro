/**
 * ===================================
 * TEST AI VISION SERVICE
 * Script test thử nghiệm AI nhận diện
 * ===================================
 */

require('dotenv').config();
const visionService = require('./src/services/visionService');

// Test data
const testImages = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', // Phòng ngủ
  'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800'  // Phòng khách
];

const testAmenities = [
  'Điều hòa',
  'Giường',
  'Tủ quần áo',
  'Wifi'
];

async function runTests() {
  console.log('🤖 BẮT ĐẦU TEST AI VISION SERVICE\n');
  console.log('='.repeat(60));

  // TEST 1: Phân tích 1 ảnh đơn
  console.log('\n📸 TEST 1: Phân tích 1 ảnh đơn');
  console.log('-'.repeat(60));
  try {
    const result1 = await visionService.analyzeRoomImage(testImages[0]);
    
    if (result1.success) {
      console.log('✅ Kết quả phân tích:');
      console.log('  - Loại phòng:', result1.data.roomType);
      console.log('  - Tình trạng:', result1.data.roomCondition);
      console.log('  - Độ sạch sẽ:', result1.data.cleanliness);
      console.log('  - Ánh sáng:', result1.data.naturalLight);
      console.log('  - Không gian:', result1.data.spaceAssessment);
      console.log('  - Tiện nghi phát hiện:', result1.data.detectedAmenities.join(', '));
      console.log('  - Độ tin cậy:', (result1.data.confidence * 100).toFixed(1) + '%');
      console.log('  - Mô tả:', result1.data.description);
      if (result1.data.warnings && result1.data.warnings.length > 0) {
        console.log('  ⚠️ Cảnh báo:', result1.data.warnings.join(', '));
      }
    } else {
      console.log('❌ Lỗi:', result1.error);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  // TEST 2: Phân tích nhiều ảnh
  console.log('\n\n📸📸 TEST 2: Phân tích nhiều ảnh');
  console.log('-'.repeat(60));
  try {
    const result2 = await visionService.analyzeMultipleImages(testImages);
    
    if (result2.success) {
      console.log('✅ Tóm tắt:');
      console.log('  - Tổng số ảnh:', result2.summary.totalImages);
      console.log('  - Đã phân tích:', result2.summary.analyzedImages);
      console.log('  - Tiện nghi tổng hợp:', result2.summary.allDetectedAmenities.join(', '));
      console.log('  - Độ tin cậy TB:', (result2.summary.averageConfidence * 100).toFixed(1) + '%');
      console.log('  - Loại phòng chính:', result2.summary.primaryRoomType);
      
      console.log('\n  Chi tiết từng ảnh:');
      result2.details.forEach((detail, index) => {
        console.log(`\n  Ảnh ${index + 1}:`);
        console.log('    - Loại phòng:', detail.roomType);
        console.log('    - Tiện nghi:', detail.detectedAmenities.join(', '));
        console.log('    - Độ tin cậy:', (detail.confidence * 100).toFixed(1) + '%');
      });
    } else {
      console.log('❌ Lỗi:', result2.error);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  // TEST 3: So sánh tiện nghi
  console.log('\n\n🔍 TEST 3: So sánh tiện nghi user input vs AI detect');
  console.log('-'.repeat(60));
  try {
    const result3 = await visionService.analyzeMultipleImages(testImages);
    
    if (result3.success) {
      const comparison = visionService.compareAmenities(
        testAmenities,
        result3.summary.allDetectedAmenities
      );
      
      console.log('✅ Kết quả so sánh:');
      console.log('  - User nhập:', testAmenities.join(', '));
      console.log('  - AI phát hiện:', result3.summary.allDetectedAmenities.join(', '));
      console.log('\n  📊 Phân tích:');
      console.log('    - Xác nhận:', comparison.verified.join(', ') || 'Không có');
      console.log('    - Không tìm thấy:', comparison.notDetected.join(', ') || 'Không có');
      console.log('    - Thiếu trong input:', comparison.missingFromInput.join(', ') || 'Không có');
      console.log(`    - Độ chính xác: ${comparison.accuracyScore}% (${comparison.verifiedCount}/${comparison.totalClaimed})`);
      console.log(`    - Đánh giá: ${comparison.isAccurate ? '✅ Chính xác' : '⚠️ Cần xem xét'}`);
    } else {
      console.log('❌ Lỗi:', result3.error);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  // TEST 4: Đánh giá toàn bộ bài đăng
  console.log('\n\n📋 TEST 4: Đánh giá toàn bộ bài đăng');
  console.log('-'.repeat(60));
  try {
    const propertyData = {
      type: 'phong-tro',
      title: 'Phòng trọ cao cấp Q1',
      price: 3500000,
      area: 25,
      amenities: testAmenities
    };

    const result4 = await visionService.evaluatePropertyListing(propertyData, testImages);
    
    if (result4.success) {
      const eval4 = result4.evaluation;
      console.log('✅ Kết quả đánh giá:');
      console.log(`  - Điểm tổng thể: ${eval4.totalScore}/100`);
      console.log(`  - Khuyến nghị: ${eval4.recommendation.toUpperCase()}`);
      console.log(`  - Lý do: ${eval4.reasons.join(', ') || 'Không có'}`);
      
      console.log('\n  📊 Chi tiết:');
      console.log(`    - Độ chính xác tiện nghi: ${eval4.amenitiesComparison.accuracyScore}%`);
      console.log(`    - Số lượng ảnh: ${eval4.imageQuality.totalImages}`);
      console.log(`    - Ảnh rõ nét: ${eval4.imageQuality.clearImages}/${eval4.imageQuality.totalImages}`);
      console.log(`    - Độ tin cậy TB: ${(eval4.imageQuality.averageConfidence * 100).toFixed(1)}%`);
      console.log(`    - Có cảnh báo: ${eval4.imageQuality.hasWarnings ? 'Có' : 'Không'}`);
      
      console.log('\n  🎯 Hành động đề xuất:');
      if (eval4.recommendation === 'approved') {
        console.log('    ✅ TỰ ĐỘNG DUYỆT - Bài đăng đạt chuẩn');
      } else if (eval4.recommendation === 'review') {
        console.log('    ⚠️ CẦN KIỂM TRA - Admin nên xem xét');
      } else {
        console.log('    ❌ TỪ CHỐI - Bài đăng không đạt chuẩn');
      }
    } else {
      console.log('❌ Lỗi:', result4.error);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 HOÀN THÀNH TẤT CẢ TESTS\n');
}

// Run tests
runTests().catch(console.error);
