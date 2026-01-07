// backend/routes/dataManagement.routes.js
const express = require('express');
const router = express.Router();
const dataManagementController = require('../controllers/dataManagement.controller');
const { requireAuth, applyDataFilter } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiter for data management - 50 requests per 15 minutes
const dataManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Terlalu banyak request. Silakan coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication and apply data filtering
router.use(dataManagementLimiter);
router.use(requireAuth);
router.use(applyDataFilter);

// Get transactions with pagination and filters
router.get('/transactions', dataManagementController.getTransactions);

// Create new transaction
router.post('/transactions', dataManagementController.createTransaction);

// Delete transaction
router.delete('/transactions/:id', dataManagementController.deleteTransaction);

module.exports = router;
