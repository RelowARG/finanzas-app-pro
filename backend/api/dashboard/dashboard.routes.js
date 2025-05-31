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
router.get('/spending-chart', dashboardController.getSpendingChartController); // Para el gráfico de gastos del dashboard

module.exports = router;
