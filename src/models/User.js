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
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'HoTen',
    validate: {
      notEmpty: { msg: 'Vui lòng nhập tên' },
      len: {
        args: [1, 100],
        msg: 'Tên không được quá 100 ký tự'
      }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: {
      msg: 'Email đã được sử dụng'
    },
    field: 'Email',
    validate: {
      notEmpty: { msg: 'Vui lòng nhập email' },
      isEmail: { msg: 'Email không hợp lệ' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'MatKhau',
    validate: {
      notEmpty: { msg: 'Vui lòng nhập mật khẩu' },
      len: {
        args: [6, 255],
        msg: 'Mật khẩu phải có ít nhất 6 ký tự'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'SoDienThoai',
    validate: {
      is: {
        args: /^[0-9]{10,11}$/,
        msg: 'Số điện thoại không hợp lệ'
      }
    }
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'AnhDaiDien',
    defaultValue: '/images/default-avatar.png'
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'VaiTroId',
    defaultValue: 1,
    references: {
      model: 'vaitro',
      key: 'Id'
    }
  },
  status: {
    type: DataTypes.ENUM('HoatDong', 'Khoa'),
    defaultValue: 'HoatDong',
    field: 'TrangThai'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'NgayTao'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'NgayCapNhat'
  }
}, {
  tableName: 'nguoidung',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
