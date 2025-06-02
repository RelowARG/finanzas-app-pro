// finanzas-app-pro/backend/api/dashboard/dashboard.controller.js
const dashboardService = require('../../services/dashboard.service');

// ... (getDashboardSummaryController, getInvestmentHighlightsController, etc. existentes) ...
const getDashboardSummaryController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await dashboardService.getDashboardSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardSummaryController:', error);
    next(error);
  }
};

const getInvestmentHighlightsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const topN = req.query.topN ? parseInt(req.query.topN, 10) : 3;
    const highlights = await dashboardService.getInvestmentHighlights(userId, topN);
    res.json(highlights);
  } catch (error) {
    console.error('[DashboardController] Error in getInvestmentHighlightsController:', error);
    next(error);
  }
};

const getMonthlyFinancialStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetCurrency = req.query.currency || 'ARS'; 
    const status = await dashboardService.getCurrentMonthFinancialStatus(userId, targetCurrency);
    res.json(status);
  } catch (error) {
    console.error('[DashboardController] Error in getMonthlyFinancialStatusController:', error);
    next(error);
  }
};

const getSpendingChartController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const chartData = await dashboardService.getMonthlySpendingByCategory(userId, req.query);
        res.json(chartData);
    } catch (error) {
        console.error('[DashboardController] Error in getSpendingChartController:', error);
        next(error);
    }
};

const getGlobalBudgetStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetCurrency = req.query.currency || 'ARS';
    const status = await dashboardService.getGlobalBudgetStatus(userId, targetCurrency);
    res.json(status);
  } catch (error) {
    console.error('[DashboardController] Error in getGlobalBudgetStatusController:', error);
    next(error);
  }
};

const getBalanceTrendController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const targetCurrency = req.query.currency || 'ARS';
    const trendData = await dashboardService.getBalanceTrend(userId, months, targetCurrency);
    res.json(trendData);
  } catch (error) {
    console.error('[DashboardController] Error in getBalanceTrendController:', error);
    next(error);
  }
};

const getFinancialHealthController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetCurrency = req.query.currency || 'ARS';
    console.log(`[DashboardController] getFinancialHealthController called for userId: ${userId} in ${targetCurrency}`);
    const healthData = await dashboardService.calculateFinancialHealth(userId, targetCurrency);
    res.json(healthData);
  } catch (error) {
    console.error('[DashboardController] Error in getFinancialHealthController:', error);
    next(error);
  }
};

// --- NUEVO CONTROLADOR ---
const getUpcomingEventsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const daysInFuture = req.query.days ? parseInt(req.query.days, 10) : 15;
    const events = await dashboardService.getUpcomingEvents(userId, daysInFuture);
    res.json(events);
  } catch (error) {
    console.error('[DashboardController] Error in getUpcomingEventsController:', error);
    next(error);
  }
};

// NUEVO CONTROLADOR para obtener transacciones recientes
const getRecentTransactionsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5; // Default a 5
    const transactions = await dashboardService.getRecentTransactions(userId, limit);
    res.json(transactions);
  } catch (error) {
    console.error('[DashboardController] Error in getRecentTransactionsController:', error);
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
  getFinancialHealthController,
  getUpcomingEventsController,
  getRecentTransactionsController, // <--- AÑADIR ESTA LÍNEA
};