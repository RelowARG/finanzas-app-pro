// finanzas-app-pro/backend/api/dashboard/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middleware/authMiddleware');

// Aplicar protección a todas las rutas del dashboard
router.use(protect);

router.get('/summary', dashboardController.getDashboardSummaryController);
router.get('/investment-highlights', dashboardController.getInvestmentHighlightsController);
router.get('/monthly-financial-status', dashboardController.getMonthlyFinancialStatusController);
router.get('/spending-chart', dashboardController.getSpendingChartController);
router.get('/global-budget-status', dashboardController.getGlobalBudgetStatusController);
router.get('/balance-trend', dashboardController.getBalanceTrendController);

// --- NUEVA RUTA ---
// @desc    Obtener datos de salud financiera general
// @route   GET /api/dashboard/financial-health
// @access  Private
router.get('/financial-health', dashboardController.getFinancialHealthController);

module.exports = router;
