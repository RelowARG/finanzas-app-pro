// finanzas-app-pro/frontend/src/services/exchangeRates.service.js
import apiClient from './api';

const API_ENDPOINT = '/exchange-rates';

const setRate = async ({ year, month, rate, fromCurrency = 'USD', toCurrency = 'ARS' }) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, { year, month, rate, fromCurrency, toCurrency });
    return response.data;
  } catch (error) {
    console.error("Error setting exchange rate:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo guardar la tasa de cambio.");
  }
};

const getRate = async ({ year, month, fromCurrency = 'USD', toCurrency = 'ARS' }) => {
  try {
    const params = new URLSearchParams({ year, month, from: fromCurrency, to: toCurrency });
    const response = await apiClient.get(`${API_ENDPOINT}?${params.toString()}`);
    return response.data; // Puede ser null si no existe
  } catch (error) {
    console.error("Error getting exchange rate:", error.response?.data || error.message);
    // It's not necessarily an error if a rate isn't found for a specific month,
    // the backend returns null in that case, which is handled by the caller.
    // Only throw if it's a server error or unexpected issue.
    if (error.response && error.response.status === 404) {
      return null; // Consistent with backend potentially returning null
    }
    throw error.response?.data || new Error("No se pudo obtener la tasa de cambio.");
  }
};

const getRateHistory = async ({ year, fromCurrency = 'USD', toCurrency = 'ARS' } = {}) => {
  // Default to empty object if no params are passed
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    params.append('from', fromCurrency); // Always send defaults if not provided
    params.append('to', toCurrency);

    const response = await apiClient.get(`${API_ENDPOINT}/history?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error getting exchange rate history:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo obtener el historial de tasas de cambio.");
  }
};

const exchangeRatesService = {
  setRate,
  getRate,
  getRateHistory,
};

export default exchangeRatesService;
