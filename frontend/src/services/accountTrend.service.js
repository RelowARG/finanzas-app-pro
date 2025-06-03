// Ruta: frontend/src/services/accountTrend.service.js
import apiClient from './api'; // Asumiendo que apiClient está configurado correctamente

const getAccountTrendData = async (accountId, { months = 6, currency = 'ARS' } = {}) => {
  console.log(`[F-AccountTrendService] Fetching trend data for account ${accountId} (months: ${months}, currency: ${currency})`);
  const params = new URLSearchParams();
  params.append('months', months);
  params.append('currency', currency);

  try {
    const response = await apiClient.get(`/accounts/${accountId}/trend?${params.toString()}`);
    console.log(`[F-AccountTrendService] Trend data for account ${accountId} received:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[F-AccountTrendService] Error fetching trend data for account ${accountId}:`, error.response?.data || error.message);
    return { labels: [], datasets: [], summary: { currentBalance: 0, currency: currency, changeVsPreviousPeriodPercent: 0 }, conversionNotes: ['Error al cargar la tendencia de la cuenta.'] };
  }
};

const accountTrendService = {
  getAccountTrendData,
};

export default accountTrendService;
