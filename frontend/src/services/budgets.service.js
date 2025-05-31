// Ruta: finanzas-app-pro/frontend/src/services/budgets.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api';

const getAllBudgetsWithSpent = async (filters = {}) => {
  console.log('[BudgetService] Fetching all budgets from backend with filters:', filters);
  // El backend ya calcula 'spent', 'remaining', 'progress' y filtra por userId
  // Podríamos pasar filtros de período si el backend los soporta en este endpoint
  const params = new URLSearchParams();
  if (filters.periodFilter) params.append('periodFilter', filters.periodFilter);
  if (filters.month) params.append('month', filters.month);
  if (filters.year) params.append('year', filters.year);

  const response = await apiClient.get(`/budgets?${params.toString()}`);
  console.log('[BudgetService] Budgets received:', response.data);
  return response.data; // El backend devuelve un array de presupuestos con datos calculados
};

const getBudgetById = async (id) => {
  console.log('[BudgetService] Fetching budget by ID from backend:', id);
  const response = await apiClient.get(`/budgets/${id}`);
  console.log('[BudgetService] Budget by ID received:', response.data);
  // El backend devuelve el presupuesto con 'spent', 'remaining', 'progress' calculados
  return response.data;
};

const createBudget = async (budgetData) => {
  console.log('[BudgetService] Creating new budget via backend:', budgetData);
  // El backend espera: { categoryId, amount, currency, period, startDate, endDate, icon, categoryNameSnapshot (opcional) }
  // El userId se añade en el backend.
  const response = await apiClient.post('/budgets', budgetData);
  console.log('[BudgetService] Budget creation response:', response.data);
  return response.data; // El backend devuelve el presupuesto creado
};

const updateBudget = async (id, budgetData) => {
  console.log('[BudgetService] Updating budget via backend:', id, budgetData);
  const response = await apiClient.put(`/budgets/${id}`, budgetData);
  console.log('[BudgetService] Budget update response:', response.data);
  // El backend devuelve el presupuesto actualizado con 'spent', 'remaining', 'progress' recalculados
  return response.data;
};

const deleteBudget = async (id) => {
  console.log('[BudgetService] Deleting budget via backend:', id);
  const response = await apiClient.delete(`/budgets/${id}`);
  console.log('[BudgetService] Budget deletion response:', response.data);
  return response.data; // El backend devuelve un mensaje de éxito
};

const budgetsService = {
  getAllBudgetsWithSpent,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};

export default budgetsService;