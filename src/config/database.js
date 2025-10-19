/**
 * ===================================
 * DATABASE CONFIGURATION - MySQL
 * Cấu hình kết nối MySQL với Sequelize
 * ===================================
 */

const { Sequelize } = require('sequelize');
const colors = require('./colors');

// Tạo instance Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'room_rental_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true, // Sử dụng snake_case cho tên cột
      freezeTableName: true // Không tự động thêm 's' vào tên bảng
    }
  }
);

/**
 * Hàm kết nối database
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`${colors.cyan}✓ MySQL Connected: ${process.env.DB_HOST || 'localhost'}${colors.reset}`);
    
    // Sync models với database (chỉ dùng trong development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log(`${colors.green}✓ Database synced${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error connecting to MySQL: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
