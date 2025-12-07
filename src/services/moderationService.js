/**
 * ===================================
 * MODERATION SERVICE (Node.js)
 * Tích hợp với ML Moderation API
 * ===================================
 */

const axios = require('axios');

class ModerationService {
  constructor() {
    // URL của ML service (chạy trên Colab hoặc local)
    this.serviceUrl = process.env.MODERATION_SERVICE_URL || 'http://localhost:5000';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Moderate một property
   * @param {Object} propertyData - Dữ liệu property
   * @returns {Promise<Object>} - Kết quả moderation
   */
  async moderate(propertyData) {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/api/moderate`,
        { property: propertyData },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Moderation Service Error:', error.message);
      
      // Fallback: nếu service down, dùng basic rules
      return this._fallbackModeration(propertyData);
    }
  }

  /**
   * Moderate nhiều properties
   * @param {Array} properties - Mảng properties
   * @returns {Promise<Array>} - Mảng kết quả
   */
  async moderateBatch(properties) {
    try {
      const response = await axios.post(
        `${this.serviceUrl}/api/moderate/batch`,
        { properties },
        { timeout: this.timeout * 2 }
      );

      return response.data.results;
    } catch (error) {
      console.error('❌ Batch Moderation Error:', error.message);
      
      // Fallback cho từng property
      const results = [];
      for (const prop of properties) {
        results.push(await this.moderate(prop));
      }
      return results;
    }
  }

  /**
   * Check health của service
   * @returns {Promise<Boolean>} - Service có sẵn sàng không
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.serviceUrl}/api/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Fallback moderation khi ML service không khả dụng
   * Chỉ dùng basic rules
   */
  _fallbackModeration(propertyData) {
    const { title, description, price, area, images } = propertyData;
    
    let score = 1.0;
    const reasons = ['⚠️ ML service không khả dụng - sử dụng basic rules'];
    
    // Basic checks
    if (!title || title.length < 10) score -= 0.2;
    if (!description || description.length < 50) score -= 0.3;
    if (!images || images.length < 3) score -= 0.2;
    if (!price || price <= 0) score -= 0.3;
    
    return {
      success: true,
      overall_score: Math.max(0, score),
      decision: score >= 0.85 ? 'auto_approved' : (score >= 0.60 ? 'pending_review' : 'rejected'),
      decision_text: score >= 0.85 ? '✅ Tự động duyệt' : (score >= 0.60 ? '⏳ Chờ duyệt' : '❌ Từ chối'),
      details: {
        rule_score: score,
        ml_score: 0
      },
      reasons,
      suggestions: ['Vui lòng kiểm tra lại sau khi ML service khả dụng'],
      fallback: true
    };
  }
}

module.exports = new ModerationService();
