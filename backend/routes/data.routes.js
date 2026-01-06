const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
const { validateQueryParams, handleValidationErrors } = require('../middleware/validation');
const { requireAuth, applyDataFilter } = require('../middleware/auth.middleware');

// Apply validation and authentication to all routes
const validateAndHandle = [requireAuth, applyDataFilter, validateQueryParams, handleValidationErrors];

// Protected routes - require authentication and apply data filtering based on user level
router.get('/branch-locations', validateAndHandle, dataController.getBranchLocations);
router.get('/filters', requireAuth, applyDataFilter, dataController.getFilters);
router.get('/summary', validateAndHandle, dataController.getSummary);
router.get('/summary-wo', validateAndHandle, dataController.getSummaryWO);
router.get('/grafik-productivity', validateAndHandle, dataController.getGrafikProductivity);
router.get('/grafik-tren-portofolio', validateAndHandle, dataController.getGrafikTrenPortofolio);
router.get('/grafik-portofolio', validateAndHandle, dataController.getGrafikPortofolio);
router.get('/grafik-tren-quality', validateAndHandle, dataController.getGrafikTrenQuality);
router.get("/growth-summary", validateAndHandle, dataController.getGrowth);
router.get("/grafik-jam", validateAndHandle, dataController.getGrafikJam);
router.get("/grafik-writeoff", validateAndHandle, dataController.getGrafikWriteOff);

module.exports = router;
