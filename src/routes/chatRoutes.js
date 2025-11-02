/**
 * ===================================
 * CHAT ROUTES
 * Định nghĩa routes cho chức năng chat
 * ===================================
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Protect tất cả routes
router.use(protect);

// Conversations
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createOrGetConversation);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);

// Utilities
router.get('/unread-count', chatController.getUnreadCount);
router.get('/search', chatController.searchConversations);

module.exports = router;
