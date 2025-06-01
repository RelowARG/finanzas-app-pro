// Ruta: finanzas-app-pro/frontend/src/services/dashboard.service.js
import apiClient from './api'; // [cite: finanzas-app-pro/frontend/src/services/api.js]

const getMonthlySpendingByCategory = async (filters = {}) => {
  console.log('[F-DashboardService] Fetching Dashboard SpendingChart data from backend endpoint: /dashboard/spending-chart. Filters:', filters);
  const params = new URLSearchParams();
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.currency) params.append('currency', filters.currency); 

  try {
    const response = await apiClient.get(`/dashboard/spending-chart?${params.toString()}`);
    console.log('[F-DashboardService] Dashboard SpendingChart data received:', response.data);
    return response.data; 
  } catch (error) {
    console.error("[F-DashboardService] Error fetching dashboard spending chart data:", error.response?.data || error.message);
    return { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: [] }], summary: { totalExpenses: 0, numberOfCategories: 0, currencyReported: 'ARS' } };
  }
};

const getDashboardSummary = async () => {
  console.log('[F-DashboardService] Getting dashboard summary from backend endpoint: /dashboard/summary');
  try {
    const response = await apiClient.get('/dashboard/summary');
    console.log('[F-DashboardService] Dashboard summary received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching dashboard summary:", error.response?.data || error.message);
    return { 
        balances: { ARS: null, USD: null }, 
        totalBalanceARSConverted: null,
        conversionRateUsed: null,
        rateMonthYear: null
    };
  }
};

const getInvestmentHighlights = async (topN = 3) => {
  console.log('[F-DashboardService] Getting investment highlights from backend endpoint: /dashboard/investment-highlights');
  try {
    const response = await apiClient.get(`/dashboard/investment-highlights?topN=${topN}`);
    console.log('[F-DashboardService] Investment highlights received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching investment highlights:", error);
    return { totalValueByCurrency: {}, topInvestments: [], totalNumberOfInvestments: 0 };
  }
};

const getCurrentMonthFinancialStatus = async () => {
  console.log('[F-DashboardService] Getting current month financial status from backend endpoint: /dashboard/monthly-financial-status');
  try {
    const response = await apiClient.get('/dashboard/monthly-financial-status');
    console.log('[F-DashboardService] Current month financial status received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching current month financial status:", error);
    const { monthName, year } = { monthName: new Date().toLocaleString('es-AR', { month: 'long' }), year: new Date().getFullYear() };
    return { 
        statusByCurrency: {}, 
        monthName, 
        year,
        rateUsed: null
    };
  }
};

const getGlobalBudgetStatus = async () => {
  console.log('[F-DashboardService] Getting global budget status from backend endpoint: /dashboard/global-budget-status');
  try {
    const response = await apiClient.get('/dashboard/global-budget-status');
    console.log('[F-DashboardService] Global budget status received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching global budget status:", error.response?.data || error.message);
    return { totalBudgeted: 0, totalSpent: 0, currency: 'ARS', progressPercent: 0 };
  }
};

const getBalanceTrendData = async ({ months = 6 } = {}) => {
  console.log(`[F-DashboardService] Getting balance trend data from backend (months: ${months})`);
  try {
    const response = await apiClient.get(`/dashboard/balance-trend?months=${months}`);
    console.log('[F-DashboardService] Balance trend data received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching balance trend data:", error.response?.data || error.message);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: 'ARS', changeVsPreviousPeriodPercent: 0 } };
  }
};

const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory,
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
  getGlobalBudgetStatus,
  getBalanceTrendData,
};

export default dashboardService;
