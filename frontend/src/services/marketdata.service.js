// Ruta: finanzas-app-pro/frontend/src/services/marketdata.service.js
// ARCHIVO NUEVO
import apiClient from './api';

const searchSymbols = async (keywords) => {
  if (!keywords || keywords.trim().length < 2) { // Evitar búsquedas vacías o muy cortas
    return Promise.resolve([]); // Devolver array vacío
  }
  console.log('[MarketDataService] Searching symbols with keywords:', keywords);
  try {
    const response = await apiClient.get(`/marketdata/search-symbol?keywords=${encodeURIComponent(keywords)}`);
    console.log('[MarketDataService] Symbol search results:', response.data);
    return response.data; // El backend devuelve un array de { symbol, name, type, region, currency }
  } catch (error) {
    console.error("Error searching symbols:", error.response?.data || error.message);
    // No relanzar el error para que el componente pueda manejar un array vacío o un mensaje
    return []; // Devolver array vacío en caso de error para no romper la UI
  }
};

const marketDataService = {
  searchSymbols,
};

export default marketDataService;
