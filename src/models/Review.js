/**
 * ===================================
 * REVIEW MODEL - Mongoose
 * Model đánh giá với MongoDB
 * ===================================
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Vui lòng chọn đánh giá'],
    min: [1, 'Đánh giá phải từ 1 đến 5'],
    max: [5, 'Đánh giá phải từ 1 đến 5']
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề'],
    maxlength: [100, 'Tiêu đề không được quá 100 ký tự'],
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Vui lòng nhập nhận xét']
  },
  images: [{
    type: String
  }],
  helpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  reviewType: {
    type: String,
    enum: ['viewing', 'rented'],
    required: [true, 'Vui lòng xác định loại đánh giá']
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  // Moderation fields
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  autoApproved: {
    type: Boolean,
    default: false
  },
  autoRejected: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String
  },
  moderationDetails: {
    type: Object
  },
  moderatedAt: {
    type: Date
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ReviewSchema.index({ property: 1, user: 1 }, { unique: true });
ReviewSchema.index({ property: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ moderationStatus: 1 });
ReviewSchema.index({ trustScore: 1 });

// Static method: Tính average rating cho property
ReviewSchema.statics.getAverageRating = async function(propertyId) {
  const obj = await this.aggregate([
    {
      $match: { property: propertyId }
    },
    {
      $group: {
        _id: '$property',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Property').findByIdAndUpdate(propertyId, {
      averageRating: obj[0]?.averageRating || 0,
      totalReviews: obj[0]?.totalReviews || 0
    });
  } catch (err) {
    console.error('Error updating property rating:', err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.property);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.property);
});

module.exports = mongoose.model('Review', ReviewSchema);
