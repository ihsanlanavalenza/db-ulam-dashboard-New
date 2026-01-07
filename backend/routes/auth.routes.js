// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiter untuk login - 5 attempts per 15 menit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 requests
  message: { message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', requireAuth, authController.logout);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and get user data
 * @access  Private
 */
router.get('/verify', requireAuth, authController.verifyToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', requireAuth, authController.getProfile);

module.exports = router;
