// backend/routes/export.routes.js
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { requireAuth, applyDataFilter } = require('../middleware/auth.middleware');

// Apply authentication and data filter to all routes
router.use(requireAuth);
router.use(applyDataFilter);

// Export routes
router.get('/realtime', exportController.exportRealtime);
router.get('/grafiklive', exportController.exportGrafikLive);

module.exports = router;
