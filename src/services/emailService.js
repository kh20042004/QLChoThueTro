/**
 * ===================================
 * EMAIL SERVICE
 * Gửi email thông báo cho người dùng
 * ===================================
 */

const nodemailer = require('nodemailer');

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

/**
 * Gửi email thông báo kết quả xét duyệt bài đăng
 */
async function sendModerationResultEmail(user, property, moderationResult) {
  try {
    // Kiểm tra user có email không
    if (!user || !user.email) {
      console.log('⚠️ User không có email, bỏ qua gửi email');
      return;
    }

    const { status, moderationScore, failedReason, moderationSuggestions } = moderationResult;

    // Xác định tiêu đề và nội dung email
    let subject = '';
    let statusText = '';
    let statusColor = '';
    let actionText = '';

    if (status === 'available') {
      subject = '🎉 Bài đăng của bạn đã được duyệt!';
      statusText = 'ĐÃ ĐƯỢC DUYỆT';
      statusColor = '#10b981'; // green
      actionText = 'Bài đăng của bạn đã được tự động duyệt và hiển thị công khai trên hệ thống. Người dùng có thể tìm kiếm và xem bài đăng của bạn.';
    } else if (status === 'rejected') {
      subject = '❌ Bài đăng của bạn không đạt tiêu chuẩn';
      statusText = 'BỊ TỪ CHỐI';
      statusColor = '#ef4444'; // red
      actionText = 'Bài đăng của bạn không đạt tiêu chuẩn chất lượng và đã bị từ chối. Vui lòng chỉnh sửa và đăng lại.';
    } else {
      subject = '⏳ Bài đăng của bạn đang chờ xét duyệt';
      statusText = 'CHỜ XÉT DUYỆT';
      statusColor = '#f59e0b'; // yellow
      actionText = 'Bài đăng của bạn đang chờ quản trị viên xem xét. Chúng tôi sẽ thông báo khi có kết quả.';
    }

    // Tạo danh sách vấn đề
    const issuesList = moderationSuggestions && moderationSuggestions.length > 0
      ? moderationSuggestions.map(issue => `<li style="margin: 5px 0; color: #dc2626;">• ${issue}</li>`).join('')
      : '<li style="margin: 5px 0; color: #10b981;">Không có vấn đề đặc biệt</li>';

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả xét duyệt bài đăng</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Kết quả xét duyệt bài đăng
              </h1>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                ${statusText}
              </div>
            </td>
          </tr>

          <!-- Property Info -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px;">
                <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px;">📝 ${property.title}</h3>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">📍 ${property.address?.full || 'Địa chỉ không xác định'}</p>
                <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">💰 ${formatPrice(property.price)}</p>
              </div>
            </td>
          </tr>

          <!-- Score -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="text-align: center;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Điểm đánh giá tổng thể</p>
                <div style="font-size: 36px; font-weight: bold; color: ${statusColor};">
                  ${moderationScore ? moderationScore.toFixed(1) : '0'}/100
                </div>
              </div>
            </td>
          </tr>

          <!-- Action Text -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${actionText}
              </p>
            </td>
          </tr>

          <!-- Reason (if rejected or pending) -->
          ${failedReason ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Lý do:</strong> ${failedReason}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Issues List -->
          ${moderationSuggestions && moderationSuggestions.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <h4 style="margin: 0 0 12px; color: #1f2937; font-size: 16px;">Chi tiết phát hiện:</h4>
              <ul style="margin: 0; padding-left: 0; list-style: none;">
                ${issuesList}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- Call to Action -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              ${status === 'rejected' ? `
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/property/edit/${property._id}" 
                   style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Chỉnh sửa bài đăng
                </a>
              ` : status === 'available' ? `
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/properties/${property._id}" 
                   style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Xem bài đăng
                </a>
              ` : `
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/my-properties" 
                   style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Quản lý bài đăng
                </a>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                Đây là email tự động, vui lòng không trả lời email này.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 Hệ thống cho thuê phòng trọ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Gửi email
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Hệ thống cho thuê phòng trọ" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent
    });

    console.log('✅ Đã gửi email thông báo đến:', user.email);
    console.log('📧 Message ID:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error.message);
    // Không throw error để không ảnh hưởng đến flow chính
    return false;
  }
}

/**
 * Format giá tiền
 */
function formatPrice(price) {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

module.exports = {
  sendModerationResultEmail
};
