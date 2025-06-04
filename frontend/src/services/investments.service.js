// Ruta: finanzas-app-pro/frontend/src/services/investments.service.js
import apiClient from './api';

const getAllInvestments = async () => {
  console.log('[InvestmentService] Fetching all investments from backend');
  const response = await apiClient.get('/investments');
  console.log('[InvestmentService] Investments received:', response.data);
  return response.data; 
};

const getInvestmentById = async (id) => {
  console.log('[InvestmentService] Fetching investment by ID from backend:', id);
  const response = await apiClient.get(`/investments/${id}`);
  console.log('[InvestmentService] Investment by ID received:', response.data);
  return response.data;
};

const createInvestment = async (investmentData) => {
  console.log('[InvestmentService] Creating new investment via backend:', investmentData);
  const response = await apiClient.post('/investments', investmentData);
  console.log('[InvestmentService] Investment creation response:', response.data);
  return response.data; 
};

const updateInvestment = async (id, investmentData) => {
  console.log('[InvestmentService] Updating investment via backend:', id, investmentData);
  const response = await apiClient.put(`/investments/${id}`, investmentData);
  console.log('[InvestmentService] Investment update response:', response.data);
  return response.data; 
};

const deleteInvestment = async (id) => {
  console.log('[InvestmentService] Deleting investment via backend:', id);
  const response = await apiClient.delete(`/investments/${id}`);
  console.log('[InvestmentService] Investment deletion response:', response.data);
  return response.data; 
};

// *** NUEVA FUNCIÓN AÑADIDA ***
const triggerUpdateQuotes = async () => {
  console.log('[InvestmentService] Triggering update for investment quotes from backend');
  // Este endpoint POST actualiza las cotizaciones en el backend
  const response = await apiClient.post('/investments/update-quotes'); 
  console.log('[InvestmentService] Update quotes response:', response.data);
  return response.data; // El backend devuelve un mensaje y el conteo actualizado
};

const investmentsService = {
  getAllInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  triggerUpdateQuotes, // <<< EXPORTAR LA NUEVA FUNCIÓN
};

export default investmentsService;