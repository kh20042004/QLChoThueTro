require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const colors = require('./src/config/colors');

// Kết nối database
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`${colors.green}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🏠 Room Rental System${colors.reset}`);
  console.log(`${colors.green}========================================${colors.reset}`);
  console.log(`${colors.yellow}Server running in ${process.env.NODE_ENV || 'development'} mode${colors.reset}`);
  console.log(`${colors.blue}Port: ${PORT}${colors.reset}`);
  console.log(`${colors.magenta}URL: http://localhost:${PORT}${colors.reset}`);
  console.log(`${colors.green}========================================${colors.reset}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`${colors.red}Error: ${err.message}${colors.reset}`);
  server.close(() => process.exit(1));
});
