/**
 * ===================================
 * DATABASE CONFIGURATION - MongoDB
 * Cấu hình kết nối MongoDB với Mongoose
 * ===================================
 */

const mongoose = require('mongoose');
const colors = require('./colors');

/**
 * Hàm kết nối database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Các options mới của Mongoose 7+
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`${colors.cyan}✓ MongoDB Connected: ${conn.connection.host}${colors.reset}`);
    console.log(`${colors.green}✓ Database: ${conn.connection.name}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Error connecting to MongoDB: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

// Xử lý các sự kiện kết nối
mongoose.connection.on('disconnected', () => {
  console.log(`${colors.yellow}⚠ MongoDB disconnected${colors.reset}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`${colors.red}✗ MongoDB error: ${err.message}${colors.reset}`);
});

module.exports = { mongoose, connectDB };
