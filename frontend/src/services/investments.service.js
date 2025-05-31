// Ruta: finanzas-app-pro/frontend/src/services/investments.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api';

const getAllInvestments = async () => {
  console.log('[InvestmentService] Fetching all investments from backend');
  // El backend ya filtra por el userId del token y ordena
  const response = await apiClient.get('/investments');
  console.log('[InvestmentService] Investments received:', response.data);
  return response.data; // El backend devuelve un array de inversiones
};

const getInvestmentById = async (id) => {
  console.log('[InvestmentService] Fetching investment by ID from backend:', id);
  const response = await apiClient.get(`/investments/${id}`);
  console.log('[InvestmentService] Investment by ID received:', response.data);
  return response.data;
};

const createInvestment = async (investmentData) => {
  console.log('[InvestmentService] Creating new investment via backend:', investmentData);
  // El backend espera los campos definidos en su controlador y modelo.
  // El userId se añade en el backend.
  const response = await apiClient.post('/investments', investmentData);
  console.log('[InvestmentService] Investment creation response:', response.data);
  return response.data; // El backend devuelve la inversión creada
};

const updateInvestment = async (id, investmentData) => {
  console.log('[InvestmentService] Updating investment via backend:', id, investmentData);
  const response = await apiClient.put(`/investments/${id}`, investmentData);
  console.log('[InvestmentService] Investment update response:', response.data);
  return response.data; // El backend devuelve la inversión actualizada
};

const deleteInvestment = async (id) => {
  console.log('[InvestmentService] Deleting investment via backend:', id);
  const response = await apiClient.delete(`/investments/${id}`);
  console.log('[InvestmentService] Investment deletion response:', response.data);
  return response.data; // El backend devuelve un mensaje de éxito
};

const investmentsService = {
  getAllInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
};

export default investmentsService;
