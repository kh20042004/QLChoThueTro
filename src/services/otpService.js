/**
 * ===================================
 * OTP SERVICE
 * Service xử lý tạo và xác thực OTP
 * ===================================
 */

const crypto = require('crypto');

class OTPService {
  /**
   * Tạo mã OTP 6 chữ số ngẫu nhiên
   * @returns {string} Mã OTP 6 chữ số
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Gửi OTP (mô phỏng - chỉ log ra console)
   * Trong production, thay thế bằng service SMS thật (Twilio, VNPT, etc.)
   * @param {string} phone - Số điện thoại
   * @param {string} otp - Mã OTP
   */
  async sendOTP(phone, otp) {
    // MÔ PHỎNG: Log ra console thay vì gửi SMS thật
    console.log('\n═══════════════════════════════════════');
    console.log('📱 PHONE VERIFICATION OTP');
    console.log('═══════════════════════════════════════');
    console.log(`📞 Số điện thoại: ${phone}`);
    console.log(`🔐 Mã OTP: ${otp}`);
    console.log(`⏰ Hiệu lực: 10 phút`);
    console.log('═══════════════════════════════════════\n');

    // Trong production, sử dụng Twilio hoặc service SMS khác:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Mã xác thực HomeRent của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });
    */

    return {
      success: true,
      message: 'OTP đã được gửi (check console để xem mã)',
      // Trong development, trả về OTP để test dễ dàng
      // Trong production, KHÔNG bao giờ trả về OTP trong response
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    };
  }

  /**
   * Tính thời gian hết hạn OTP (10 phút từ bây giờ)
   * @returns {Date} Thời điểm hết hạn
   */
  getOTPExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 phút
  }

  /**
   * Hash OTP trước khi lưu vào database
   * @param {string} otp - Mã OTP gốc
   * @returns {string} OTP đã hash
   */
  hashOTP(otp) {
    return crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
  }

  /**
   * So sánh OTP người dùng nhập với OTP đã hash
   * @param {string} inputOTP - OTP người dùng nhập
   * @param {string} hashedOTP - OTP đã hash trong database
   * @returns {boolean} True nếu khớp
   */
  verifyOTP(inputOTP, hashedOTP) {
    const inputHash = this.hashOTP(inputOTP);
    return inputHash === hashedOTP;
  }

  /**
   * Kiểm tra OTP có hết hạn chưa
   * @param {Date} expiryDate - Thời điểm hết hạn
   * @returns {boolean} True nếu còn hiệu lực
   */
  isOTPValid(expiryDate) {
    return Date.now() < expiryDate.getTime();
  }
}

module.exports = new OTPService();
