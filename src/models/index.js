/**
 * ===================================
 * MODEL EXPORTS
 * Export tất cả models cho MongoDB/Mongoose
 * ===================================
 */

const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Review = require('./Review');
const University = require('./University');

module.exports = {
  User,
  Property,
  Booking,
  Review,
  University
};
