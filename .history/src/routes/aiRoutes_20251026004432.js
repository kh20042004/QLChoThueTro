/**
 * ===================================
 * AI ROUTES
 * Định tuyến cho các tính năng AI với Gemini
 * ===================================
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

/**
 * @desc    Chatbot AI với Gemini
 * @route   POST /api/ai/chat
 * @access  Public
 */
router.post('/chat', aiController.chat);

/**
 * @desc    AI gợi ý phòng phù hợp
 * @route   POST /api/ai/recommend
 * @access  Public
 */
router.post('/recommend', aiController.getRecommendation);

/**
 * @desc    AI phân tích và cải thiện mô tả phòng
 * @route   POST /api/ai/analyze-description
 * @access  Private (Landlord only)
 */
router.post('/analyze-description', protect, authorize('landlord'), aiController.analyzeDescription);

/**
 * @desc    AI trả lời câu hỏi thường gặp
 * @route   POST /api/ai/faq
 * @access  Public
 */
router.post('/faq', aiController.answerFAQ);

module.exports = router;
