// Ruta: finanzas-app-pro/frontend/src/services/dashboard.service.js
import apiClient from './api'; // Tu instancia de Axios configurada

// Esta función es para el gráfico de gastos DENTRO DEL DASHBOARD y debe llamar al endpoint del dashboard
const getMonthlySpendingByCategory = async (filters = {}) => {
  console.log('[F-DashboardService] Fetching Dashboard SpendingChart data from backend endpoint: /dashboard/spending-chart. Filters:', filters);
  const params = new URLSearchParams();
  // Para el dashboard, el backend usualmente determinará el mes actual, 
  // pero permitimos filtros si son necesarios para otras implementaciones.
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  // La moneda para el gráfico del dashboard usualmente es ARS (manejado por el backend si no se envía)
  if (filters.currency) params.append('currency', filters.currency); 

  try {
    // Usamos el nuevo endpoint del dashboard para el gráfico de gastos
    const response = await apiClient.get(`/dashboard/spending-chart?${params.toString()}`);
    console.log('[F-DashboardService] Dashboard SpendingChart data received:', response.data);
    return response.data; 
  } catch (error) {
    console.error("[F-DashboardService] Error fetching dashboard spending chart data:", error.response?.data || error.message);
    // Devolver estructura por defecto para que el gráfico no rompa
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

const dashboardService = {
  getDashboardSummary,
  getMonthlySpendingByCategory, // Esta es la clave para el gráfico del dashboard
  getInvestmentHighlights,
  getCurrentMonthFinancialStatus,
};

export default dashboardService;
