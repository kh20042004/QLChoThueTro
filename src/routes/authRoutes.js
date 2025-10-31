/**
 * ===================================
 * AUTH ROUTES
 * Định tuyến cho authentication
 * ===================================
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  updateProfile,
  updateAddress,
  changePassword,
  updatePreferences,
  uploadAvatar,
  deleteAccount,
  googleCallback,
  googleFailure,
  sendPhoneOTP,
  verifyPhoneOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account', // Luôn hiện giao diện chọn tài khoản Gmail
    session: false
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false,
    failureMessage: true
  }),
  googleCallback
);

router.get('/google/failure', googleFailure);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Profile routes
router.put('/profile', protect, updateProfile);
router.put('/address', protect, updateAddress);
router.post('/change-password', protect, changePassword);
router.put('/preferences', protect, updatePreferences);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/delete-account', protect, deleteAccount);

// Phone verification routes
router.post('/phone/send-otp', protect, sendPhoneOTP);
router.post('/phone/verify-otp', protect, verifyPhoneOTP);

module.exports = router;