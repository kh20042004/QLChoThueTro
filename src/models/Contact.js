/**
 * ===================================
 * CONTACT MODEL
 * Model cho quản lý liên hệ từ người dùng
 * ===================================
 */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Thông tin người liên hệ
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Tên không được vượt quá 100 ký tự']
  },
  
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập email hợp lệ'
    ]
  },
  
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    match: [
      /^[0-9]{10}$/,
      'Số điện thoại phải có 10 chữ số'
    ]
  },
  
  subject: {
    type: String,
    required: [true, 'Vui lòng nhập chủ đề'],
    trim: true,
    maxlength: [200, 'Chủ đề không được vượt quá 200 ký tự']
  },
  
  message: {
    type: String,
    required: [true, 'Vui lòng nhập tin nhắn'],
    trim: true,
    maxlength: [2000, 'Tin nhắn không được vượt quá 2000 ký tự']
  },
  
  // Trạng thái xử lý
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  
  // Người xử lý (admin)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Ghi chú của admin
  adminNote: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
  },
  
  // Độ ưu tiên
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Loại liên hệ
  category: {
    type: String,
    enum: ['general', 'support', 'complaint', 'feedback', 'partnership', 'other'],
    default: 'general'
  },
  
  // IP address (để chống spam)
  ipAddress: {
    type: String
  },
  
  // User agent
  userAgent: {
    type: String
  },
  
  // Thời gian xử lý
  resolvedAt: {
    type: Date
  },
  
  // Người giải quyết
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes cho tìm kiếm
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ createdAt: -1 });

// Virtual cho thời gian phản hồi
contactSchema.virtual('responseTime').get(function() {
  if (this.resolvedAt && this.createdAt) {
    return Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // Hours
  }
  return null;
});

// Static method: Lấy thống kê liên hệ
contactSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        statusCounts: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ],
        priorityCounts: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ],
        categoryCounts: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ],
        totalCount: [
          {
            $count: 'total'
          }
        ],
        avgResponseTime: [
          {
            $match: {
              resolvedAt: { $exists: true }
            }
          },
          {
            $project: {
              responseTime: {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60 // Convert to hours
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: '$responseTime' }
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

module.exports = mongoose.model('Contact', contactSchema);
