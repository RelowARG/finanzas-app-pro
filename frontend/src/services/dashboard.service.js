// Ruta: finanzas-app-pro/frontend/src/services/dashboard.service.js
import apiClient from './api';

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
    const response = await apiClient.get('/dashboard/monthly-financial-status'); // El backend ahora puede tomar targetCurrency
    console.log('[F-DashboardService] Current month financial status received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching current month financial status:", error);
    const { monthName, year } = { monthName: new Date().toLocaleString('es-AR', { month: 'long' }), year: new Date().getFullYear() };
    return { 
        statusByCurrency: {}, 
        monthName, 
        year,
        rateUsed: null,
        conversionNotes: ['Error al cargar datos.']
    };
  }
};

const getGlobalBudgetStatus = async () => {
  console.log('[F-DashboardService] Getting global budget status from backend endpoint: /dashboard/global-budget-status');
  try {
    const response = await apiClient.get('/dashboard/global-budget-status'); // El backend ahora puede tomar targetCurrency
    console.log('[F-DashboardService] Global budget status received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching global budget status:", error.response?.data || error.message);
    return { totalBudgeted: 0, totalSpent: 0, currency: 'ARS', progressPercent: 0, conversionNotes: ['Error al calcular.'] };
  }
};

const getBalanceTrendData = async ({ months = 6 } = {}) => {
  console.log(`[F-DashboardService] Getting balance trend data from backend (months: ${months})`);
  try {
    const response = await apiClient.get(`/dashboard/balance-trend?months=${months}`); // El backend ahora puede tomar targetCurrency
    console.log('[F-DashboardService] Balance trend data received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching balance trend data:", error.response?.data || error.message);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: 'ARS', changeVsPreviousPeriodPercent: 0 }, conversionNotes: ['Error al calcular.'] };
  }
};

// LLAMADA REAL AL BACKEND
const getSaludFinancieraData = async () => {
  console.log('[F-DashboardService] Getting Salud Financiera data from backend endpoint: /dashboard/financial-health');
  try {
    // Podrías pasar targetCurrency como parámetro si quisieras que el usuario elija
    // const response = await apiClient.get('/dashboard/financial-health?currency=USD');
    const response = await apiClient.get('/dashboard/financial-health');
    console.log('[F-DashboardService] Salud Financiera data received:', response.data);
    return response.data;
  } catch (error) {
    console.error("[F-DashboardService] Error fetching Salud Financiera data:", error.response?.data || error.message);
    return {
      overallScore: 0,
      savingsRate: { value: 0, status: 'low', recommendation: 'No se pudo calcular.' },
      emergencyFund: { value: 0, status: 'low', recommendation: 'No se pudo calcular.' },
      debtToIncomeRatio: { value: 0, status: 'low', recommendation: 'No se pudo calcular.' },
      debtCoverage: { value: 0, status: 'low', recommendation: 'No se pudo calcular.' },
      error: 'No se pudieron cargar los datos de salud financiera.',
      conversionNotes: ['Error al cargar datos.']
    };
  }
};


const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory,
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
  getGlobalBudgetStatus,
  getBalanceTrendData,
  getSaludFinancieraData,
};

export default dashboardService;
