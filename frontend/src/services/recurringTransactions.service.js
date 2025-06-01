// Ruta: finanzas-app-pro/frontend/src/services/recurringTransactions.service.js
import apiClient from './api';

const API_BASE_URL = '/recurring-transactions';

const getAllRecurring = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  if (filters.type) params.append('type', filters.type);
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.frequency) params.append('frequency', filters.frequency);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  const response = await apiClient.get(`${API_BASE_URL}?${params.toString()}`);
  return response.data;
};

const getById = async (id) => {
  const response = await apiClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

const create = async (data) => {
  const response = await apiClient.post(API_BASE_URL, data);
  return response.data;
};

const update = async (id, data) => {
  const response = await apiClient.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

const remove = async (id) => {
  const response = await apiClient.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};

// *** NUEVA FUNCIÓN ***
const processManually = async (id, date = null) => {
  // date es opcional, si se quiere forzar una fecha específica para el procesamiento.
  // Si es null, el backend usará la nextRunDate o la fecha actual.
  const payload = date ? { date } : {};
  const response = await apiClient.post(`${API_BASE_URL}/${id}/process`, payload);
  return response.data; 
};

const recurringTransactionsService = {
  getAllRecurring,
  getById,
  create,
  update,
  remove,
  processManually // *** EXPORTAR NUEVA FUNCIÓN ***
};

export default recurringTransactionsService;