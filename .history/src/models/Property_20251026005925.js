/**
 * ===================================
 * PROPERTY MODEL - Mongoose
 * Model phòng trọ/nhà với MongoDB
 * ===================================
 */

const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề'],
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả']
  },
  propertyType: {
    type: String,
    required: [true, 'Vui lòng chọn loại hình'],
    enum: ['phong-tro', 'nha-nguyen-can', 'can-ho', 'chung-cu-mini', 'homestay']
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá'],
    min: [0, 'Giá phải lớn hơn 0']
  },
  deposit: {
    type: Number,
    default: 0
  },
  area: {
    type: Number,
    required: [true, 'Vui lòng nhập diện tích'],
    min: [1, 'Diện tích phải lớn hơn 0']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Vui lòng nhập địa chỉ']
    },
    ward: {
      type: String,
      required: [true, 'Vui lòng nhập phường/xã']
    },
    district: {
      type: String,
      required: [true, 'Vui lòng nhập quận/huyện']
    },
    city: {
      type: String,
      required: [true, 'Vui lòng nhập tỉnh/thành phố']
    },
    full: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  bedrooms: {
    type: Number,
    default: 1
  },
  bathrooms: {
    type: Number,
    default: 1
  },
  kitchen: {
    type: Number,
    default: 0
  },
  amenities: [{
    type: String
  }],
  utilities: {
    electric: {
      type: String,
      default: 'Theo đồng hồ'
    },
    water: {
      type: String,
      default: 'Theo đồng hồ'
    },
    internet: {
      type: String,
      default: 'Miễn phí'
    },
    parking: {
      type: String,
      default: 'Miễn phí'
    }
  },
  rules: String,
  images: [{
    type: String
  }],
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'pending', 'inactive'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    min: 1,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PropertySchema.index({ landlord: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ 'address.city': 1, 'address.district': 1 });
PropertySchema.index({ location: '2dsphere' });

// Virtual cho reviews
PropertySchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'property'
});

// Middleware: Tạo địa chỉ đầy đủ trước khi save
PropertySchema.pre('save', function(next) {
  if (this.address) {
    this.address.full = `${this.address.street}, ${this.address.ward}, ${this.address.district}, ${this.address.city}`;
  }
  next();
});

module.exports = mongoose.model('Property', PropertySchema);
