/**
 * ===================================
 * PRICE PREDICTION - Dự đoán giá thuê bằng AI
 * ===================================
 */

// 🚀 Flask + ngrok API cho AI dự đoán giá
const FLASK_API_BASE_URL = "https://mattie-nonencyclopaedic-qualifiedly.ngrok-free.dev"; // IMPORTANT: Thay bằng ngrok URL thật
const FLASK_PREDICT_API_URL = `${FLASK_API_BASE_URL}/predict`;

/**
 * Helper: Map province value → city code cho AI model
 */
function mapProvinceToCityCode(provinceValue) {
    if (!provinceValue) return null;
    const provinceLower = provinceValue.toLowerCase();
    
    if (provinceLower.includes('ho-chi-minh') || provinceLower.includes('hcm')) {
        return 'HCM';
    } else if (provinceLower.includes('hanoi') || provinceLower.includes('ha-noi')) {
        return 'HaNoi';
    } else if (provinceLower.includes('da-nang') || provinceLower.includes('danang')) {
        return 'DaNang';
    }
    
    // AI hiện chỉ hỗ trợ 3 thành phố này
    return null;
}

/**
 * Helper: Map propertyType → room_type cho AI model
 */
function mapPropertyTypeToRoomType(propertyType) {
    if (!propertyType) return 'Phòng trọ';
    
    switch (propertyType.toLowerCase()) {
        case 'phong-tro':
            return 'Phòng trọ';
        case 'nha-nguyen-can':
            return 'Nhà nguyên căn';
        case 'can-ho':
            return 'Căn hộ';
        case 'chung-cu-mini':
            return 'Chung cư mini';
        case 'homestay':
            return 'Homestay';
        default:
            return 'Phòng trọ';
    }
}

class PricePrediction {
    constructor() {
        this.isPredicting = false;
        this.init();
    }

    init() {
        // Lắng nghe sự kiện click nút dự đoán giá
        const predictBtn = document.getElementById('predictPriceBtn');
        if (predictBtn) {
            console.log('✅ Nút dự đoán giá đã được tìm thấy');
            predictBtn.addEventListener('click', () => {
                console.log('🔘 Nút dự đoán giá được click');
                this.showPredictionModal();
            });
        } else {
            console.error('❌ Không tìm thấy nút dự đoán giá (id="predictPriceBtn")');
        }
    }

    /**
     * Hiển thị modal dự đoán giá
     */
    showPredictionModal() {
        console.log('📊 Bắt đầu hiển thị modal dự đoán giá');
        
        // Kiểm tra xem hàm collect data đã sẵn sàng chưa
        if (typeof window.collectPropertyFormData !== 'function') {
            console.error('❌ Hàm collectPropertyFormData chưa sẵn sàng');
            this.showToast('⚠️ Vui lòng đợi trang tải xong', 'warning');
            return;
        }
        
        // Lấy dữ liệu từ hàm chung
        const formData = window.collectPropertyFormData();
        console.log('📝 Dữ liệu form từ hàm chung:', formData);

        if (!this.validateFormData(formData)) {
            return;
        }

        // Tạo modal nếu chưa có
        if (!document.getElementById('pricePredictionModal')) {
            console.log('🔨 Tạo modal mới');
            this.createModal();
            console.log('✅ Modal đã được tạo');
        } else {
            console.log('ℹ️ Modal đã tồn tại');
        }

        // Hiển thị modal
        const modal = document.getElementById('pricePredictionModal');
        console.log('🔍 Modal element:', modal);
        
        if (modal) {
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal đã được hiển thị, display =', modal.style.display);
        } else {
            console.error('❌ Không tìm thấy modal element!');
            return;
        }

        // Bắt đầu dự đoán
        this.predictPrice(formData);
    }

    /**
     * Lấy dữ liệu từ form - GỌI HÀM CHUNG
     * DEPRECATED: Giữ lại để tương thích ngược, nhưng ưu tiên dùng window.collectPropertyFormData
     */
    getFormData() {
        // Dùng hàm chung nếu có
        if (typeof window.collectPropertyFormData === 'function') {
            return window.collectPropertyFormData();
        }
        
        // Fallback cho trường hợp hàm chung chưa load
        console.warn('⚠️ Hàm collectPropertyFormData chưa có, dùng fallback');
        return {
            acreage: parseFloat(document.getElementById('area')?.value) || 0,
            room_type: document.getElementById('propertyType')?.value || '',
            location: {
                city: '', // Sẽ xử lý sau
                district: document.getElementById('district')?.value || '',
                ward: document.getElementById('ward')?.value || ''
            },
            title: document.getElementById('title')?.value || '',
            description: document.getElementById('description')?.value || '',
            amenities: {}
        };
    }

    /**
     * Validate dữ liệu - CHỈ cần các field quan trọng để dự đoán giá
     */
    validateFormData(data) {
        console.log('🔍 Kiểm tra validation với data:', data);
        console.log('  - acreage:', data.acreage);
        console.log('  - room_type:', data.room_type);
        console.log('  - location:', data.location);
        console.log('  - location.city:', data.location?.city);
        console.log('  - location.provinceCode:', data.location?.provinceCode);
        console.log('  - location.district:', data.location?.district);
        
        // 1. Kiểm tra DIỆN TÍCH (BẮT BUỘC)
        if (!data.acreage || data.acreage <= 0) {
            console.warn('⚠️ Thiếu hoặc không hợp lệ: diện tích');
            this.showToast('⚠️ Vui lòng nhập diện tích hợp lệ (lớn hơn 0 m²)', 'warning');
            
            // Scroll đến field area ở Step 1
            const areaField = document.getElementById('area');
            if (areaField) {
                // Chuyển về Step 1 nếu đang ở step khác
                if (typeof changeStep === 'function') {
                    changeStep(1);
                }
                setTimeout(() => {
                    areaField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    areaField.focus();
                    areaField.style.border = '2px solid #ef4444';
                    setTimeout(() => { areaField.style.border = ''; }, 2000);
                }, 300);
            }
            return false;
        }
        
        // 2. Kiểm tra LOẠI HÌNH (BẮT BUỘC)
        if (!data.room_type || data.room_type === '') {
            console.warn('⚠️ Thiếu: loại hình');
            this.showToast('⚠️ Vui lòng chọn loại hình phòng/nhà', 'warning');
            
            const typeField = document.getElementById('propertyType');
            if (typeField) {
                if (typeof changeStep === 'function') {
                    changeStep(1);
                }
                setTimeout(() => {
                    typeField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    typeField.focus();
                    typeField.style.border = '2px solid #ef4444';
                    setTimeout(() => { typeField.style.border = ''; }, 2000);
                }, 300);
            }
            return false;
        }
        
        // 3. Kiểm tra TỈNH/THÀNH PHỐ (BẮT BUỘC) và chỉ hỗ trợ 3 thành phố
        // Chấp nhận cả city code ('HCM', 'HaNoi', 'DaNang') hoặc province text
        const cityCode = data.location?.city || '';
        const provinceText = data.location?.cityText || ''; // Tên tỉnh đầy đủ
        
        console.log('  🔎 Checking city code:', cityCode);
        console.log('  🔎 Province text:', provinceText);
        
        const supportedCities = ['HCM', 'HaNoi', 'DaNang'];
        
        // Nếu city đã là code chuẩn → OK
        if (supportedCities.includes(cityCode)) {
            console.log('✅ City code hợp lệ:', cityCode);
            return true; // Skip validation khác, đủ để dự đoán
        }
        
        // Nếu chưa có city code, kiểm tra provinceText có thể map được không
        if (!cityCode || cityCode === '') {
            console.warn('⚠️ Thiếu city code, kiểm tra provinceText...');
            
            // Kiểm tra xem provinceText có thuộc 3 thành phố không
            const provinceTextLower = (provinceText || '').toLowerCase();
            const isSupported = provinceTextLower.includes('hồ chí minh') || 
                              provinceTextLower.includes('hcm') ||
                              provinceTextLower.includes('tp.hcm') ||
                              provinceTextLower.includes('hà nội') || 
                              provinceTextLower.includes('hanoi') ||
                              provinceTextLower.includes('đà nẵng') || 
                              provinceTextLower.includes('da nang');
            
            if (!isSupported) {
                console.warn('⚠️ Province không thuộc HCM/Hà Nội/Đà Nẵng:', provinceText);
                this.showToast('⚠️ AI hiện chỉ hỗ trợ dự đoán cho TP.HCM, Hà Nội và Đà Nẵng. Vui lòng chọn một trong 3 thành phố này.', 'warning');
                
                const provinceField = document.getElementById('province');
                if (provinceField) {
                    if (typeof changeStep === 'function') {
                        changeStep(2); // Chuyển đến Step 2 - Vị trí
                    }
                    setTimeout(() => {
                        provinceField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        provinceField.focus();
                        provinceField.style.border = '2px solid #ef4444';
                        setTimeout(() => { provinceField.style.border = ''; }, 2000);
                    }, 300);
                }
                return false;
            }
        }
        
        // 4. GỢI Ý về district (không bắt buộc nhưng nên có)
        if (!data.location.district || data.location.district === '') {
            console.warn('⚠️ Thiếu quận/huyện - AI sẽ dự đoán kém chính xác hơn');
            // Không block, chỉ warning trong console
        }
        
        console.log('✅ Validation passed - Đủ thông tin để dự đoán giá');
        console.log('ℹ️ Lưu ý: District, ward càng đầy đủ thì AI dự đoán càng chính xác');
        return true;
    }

    /**
     * Build payload cho Flask API từ formData
     */
    buildApiPayload(formData) {
        // Map city code từ province value
        const cityCode = formData.location?.city || '';
        
        // Map room_type từ propertyType hoặc dùng giá trị đã được map sẵn
        const roomType = formData.room_type || mapPropertyTypeToRoomType(formData.propertyType);
        
        return {
            city: cityCode, // 'HCM', 'HaNoi', 'DaNang' (đã được map sẵn trong collectPropertyFormData)
            acreage: parseFloat(formData.acreage || formData.area || 0),
            district: formData.location?.district || '',
            ward: formData.location?.ward || '',
            address: formData.location?.address || formData.description || '',
            room_type: roomType,
            
            // 8 tiện nghi quan trọng cho AI (0/1)
            has_mezzanine: formData.amenities?.has_mezzanine ? 1 : 0,
            has_wc: formData.amenities?.has_wc ? 1 : 0,
            has_ac: formData.amenities?.has_ac ? 1 : 0,
            has_furniture: formData.amenities?.has_furniture ? 1 : 0,
            has_balcony: formData.amenities?.has_balcony ? 1 : 0,
            has_kitchen: formData.amenities?.has_kitchen ? 1 : 0,
            has_parking: formData.amenities?.has_parking ? 1 : 0,
            has_window: formData.amenities?.has_window ? 1 : 0,
            
            is_studio: formData.is_studio ? 1 : 0,
            title: formData.title || ''
        };
    }

    /**
     * Transform Flask API response → prediction object cho displayPrediction()
     */
    transformFlaskPrediction(flaskResult) {
        const priceVnd = flaskResult.predicted_price_vnd || 0;
        const priceMillion = flaskResult.predicted_price_million || (priceVnd / 1_000_000);
        
        // Tạo khoảng giá ±10%
        const rangeFactor = 0.1;
        const minVnd = Math.round(priceVnd * (1 - rangeFactor));
        const maxVnd = Math.round(priceVnd * (1 + rangeFactor));
        
        // Map confidence level
        let confidenceLevel = 'medium';
        if (flaskResult.confidence === 'high') {
            confidenceLevel = 'high';
        } else if (flaskResult.confidence === 'low' || flaskResult.confidence === 'very_low') {
            confidenceLevel = 'low';
        }
        
        return {
            suggestedPrice: priceVnd,
            suggestedPriceMillion: priceMillion,
            priceRange: {
                min: minVnd,
                max: maxVnd
            },
            confidence: confidenceLevel,
            confidenceLevel: confidenceLevel,
            reasoning: flaskResult.explanation || 'Giá dự đoán dựa trên phân tích AI',
            explanation: flaskResult.explanation || '',
            analysis: {
                locationScore: 7,
                amenitiesScore: 7,
                sizeScore: 7,
                marketMatchScore: 7,
                marketComparison: 'average',
                overallScore: 7,
                scoreText: 'Đánh giá tham khảo từ AI',
                reasonTitle: 'AI dựa trên vị trí, diện tích và tiện nghi',
                reasons: flaskResult.flags || []
            },
            suggestions: flaskResult.suggestions || [],
            rawResult: flaskResult // Giữ lại raw data để debug
        };
    }

    /**
     * Gọi Flask API dự đoán giá qua ngrok
     */
    async predictPrice(formData) {
        const resultContainer = document.getElementById('predictionResult');
        const loadingContainer = document.getElementById('predictionLoading');

        if (!resultContainer || !loadingContainer) return;

        // Show loading
        loadingContainer.style.display = 'block';
        resultContainer.style.display = 'none';

        try {
            // Build payload cho Flask API
            const apiPayload = this.buildApiPayload(formData);
            
            // Kiểm tra city code
            if (!apiPayload.city) {
                this.showError('⚠️ Hiện tại AI chỉ hỗ trợ dự đoán giá cho TP.HCM, Hà Nội và Đà Nẵng.');
                loadingContainer.style.display = 'none';
                return;
            }
            
            console.log('📤 Gửi payload đến Flask API:', apiPayload);
            console.log('🌐 Flask API URL:', FLASK_PREDICT_API_URL);

            const response = await fetch(FLASK_PREDICT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiPayload)
            });

            const result = await response.json();
            console.log('📥 Response từ Flask API:', result);

            // Hide loading
            loadingContainer.style.display = 'none';

            // Kiểm tra lỗi từ API
            if (!response.ok || result.error) {
                const errorMsg = result.error || result.message || 'Không thể dự đoán giá. Vui lòng thử lại!';
                this.showError(errorMsg);
                return;
            }

            // Transform Flask response sang prediction object
            const prediction = this.transformFlaskPrediction(result);
            console.log('✅ Prediction object:', prediction);
            
            this.displayPrediction(prediction);
            
        } catch (error) {
            console.error('❌ Price Prediction Error:', error);
            loadingContainer.style.display = 'none';
            
            let errorMessage = 'Có lỗi xảy ra khi kết nối với AI. ';
            if (error.message.includes('fetch')) {
                errorMessage += 'Vui lòng kiểm tra kết nối mạng hoặc ngrok URL.';
            } else {
                errorMessage += 'Vui lòng thử lại sau!';
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Hiển thị kết quả dự đoán
     */
    displayPrediction(prediction) {
        const resultContainer = document.getElementById('predictionResult');
        if (!resultContainer) return;

        const confidenceText = {
            'high': 'Cao',
            'medium': 'Trung bình',
            'low': 'Thấp'
        };

        const confidenceColor = {
            'high': '#10b981',
            'medium': '#f59e0b',
            'low': '#ef4444'
        };

        let suggestionsHTML = '';
        if (prediction.suggestions && prediction.suggestions.length > 0) {
            suggestionsHTML = prediction.suggestions.map(s => `
                <li style="margin-bottom: 8px;">
                    <i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 8px;"></i>${s}
                </li>
            `).join('');
        }

        resultContainer.innerHTML = `
            <!-- Giá đề xuất -->
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                    💰 Giá thuê đề xuất
                </div>
                <div style="font-size: 48px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">
                    ${(prediction.suggestedPrice / 1000000).toFixed(1)} triệu
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                    Khoảng giá: ${(prediction.priceRange.min / 1000000).toFixed(1)} - ${(prediction.priceRange.max / 1000000).toFixed(1)} triệu/tháng
                </div>
            </div>

            <!-- Độ tin cậy -->
            <div style="background: #f3f4f6; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 600; color: #1f2937;">📊 Độ tin cậy</span>
                    <span style="padding: 4px 12px; background: ${confidenceColor[prediction.confidence]}; color: white; border-radius: 6px; font-size: 13px;">
                        ${confidenceText[prediction.confidence] || 'Trung bình'}
                    </span>
                </div>
                
                <!-- Điểm đánh giá -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                    <div>
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Vị trí</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${prediction.analysis.locationScore * 10}%; height: 100%; background: #3b82f6;"></div>
                            </div>
                            <span style="font-weight: 600; color: #1f2937; font-size: 14px;">${prediction.analysis.locationScore}/10</span>
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Tiện nghi</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${prediction.analysis.amenitiesScore * 10}%; height: 100%; background: #10b981;"></div>
                            </div>
                            <span style="font-weight: 600; color: #1f2937; font-size: 14px;">${prediction.analysis.amenitiesScore}/10</span>
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Diện tích</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${prediction.analysis.sizeScore * 10}%; height: 100%; background: #f59e0b;"></div>
                            </div>
                            <span style="font-weight: 600; color: #1f2937; font-size: 14px;">${prediction.analysis.sizeScore}/10</span>
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">So với thị trường</div>
                        <div style="font-weight: 600; color: #1f2937; font-size: 14px; text-transform: capitalize;">
                            ${prediction.analysis.marketComparison === 'higher' ? '📈 Cao hơn' : 
                              prediction.analysis.marketComparison === 'lower' ? '📉 Thấp hơn' : '📊 Trung bình'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Phân tích -->
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                    📝 Phân tích định giá
                </div>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    ${prediction.reasoning}
                </div>
            </div>

            <!-- Gợi ý -->
            ${suggestionsHTML ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 12px;">
                        💡 Gợi ý cải thiện giá
                    </div>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                        ${suggestionsHTML}
                    </ul>
                </div>
            ` : ''}

            <!-- Nút áp dụng -->
            <div style="margin-top: 24px; display: flex; gap: 12px;">
                <button onclick="window.pricePrediction.applyPrice(${prediction.suggestedPrice})" 
                        style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.background='#2563eb'"
                        onmouseout="this.style.background='#3b82f6'">
                    <i class="fas fa-check mr-2"></i>Áp dụng giá này
                </button>
                <button onclick="window.pricePrediction.closeModal()" 
                        style="padding: 12px 24px; background: #f3f4f6; color: #4b5563; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.background='#e5e7eb'"
                        onmouseout="this.style.background='#f3f4f6'">
                    Đóng
                </button>
            </div>
        `;

        resultContainer.style.display = 'block';
    }

    /**
     * Hiển thị lỗi
     */
    showError(message) {
        const resultContainer = document.getElementById('predictionResult');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px;"></i>
                <div style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
                    ${message}
                </div>
                <button onclick="window.pricePrediction.closeModal()" 
                        style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Đóng
                </button>
            </div>
        `;

        resultContainer.style.display = 'block';
    }

    /**
     * Áp dụng giá vào form
     */
    applyPrice(price) {
        const priceInput = document.getElementById('price');
        const priceUnit = document.getElementById('priceUnit');
        
        if (priceInput && priceUnit) {
            // AI trả về giá theo VNĐ, chuyển đổi sang triệu/tháng
            const priceInMillion = (price / 1000000).toFixed(1);
            
            // Set giá trị
            priceInput.value = priceInMillion;
            priceUnit.value = 'trieu-thang'; // Đảm bảo unit là "Triệu/tháng"
            
            // Trigger change event để update UI và clear errors nếu có
            priceInput.dispatchEvent(new Event('input', { bubbles: true }));
            priceInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Highlight field để user biết đã update
            priceInput.style.border = '2px solid #10b981';
            priceInput.style.background = '#d1fae5';
            setTimeout(() => {
                priceInput.style.border = '';
                priceInput.style.background = '';
            }, 2000);
            
            this.showToast(`✅ Đã áp dụng giá ${priceInMillion} triệu/tháng`, 'success');
            this.closeModal();
            
            // Scroll đến field price để user thấy rõ
            setTimeout(() => {
                priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
            console.log(`💰 Giá đã được cập nhật: ${priceInMillion} triệu (${price} VNĐ)`);
        } else {
            console.error('❌ Không tìm thấy field price hoặc priceUnit');
        }
    }

    /**
     * Đóng modal
     */
    closeModal() {
        const modal = document.getElementById('pricePredictionModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Tạo modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="pricePredictionModal" style="position: fixed; inset: 0; z-index: 99999; display: none; align-items: center; justify-content: center; padding: 20px; background: rgba(0, 0, 0, 0.5);">
                <div style="position: relative; width: 100%; max-width: 600px; max-height: 90vh; background: white; border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; overflow: hidden;">
                    <!-- Header -->
                    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div>
                            <h3 style="font-size: 20px; font-weight: 700; color: white; margin: 0;">
                                <i class="fas fa-robot mr-2"></i>
                                Dự đoán giá thuê bằng AI
                            </h3>
                            <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 4px 0 0 0;">
                                AI phân tích và đề xuất giá thuê phù hợp với thị trường
                            </p>
                        </div>
                        <button onclick="window.pricePrediction.closeModal()" 
                                style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer; padding: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;"
                                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Content -->
                    <div style="flex: 1; overflow-y: auto; padding: 24px;">
                        <!-- Loading -->
                        <div id="predictionLoading" style="text-align: center; padding: 60px 20px; display: block;">
                            <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <div style="color: #6b7280; font-size: 16px;">
                                🤖 AI đang phân tích dữ liệu...
                            </div>
                        </div>

                        <!-- Result -->
                        <div id="predictionResult" style="display: none;">
                            <!-- Kết quả sẽ được render ở đây -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addStyles();
        console.log('✅ Modal HTML đã được thêm vào DOM');
    }

    /**
     * Thêm CSS
     */
    addStyles() {
        if (document.getElementById('price-prediction-styles')) return;

        const styles = `
            <style id="price-prediction-styles">
                .price-prediction-modal {
                    position: fixed !important;
                    inset: 0 !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 20px !important;
                }

                .price-prediction-overlay {
                    position: absolute !important;
                    inset: 0 !important;
                    background: rgba(0, 0, 0, 0.5) !important;
                    backdrop-filter: blur(4px) !important;
                }

                .price-prediction-container {
                    position: relative !important;
                    width: 100% !important;
                    max-width: 600px !important;
                    max-height: 90vh !important;
                    background: white !important;
                    border-radius: 16px !important;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
                    display: flex !important;
                    flex-direction: column !important;
                    animation: slideUp 0.3s ease-out !important;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .price-prediction-header {
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .price-prediction-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Hiển thị toast notification
     */
    showToast(message, type = 'info') {
        // Sử dụng hàm showAlert từ auth.js nếu có
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        } else {
            alert(message);
        }
    }
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    window.pricePrediction = new PricePrediction();
    console.log('💰 Price Prediction initialized');
});
