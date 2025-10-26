/**
 * ===================================
 * PRICE PREDICTION - Dự đoán giá thuê bằng AI
 * ===================================
 */

class PricePrediction {
    constructor() {
        this.isPredicting = false;
        this.init();
    }

    init() {
        // Lắng nghe sự kiện click nút dự đoán giá
        const predictBtn = document.getElementById('predictPriceBtn');
        if (predictBtn) {
            predictBtn.addEventListener('click', () => this.showPredictionModal());
        }
    }

    /**
     * Hiển thị modal dự đoán giá
     */
    showPredictionModal() {
        // Lấy dữ liệu từ form
        const formData = this.getFormData();

        if (!this.validateFormData(formData)) {
            this.showToast('Vui lòng điền đầy đủ thông tin: diện tích, vị trí, loại hình', 'warning');
            return;
        }

        // Tạo modal nếu chưa có
        if (!document.getElementById('pricePredictionModal')) {
            this.createModal();
        }

        // Hiển thị modal
        const modal = document.getElementById('pricePredictionModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Bắt đầu dự đoán
        this.predictPrice(formData);
    }

    /**
     * Lấy dữ liệu từ form
     */
    getFormData() {
        return {
            area: document.getElementById('area')?.value || '',
            propertyType: document.getElementById('propertyType')?.value || '',
            location: {
                district: document.getElementById('district')?.value || '',
                city: document.getElementById('city')?.value || ''
            },
            bedrooms: document.getElementById('bedrooms')?.value || '',
            bathrooms: document.getElementById('bathrooms')?.value || '',
            floor: document.getElementById('floor')?.value || '',
            description: document.getElementById('description')?.value || '',
            amenities: {
                wifi: document.getElementById('wifi')?.checked || false,
                airConditioner: document.getElementById('airConditioner')?.checked || false,
                parking: document.getElementById('parking')?.checked || false,
                kitchen: document.getElementById('kitchen')?.checked || false,
                waterHeater: document.getElementById('waterHeater')?.checked || false,
                washing: document.getElementById('washing')?.checked || false,
                refrigerator: document.getElementById('refrigerator')?.checked || false,
                tv: document.getElementById('tv')?.checked || false
            }
        };
    }

    /**
     * Validate dữ liệu
     */
    validateFormData(data) {
        return data.area && data.propertyType && data.location.city;
    }

    /**
     * Gọi API dự đoán giá
     */
    async predictPrice(formData) {
        const resultContainer = document.getElementById('predictionResult');
        const loadingContainer = document.getElementById('predictionLoading');

        if (!resultContainer || !loadingContainer) return;

        // Show loading
        loadingContainer.style.display = 'block';
        resultContainer.style.display = 'none';

        try {
            const response = await fetch('/api/ai/predict-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            // Hide loading
            loadingContainer.style.display = 'none';

            if (data.success && data.data.prediction) {
                this.displayPrediction(data.data.prediction);
            } else {
                this.showError('Không thể dự đoán giá. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Price Prediction Error:', error);
            loadingContainer.style.display = 'none';
            this.showError('Có lỗi xảy ra. Vui lòng thử lại sau!');
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
        if (priceInput) {
            priceInput.value = price;
            this.showToast('Đã áp dụng giá đề xuất!', 'success');
            this.closeModal();
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
            <div id="pricePredictionModal" class="price-prediction-modal" style="display: none;">
                <div class="price-prediction-overlay" onclick="window.pricePrediction.closeModal()"></div>
                <div class="price-prediction-container">
                    <!-- Header -->
                    <div class="price-prediction-header">
                        <div>
                            <h3 style="font-size: 20px; font-weight: 700; color: #1f2937; margin: 0;">
                                <i class="fas fa-robot mr-2" style="color: #3b82f6;"></i>
                                Dự đoán giá thuê bằng AI
                            </h3>
                            <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">
                                AI phân tích và đề xuất giá thuê phù hợp với thị trường
                            </p>
                        </div>
                        <button onclick="window.pricePrediction.closeModal()" 
                                style="background: none; border: none; color: #6b7280; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;"
                                onmouseover="this.style.background='#f3f4f6'"
                                onmouseout="this.style.background='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="price-prediction-content">
                        <!-- Loading -->
                        <div id="predictionLoading" style="text-align: center; padding: 60px 20px; display: block;">
                            <div class="spinner" style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
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
    }

    /**
     * Thêm CSS
     */
    addStyles() {
        if (document.getElementById('price-prediction-styles')) return;

        const styles = `
            <style id="price-prediction-styles">
                .price-prediction-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .price-prediction-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }

                .price-prediction-container {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease-out;
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
