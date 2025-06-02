// finanzas-app-pro/backend/api/dashboard/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/summary', dashboardController.getDashboardSummaryController);
router.get('/investment-highlights', dashboardController.getInvestmentHighlightsController);
router.get('/monthly-financial-status', dashboardController.getMonthlyFinancialStatusController);
router.get('/spending-chart', dashboardController.getSpendingChartController);
router.get('/global-budget-status', dashboardController.getGlobalBudgetStatusController);
router.get('/balance-trend', dashboardController.getBalanceTrendController);
router.get('/financial-health', dashboardController.getFinancialHealthController);

// --- NUEVA RUTA ---
router.get('/upcoming-events', dashboardController.getUpcomingEventsController);

module.exports = router;