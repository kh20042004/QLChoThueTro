/**
 * ===================================
 * MODEL ASSOCIATIONS
 * Định nghĩa quan hệ giữa các models
 * ===================================
 */

const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Review = require('./Review');

// User - Property (1-n): Một user có thể có nhiều property
User.hasMany(Property, {
  foreignKey: 'landlord_id',
  as: 'properties'
});
Property.belongsTo(User, {
  foreignKey: 'landlord_id',
  as: 'landlord'
});

// User - Booking (1-n): Một user có thể có nhiều booking (cả landlord lẫn tenant)
User.hasMany(Booking, {
  foreignKey: 'tenant_id',
  as: 'bookings_as_tenant'
});
User.hasMany(Booking, {
  foreignKey: 'landlord_id',
  as: 'bookings_as_landlord'
});
Booking.belongsTo(User, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});
Booking.belongsTo(User, {
  foreignKey: 'landlord_id',
  as: 'landlord'
});

// Property - Booking (1-n): Một property có thể có nhiều booking
Property.hasMany(Booking, {
  foreignKey: 'property_id',
  as: 'bookings'
});
Booking.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

// User - Review (1-n): Một user có thể có nhiều review
User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews'
});
Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Property - Review (1-n): Một property có thể có nhiều review
Property.hasMany(Review, {
  foreignKey: 'property_id',
  as: 'reviews'
});
Review.belongsTo(Property, {
  foreignKey: 'property_id',
  as: 'property'
});

module.exports = {
  User,
  Property,
  Booking,
  Review
};
