/**
 * ===================================
 * AI MODERATION - Frontend Integration
 * Tích hợp AI kiểm duyệt vào form đăng tin
 * ===================================
 */

// Biến global cho AI moderation
let aiModerationResult = null;
let isAnalyzing = false;

/**
 * Phân tích ảnh sau khi upload
 */
async function analyzeUploadedImages(imagePaths) {
  if (isAnalyzing || imagePaths.length === 0) return;

  try {
    isAnalyzing = true;
    showAnalyzingIndicator();

    const token = localStorage.getItem('token');
    const response = await fetch('/api/moderation/analyze-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ imagePaths })
    });

    const data = await response.json();

    if (data.success) {
      aiModerationResult = data.data;
      displayAIAnalysisResults(data.data);
      
      // Tự động điền tiện nghi nếu người dùng chưa chọn
      autoFillDetectedAmenities(data.data.summary.allDetectedAmenities);
    } else {
      console.error('AI analysis failed:', data.error);
      showAlert('Không thể phân tích ảnh. Vui lòng tiếp tục nhập thủ công.', 'warning');
    }

  } catch (error) {
    console.error('Error analyzing images:', error);
    showAlert('Lỗi khi phân tích ảnh', 'danger');
  } finally {
    isAnalyzing = false;
    hideAnalyzingIndicator();
  }
}

/**
 * Hiển thị indicator đang phân tích
 */
function showAnalyzingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'aiAnalyzingIndicator';
  indicator.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
  indicator.innerHTML = `
    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    <span>🤖 AI đang phân tích ảnh...</span>
  `;
  document.body.appendChild(indicator);
}

/**
 * Ẩn indicator
 */
function hideAnalyzingIndicator() {
  const indicator = document.getElementById('aiAnalyzingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Hiển thị kết quả phân tích AI
 */
function displayAIAnalysisResults(analysisData) {
  // Tìm container để hiển thị kết quả (step 3 - amenities)
  const step3 = document.getElementById('step3');
  if (!step3) return;

  // Xóa kết quả cũ nếu có
  const oldResults = document.getElementById('aiAnalysisResults');
  if (oldResults) oldResults.remove();

  // Tạo HTML hiển thị kết quả
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'aiAnalysisResults';
  resultsDiv.className = 'mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200';
  
  const detectedAmenities = analysisData.summary.allDetectedAmenities || [];
  const confidence = (analysisData.summary.averageConfidence * 100).toFixed(1);

  resultsDiv.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-3xl">🤖</div>
      <div class="flex-1">
        <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          AI đã phân tích ${analysisData.summary.analyzedImages} ảnh
          <span class="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
            Độ chính xác: ${confidence}%
          </span>
        </h4>
        
        ${detectedAmenities.length > 0 ? `
          <div class="mb-3">
            <p class="text-sm text-gray-600 mb-2">✅ <strong>Tiện nghi được phát hiện:</strong></p>
            <div class="flex flex-wrap gap-2">
              ${detectedAmenities.map(amenity => `
                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  ${amenity}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="mt-3 text-xs text-gray-500">
          💡 Gợi ý: Bạn có thể điều chỉnh danh sách tiện nghi bên dưới
        </div>
      </div>
    </div>
  `;

  // Thêm vào đầu step 3
  step3.insertBefore(resultsDiv, step3.firstChild);

  // Hiển thị toast thành công
  showAlert(`🎉 AI đã phát hiện ${detectedAmenities.length} tiện nghi từ ảnh của bạn!`, 'success');
}

/**
 * Tự động tick các tiện nghi AI phát hiện
 */
function autoFillDetectedAmenities(detectedAmenities) {
  if (!detectedAmenities || detectedAmenities.length === 0) return;

  // Mapping tiện nghi AI -> checkbox value
  const amenityMapping = {
    'Điều hòa': 'dieu-hoa',
    'Wifi': 'wifi',
    'Wifi (Router)': 'wifi',
    'Giường': 'giuong',
    'Tủ quần áo': 'tu-quan-ao',
    'Bàn làm việc': 'ban-lam-viec',
    'Tủ lạnh': 'tu-lanh',
    'Máy giặt': 'may-giat',
    'Bếp': 'bep',
    'Nóng lạnh': 'nong-lanh',
    'TV': 'tv',
    'Ban công': 'ban-cong',
    'Gác lửng': 'gac-lung',
    'Thang máy': 'thang-may',
    'Bảo vệ': 'bao-ve',
    'Giữ xe': 'giu-xe',
    'Camera an ninh': 'camera'
  };

  detectedAmenities.forEach(amenity => {
    const checkboxValue = amenityMapping[amenity];
    if (checkboxValue) {
      const checkbox = document.querySelector(`input[type="checkbox"][value="${checkboxValue}"]`);
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        // Thêm hiệu ứng highlight
        checkbox.parentElement.classList.add('bg-green-50', 'border-green-300');
        setTimeout(() => {
          checkbox.parentElement.classList.remove('bg-green-50', 'border-green-300');
        }, 2000);
      }
    }
  });
}

/**
 * Đánh giá bài đăng trước khi submit
 */
async function evaluateBeforeSubmit(propertyData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/moderation/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(propertyData)
    });

    const data = await response.json();

    if (data.success) {
      return showEvaluationResults(data.data);
    } else {
      console.error('Evaluation failed:', data.error);
      return true; // Cho phép submit nếu đánh giá thất bại
    }

  } catch (error) {
    console.error('Error evaluating:', error);
    return true; // Cho phép submit nếu có lỗi
  }
}

/**
 * Hiển thị kết quả đánh giá và xác nhận
 */
function showEvaluationResults(evaluation) {
  return new Promise((resolve) => {
    // Tạo modal hiển thị kết quả
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'evaluationModal';

    const score = evaluation.totalScore;
    const recommendation = evaluation.recommendation;
    const amenitiesAccuracy = evaluation.amenitiesComparison.accuracyScore;

    // Xác định màu sắc dựa trên điểm
    let scoreColor = 'text-green-600';
    let scoreBg = 'bg-green-100';
    let icon = '✅';
    if (score < 50) {
      scoreColor = 'text-red-600';
      scoreBg = 'bg-red-100';
      icon = '❌';
    } else if (score < 70) {
      scoreColor = 'text-yellow-600';
      scoreBg = 'bg-yellow-100';
      icon = '⚠️';
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <span class="text-4xl">🤖</span>
            Kết Quả Đánh Giá AI
          </h3>
          <p class="text-blue-100 mt-2">Bài đăng của bạn đã được phân tích bằng AI</p>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Điểm tổng thể -->
          <div class="text-center mb-6 p-6 ${scoreBg} rounded-xl">
            <div class="text-6xl mb-2">${icon}</div>
            <div class="text-5xl font-bold ${scoreColor} mb-2">${score}/100</div>
            <div class="text-gray-600">Điểm Tổng Thể</div>
          </div>

          <!-- Chi tiết -->
          <div class="space-y-4 mb-6">
            <!-- Độ chính xác tiện nghi -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span class="font-medium text-gray-700">📝 Độ chính xác tiện nghi</span>
              <span class="font-bold ${amenitiesAccuracy >= 70 ? 'text-green-600' : 'text-yellow-600'}">
                ${amenitiesAccuracy}%
              </span>
            </div>

            <!-- Chất lượng ảnh -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span class="font-medium text-gray-700">📸 Chất lượng ảnh</span>
              <span class="font-bold text-blue-600">
                ${evaluation.imageQuality.clearImages}/${evaluation.imageQuality.totalImages} ảnh rõ nét
              </span>
            </div>

            <!-- Khuyến nghị -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="font-medium text-gray-700 mb-2">💡 Khuyến nghị:</div>
              <div class="text-sm text-gray-600">
                ${recommendation === 'approved' 
                  ? '✅ Bài đăng của bạn đạt chất lượng tốt!' 
                  : recommendation === 'review'
                  ? '⚠️ Bài đăng cần xem xét thêm'
                  : '❌ Bài đăng cần cải thiện'
                }
              </div>
              ${evaluation.reasons.length > 0 ? `
                <ul class="mt-2 text-sm text-gray-600 list-disc list-inside">
                  ${evaluation.reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
              ` : ''}
            </div>

            <!-- Tiện nghi -->
            ${evaluation.amenitiesComparison.verified.length > 0 ? `
              <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                <div class="font-medium text-green-700 mb-2">✅ Tiện nghi được xác nhận (${evaluation.amenitiesComparison.verified.length}):</div>
                <div class="flex flex-wrap gap-2">
                  ${evaluation.amenitiesComparison.verified.map(a => `
                    <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">${a}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${evaluation.amenitiesComparison.notDetected.length > 0 ? `
              <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="font-medium text-yellow-700 mb-2">⚠️ Tiện nghi không thấy trong ảnh (${evaluation.amenitiesComparison.notDetected.length}):</div>
                <div class="flex flex-wrap gap-2">
                  ${evaluation.amenitiesComparison.notDetected.map(a => `
                    <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">${a}</span>
                  `).join('')}
                </div>
                <div class="text-sm text-yellow-600 mt-2">
                  💡 Gợi ý: Chụp ảnh rõ hơn hoặc xóa tiện nghi không chính xác
                </div>
              </div>
            ` : ''}

            ${evaluation.amenitiesComparison.missingFromInput.length > 0 ? `
              <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div class="font-medium text-blue-700 mb-2">ℹ️ AI phát hiện thêm (${evaluation.amenitiesComparison.missingFromInput.length}):</div>
                <div class="flex flex-wrap gap-2">
                  ${evaluation.amenitiesComparison.missingFromInput.map(a => `
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">${a}</span>
                  `).join('')}
                </div>
                <div class="text-sm text-blue-600 mt-2">
                  💡 Gợi ý: Bạn có muốn thêm các tiện nghi này?
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button 
              onclick="closeEvaluationModal(false)"
              class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ← Quay lại chỉnh sửa
            </button>
            <button 
              onclick="closeEvaluationModal(true)"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium shadow-lg"
            >
              Xác nhận đăng tin →
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Hàm đóng modal (global function)
    window.closeEvaluationModal = (confirmed) => {
      modal.remove();
      delete window.closeEvaluationModal;
      resolve(confirmed);
    };
  });
}

/**
 * Override hàm submitForm để thêm AI evaluation
 */
const originalSubmitForm = window.submitForm;
window.submitForm = async function() {
  // Thu thập dữ liệu form
  const propertyData = collectFormData();
  
  if (!propertyData.images || propertyData.images.length === 0) {
    showAlert('Vui lòng tải lên ít nhất 1 ảnh', 'warning');
    return;
  }

  // Đánh giá bằng AI
  const confirmed = await evaluateBeforeSubmit(propertyData);
  
  if (!confirmed) {
    return; // User không xác nhận, quay lại chỉnh sửa
  }

  // Tiếp tục submit như bình thường
  if (originalSubmitForm) {
    originalSubmitForm.call(this);
  }
};

/**
 * Thu thập dữ liệu form
 */
function collectFormData() {
  const amenities = [];
  document.querySelectorAll('input[name="amenities"]:checked').forEach(cb => {
    amenities.push(cb.value);
  });

  return {
    type: document.getElementById('propertyType')?.value,
    title: document.getElementById('title')?.value,
    description: document.getElementById('description')?.value,
    price: document.getElementById('price')?.value,
    area: document.getElementById('area')?.value,
    amenities: amenities,
    images: uploadedImages
  };
}

// Export functions
window.analyzeUploadedImages = analyzeUploadedImages;
window.evaluateBeforeSubmit = evaluateBeforeSubmit;
