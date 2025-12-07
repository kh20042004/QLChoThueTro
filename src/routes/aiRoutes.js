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

/**
 * @desc    AI Search - Tìm kiếm phòng bằng hội thoại
 * @route   POST /api/ai/search
 * @access  Public
 */
router.post('/search', aiController.aiSearch);

/**
 * @desc    Dự đoán giá thuê phòng bằng AI
 * @route   POST /api/ai/predict-price
 * @access  Public
 */
router.post('/predict-price', aiController.predictPrice);

/**
 * @desc    Phân tích hình ảnh phòng
 * @route   POST /api/ai/analyze-image
 * @access  Public
 */
router.post('/analyze-image', aiController.analyzeImage);

/**
 * @desc    NLP Search - Tìm kiếm bằng ngôn ngữ tự nhiên
 * @route   POST /api/ai/nlp-search
 * @access  Public
 */
router.post('/nlp-search', aiController.nlpSearch);

/**
 * @desc    Multi-language Search - Tìm kiếm đa ngôn ngữ
 * @route   POST /api/ai/multilang-search
 * @access  Public
 */
router.post('/multilang-search', aiController.multiLangSearch);

/**
 * @desc    Parse Query - Phân tích câu tìm kiếm
 * @route   POST /api/ai/parse-query
 * @access  Public
 */
router.post('/parse-query', aiController.parseQuery);

module.exports = router;
