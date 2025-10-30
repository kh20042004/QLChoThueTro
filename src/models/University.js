/**
 * ===================================
 * UNIVERSITY MODEL
 * Model lưu trữ thông tin trường đại học TP.HCM
 * ===================================
 */

const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên trường là bắt buộc'],
      trim: true,
      index: true
    },
    shortName: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    description: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc']
    },
    district: {
      type: String,
      required: true,
      enum: [
        'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6',
        'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
        'Quận Bình Tân', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận',
        'Quận Tân Bình', 'Quận Tân Phú', 'Thành phố Thủ Đức'
      ]
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true
    },
    website: {
      type: String,
      default: ''
    },
    foundedYear: {
      type: Number,
      default: null
    },
    studentCount: {
      type: Number,
      default: null
    },
    facultyCount: {
      type: Number,
      default: null
    },
    ranking: {
      type: Number,
      default: null
    },
    specialties: {
      type: [String],
      default: []
    },
    campuses: {
      type: [
        {
          name: String,
          address: String,
          location: {
            type: {
              type: String,
              enum: ['Point'],
              default: 'Point'
            },
            coordinates: [Number]
          }
        }
      ],
      default: []
    },
    imageUrl: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Tạo 2dsphere index cho location
universitySchema.index({ location: '2dsphere' });

// Index cho tìm kiếm nhanh
universitySchema.index({ name: 'text', description: 'text', specialties: 'text' });

// Virtual để lấy tên quận đơn giản
universitySchema.virtual('districtName').get(function () {
  return this.district;
});

module.exports = mongoose.model('University', universitySchema);
