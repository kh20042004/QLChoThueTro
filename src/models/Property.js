/**
 * ===================================
 * PROPERTY MODEL - Sequelize
 * Model phòng trọ/nhà với MySQL
 * ===================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập tiêu đề' },
      len: {
        args: [1, 200],
        msg: 'Tiêu đề không được quá 200 ký tự'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập mô tả' }
    }
  },
  property_type: {
    type: DataTypes.ENUM('phong-tro', 'nha-nguyen-can', 'can-ho', 'chung-cu-mini', 'homestay'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng chọn loại hình' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Giá phải lớn hơn 0'
      }
    }
  },
  deposit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  area: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Diện tích phải lớn hơn 0'
      }
    }
  },
  address_street: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập địa chỉ' }
    }
  },
  address_ward: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập phường/xã' }
    }
  },
  address_district: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập quận/huyện' }
    }
  },
  address_city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Vui lòng nhập tỉnh/thành phố' }
    }
  },
  address_full: {
    type: DataTypes.STRING(500)
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  kitchen: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  amenities: {
    type: DataTypes.JSON, // Lưu mảng amenities dưới dạng JSON
    defaultValue: []
  },
  utility_electric: {
    type: DataTypes.STRING(100),
    defaultValue: 'Theo đồng hồ'
  },
  utility_water: {
    type: DataTypes.STRING(100),
    defaultValue: 'Theo đồng hồ'
  },
  utility_internet: {
    type: DataTypes.STRING(100),
    defaultValue: 'Miễn phí'
  },
  utility_parking: {
    type: DataTypes.STRING(100),
    defaultValue: 'Miễn phí'
  },
  rules: {
    type: DataTypes.TEXT
  },
  images: {
    type: DataTypes.JSON, // Lưu mảng images dưới dạng JSON
    defaultValue: []
  },
  landlord_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'rented', 'pending', 'inactive'),
    defaultValue: 'available'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  average_rating: {
    type: DataTypes.DECIMAL(3, 2),
    validate: {
      min: 1,
      max: 5
    }
  },
  total_reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ai_score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'properties',
  timestamps: true,
  hooks: {
    beforeSave: (property) => {
      // Tạo địa chỉ đầy đủ
      property.address_full = `${property.address_street}, ${property.address_ward}, ${property.address_district}, ${property.address_city}`;
    }
  }
});

module.exports = Property;
