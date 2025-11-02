require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const colors = require('./src/config/colors');
const http = require('http');
const { Server } = require('socket.io');

// Kết nối database
connectDB();

const PORT = process.env.PORT || 3000;

// Tạo HTTP server và Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Khởi tạo Socket.IO handlers
require('./src/socket/chatHandler')(io);

server.listen(PORT, () => {
  console.log(`${colors.green}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🏠 Room Rental System${colors.reset}`);
  console.log(`${colors.green}========================================${colors.reset}`);
  console.log(`${colors.yellow}Server running in ${process.env.NODE_ENV || 'development'} mode${colors.reset}`);
  console.log(`${colors.blue}Port: ${PORT}${colors.reset}`);
  console.log(`${colors.magenta}URL: http://localhost:${PORT}${colors.reset}`);
  console.log(`${colors.cyan}💬 WebSocket: Active${colors.reset}`);
  console.log(`${colors.green}========================================${colors.reset}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`${colors.red}Error: ${err.message}${colors.reset}`);
  server.close(() => process.exit(1));
});
