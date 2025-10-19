/**
 * ===================================
 * BOOKING MODEL - Sequelize
 * Model đặt phòng với MySQL
 * ===================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  landlord_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng chọn ngày bắt đầu' },
      isDate: true
    }
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng chọn ngày kết thúc' },
      isDate: true
    }
  },
  monthly_rent: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  deposit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'transfer', 'momo', 'zalopay')
  },
  notes: {
    type: DataTypes.STRING(500)
  },
  cancel_reason: {
    type: DataTypes.STRING(500)
  },
  contract_file: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  hooks: {
    beforeCreate: (booking) => {
      // Tính tổng tiền khi tạo mới
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
      booking.total_amount = (booking.monthly_rent * months) + booking.deposit;
    }
  }
});

module.exports = Booking;
