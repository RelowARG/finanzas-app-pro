// Ruta: finanzas-app-pro/frontend/src/services/debtAndLoan.service.js
// NUEVO ARCHIVO
import apiClient from './api';

const API_ENDPOINT = '/debts-loans';

const getAllDebtsAndLoans = async (filters = {}) => {
  console.log('[DebtLoanService] Fetching all debts and loans with filters:', filters);
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type); // 'debt' o 'loan'
  if (filters.status) params.append('status', filters.status); // 'pending', 'in_progress', 'completed'
  if (filters.person) params.append('person', filters.person); 

  try {
    const response = await apiClient.get(`${API_ENDPOINT}?${params.toString()}`);
    console.log('[DebtLoanService] Debts and loans received:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching debts and loans:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudieron cargar las deudas y préstamos.");
  }
};

const getDebtAndLoanById = async (id) => {
  console.log('[DebtLoanService] Fetching debt/loan by ID:', id);
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${id}`);
    console.log('[DebtLoanService] Debt/loan by ID received:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching debt/loan with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo obtener el detalle de la deuda/préstamo.");
  }
};

const createDebtAndLoan = async (data) => {
  console.log('[DebtLoanService] Creating new debt/loan:', data);
  try {
    const response = await apiClient.post(API_ENDPOINT, data);
    console.log('[DebtLoanService] Debt/loan creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating debt/loan:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo crear la deuda/préstamo.");
  }
};

const updateDebtAndLoan = async (id, data) => {
  console.log('[DebtLoanService] Updating debt/loan:', id, data);
  try {
    const response = await apiClient.put(`${API_ENDPOINT}/${id}`, data);
    console.log('[DebtLoanService] Debt/loan update response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating debt/loan with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo actualizar la deuda/préstamo.");
  }
};

const deleteDebtAndLoan = async (id) => {
  console.log('[DebtLoanService] Deleting debt/loan:', id);
  try {
    const response = await apiClient.delete(`${API_ENDPOINT}/${id}`);
    console.log('[DebtLoanService] Debt/loan deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting debt/loan with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo eliminar la deuda/préstamo.");
  }
};

const recordPayment = async (id, paymentData) => {
  // paymentData: { paymentAmount, paymentDate, paymentNotes, relatedTransactionId (opcional) }
  console.log(`[DebtLoanService] Recording payment for debt/loan ID ${id}:`, paymentData);
  try {
    const response = await apiClient.post(`${API_ENDPOINT}/${id}/record-payment`, paymentData);
    console.log('[DebtLoanService] Record payment response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error recording payment for debt/loan ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo registrar el pago.");
  }
};


const debtAndLoanService = {
  getAllDebtsAndLoans,
  getDebtAndLoanById,
  createDebtAndLoan,
  updateDebtAndLoan,
  deleteDebtAndLoan,
  recordPayment,
};

export default debtAndLoanService;
