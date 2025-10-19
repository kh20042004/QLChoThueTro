/**
 * ===================================
 * REVIEW MODEL - Sequelize
 * Model đánh giá với MySQL
 * ===================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng chọn đánh giá' },
      min: {
        args: [1],
        msg: 'Đánh giá phải từ 1 đến 5'
      },
      max: {
        args: [5],
        msg: 'Đánh giá phải từ 1 đến 5'
      }
    }
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập tiêu đề' },
      len: {
        args: [1, 100],
        msg: 'Tiêu đề không được quá 100 ký tự'
      }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập nhận xét' }
    }
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  helpful: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['property_id', 'user_id']
    }
  ]
});

module.exports = Review;
