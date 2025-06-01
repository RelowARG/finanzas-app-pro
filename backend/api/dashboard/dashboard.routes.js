// finanzas-app-pro/backend/api/dashboard/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller'); // [cite: finanzas-app-pro/backend/api/dashboard/dashboard.controller.js]
const { protect } = require('../../middleware/authMiddleware'); // [cite: finanzas-app-pro/backend/middleware/authMiddleware.js]

// Aplicar protección a todas las rutas del dashboard
router.use(protect);

router.get('/summary', dashboardController.getDashboardSummaryController);
router.get('/investment-highlights', dashboardController.getInvestmentHighlightsController);
router.get('/monthly-financial-status', dashboardController.getMonthlyFinancialStatusController);
router.get('/spending-chart', dashboardController.getSpendingChartController);
router.get('/global-budget-status', dashboardController.getGlobalBudgetStatusController);
router.get('/balance-trend', dashboardController.getBalanceTrendController);

module.exports = router;
