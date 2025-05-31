// finanzas-app-pro/backend/api/dashboard/dashboard.controller.js
const dashboardService = require('../../services/dashboard.service'); // El servicio del backend que tiene los logs

// @desc    Obtener el resumen principal del dashboard (balances)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummaryController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`[DashboardController] getDashboardSummaryController called for userId: ${userId}`);
    const summary = await dashboardService.getDashboardSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardSummaryController:', error);
    next(error);
  }
};

// @desc    Obtener destaques de inversiones para el dashboard
// @route   GET /api/dashboard/investment-highlights
// @access  Private
const getInvestmentHighlightsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const topN = req.query.topN ? parseInt(req.query.topN, 10) : 3; // Tomar topN de query o default
    console.log(`[DashboardController] getInvestmentHighlightsController called for userId: ${userId}, topN: ${topN}`);
    const highlights = await dashboardService.getInvestmentHighlights(userId, topN);
    res.json(highlights);
  } catch (error) {
    console.error('[DashboardController] Error in getInvestmentHighlightsController:', error);
    next(error);
  }
};

// @desc    Obtener el estado financiero del mes actual para el dashboard
// @route   GET /api/dashboard/monthly-financial-status
// @access  Private
const getMonthlyFinancialStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`[DashboardController] getMonthlyFinancialStatusController called for userId: ${userId}`);
    const status = await dashboardService.getCurrentMonthFinancialStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('[DashboardController] Error in getMonthlyFinancialStatusController:', error);
    next(error);
  }
};

// @desc    Obtener datos para el gráfico de gastos por categoría del mes actual
// @route   GET /api/dashboard/spending-chart
// @access  Private
const getSpendingChartController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // dashboardService.getMonthlySpendingByCategory ya fue modificado para ser llamado conceptualmente
        // por el reportsService, que a su vez es un endpoint.
        // Aquí, getMonthlySpendingByCategory es una función interna del dashboardService del backend.
        console.log(`[DashboardController] getSpendingChartController called for userId: ${userId}`);
        const chartData = await dashboardService.getMonthlySpendingByCategory(userId, req.query); // req.query por si se añaden filtros
        res.json(chartData);
    } catch (error) {
        console.error('[DashboardController] Error in getSpendingChartController:', error);
        next(error);
    }
};


module.exports = {
  getDashboardSummaryController,
  getInvestmentHighlightsController,
  getMonthlyFinancialStatusController,
  getSpendingChartController,
};