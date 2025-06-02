// finanzas-app-pro/backend/api/dashboard/dashboard.controller.js
const dashboardService = require('../../services/dashboard.service');

// @desc    Obtener el resumen principal del dashboard (balances)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummaryController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // console.log(`[DashboardController] getDashboardSummaryController called for userId: ${userId}`);
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
    const topN = req.query.topN ? parseInt(req.query.topN, 10) : 3;
    // console.log(`[DashboardController] getInvestmentHighlightsController called for userId: ${userId}, topN: ${topN}`);
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
    const targetCurrency = req.query.currency || 'ARS'; // Permitir especificar moneda
    // console.log(`[DashboardController] getMonthlyFinancialStatusController called for userId: ${userId}`);
    const status = await dashboardService.getCurrentMonthFinancialStatus(userId, targetCurrency);
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
        // console.log(`[DashboardController] getSpendingChartController called for userId: ${userId}`);
        const chartData = await dashboardService.getMonthlySpendingByCategory(userId, req.query);
        res.json(chartData);
    } catch (error) {
        console.error('[DashboardController] Error in getSpendingChartController:', error);
        next(error);
    }
};

// @desc    Obtener estado global de presupuestos (total presupuestado vs gastado)
// @route   GET /api/dashboard/global-budget-status
// @access  Private
const getGlobalBudgetStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetCurrency = req.query.currency || 'ARS';
    // console.log(`[DashboardController] getGlobalBudgetStatusController called for userId: ${userId}`);
    const status = await dashboardService.getGlobalBudgetStatus(userId, targetCurrency);
    res.json(status);
  } catch (error) {
    console.error('[DashboardController] Error in getGlobalBudgetStatusController:', error);
    next(error);
  }
};

// @desc    Obtener tendencia del saldo de los últimos N meses
// @route   GET /api/dashboard/balance-trend
// @access  Private
const getBalanceTrendController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const targetCurrency = req.query.currency || 'ARS';
    // console.log(`[DashboardController] getBalanceTrendController called for userId: ${userId}, months: ${months}`);
    const trendData = await dashboardService.getBalanceTrend(userId, months, targetCurrency);
    res.json(trendData);
  } catch (error) {
    console.error('[DashboardController] Error in getBalanceTrendController:', error);
    next(error);
  }
};

// --- NUEVO CONTROLADOR ---
// @desc    Obtener datos de salud financiera
// @route   GET /api/dashboard/financial-health
// @access  Private
const getFinancialHealthController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetCurrency = req.query.currency || 'ARS'; // Moneda en la que se devolverán los valores
    console.log(`[DashboardController] getFinancialHealthController called for userId: ${userId} in ${targetCurrency}`);
    const healthData = await dashboardService.calculateFinancialHealth(userId, targetCurrency);
    res.json(healthData);
  } catch (error) {
    console.error('[DashboardController] Error in getFinancialHealthController:', error);
    next(error);
  }
};

module.exports = {
  getDashboardSummaryController,
  getInvestmentHighlightsController,
  getMonthlyFinancialStatusController,
  getSpendingChartController,
  getGlobalBudgetStatusController,
  getBalanceTrendController,
  getFinancialHealthController, // Exportar nuevo controlador
};
