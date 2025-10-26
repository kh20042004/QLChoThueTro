/**
 * ===================================
 * BOOKING MODEL - Mongoose
 * Model đặt phòng với MongoDB
 * ===================================
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày bắt đầu']
  },
  endDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày kết thúc']
  },
  monthlyRent: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'momo', 'zalopay']
  },
  notes: {
    type: String,
    maxlength: 500
  },
  cancelReason: {
    type: String,
    maxlength: 500
  },
  contractFile: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BookingSchema.index({ property: 1 });
BookingSchema.index({ tenant: 1 });
BookingSchema.index({ landlord: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });

// Middleware: Tính tổng tiền trước khi save
BookingSchema.pre('save', function(next) {
  if (this.isNew) {
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    this.totalAmount = (this.monthlyRent * months) + this.deposit;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
