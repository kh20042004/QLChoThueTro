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
const Conversation = require('./Conversation');
const Message = require('./Message');
const Notification = require('./Notification');
const Contact = require('./Contact');

module.exports = {
  User,
  Property,
  Booking,
  Review,
  University,
  Conversation,
  Message,
  Notification,
  Contact
};
