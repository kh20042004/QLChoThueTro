/**
 * ===================================
 * CONTACT CONTROLLER
 * Xử lý các API cho contact (người dùng)
 * ===================================
 */

const Contact = require('../models/Contact');

/**
 * @desc    Tạo liên hệ mới
 * @route   POST /api/contacts
 * @access  Public
 */
exports.createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create contact
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.',
      data: contact
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    next(error);
  }
};
