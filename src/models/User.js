/**
 * ===================================
 * USER MODEL - Sequelize
 * Model người dùng với MySQL
 * ===================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập tên' },
      len: {
        args: [1, 50],
        msg: 'Tên không được quá 50 ký tự'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Email đã được sử dụng'
    },
    validate: {
      notEmpty: { msg: 'Vui lòng nhập email' },
      isEmail: { msg: 'Email không hợp lệ' }
    }
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'Google OAuth ID'
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập số điện thoại' },
      is: {
        args: /^[0-9]{10,11}$/,
        msg: 'Số điện thoại không hợp lệ'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập mật khẩu' },
      len: {
        args: [6, 255],
        msg: 'Mật khẩu phải có ít nhất 6 ký tự'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'landlord', 'admin'),
    defaultValue: 'user'
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: '/images/default-avatar.png'
  },
  address_street: {
    type: DataTypes.STRING(255)
  },
  address_city: {
    type: DataTypes.STRING(100)
  },
  address_district: {
    type: DataTypes.STRING(100)
  },
  address_ward: {
    type: DataTypes.STRING(100)
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(255)
  },
  reset_password_token: {
    type: DataTypes.STRING(255)
  },
  reset_password_expire: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password trước khi save
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods

/**
 * Tạo và trả về JWT token
 */
User.prototype.getSignedJwtToken = function() {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * So sánh password nhập vào với password đã hash
 */
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
