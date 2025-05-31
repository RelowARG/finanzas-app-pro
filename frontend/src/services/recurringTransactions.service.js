// Ruta: finanzas-app-pro/frontend/src/services/recurringTransactions.service.js
// ARCHIVO NUEVO
import apiClient from './api';

const getRecurringTransactions = async () => {
  console.log('[RecurringTxService] Fetching all recurring transactions from backend');
  const response = await apiClient.get('/recurring-transactions');
  console.log('[RecurringTxService] Recurring transactions received:', response.data);
  return response.data; // Array de definiciones de transacciones recurrentes
};

const getRecurringTransactionById = async (id) => {
  console.log('[RecurringTxService] Fetching recurring transaction by ID:', id);
  const response = await apiClient.get(`/recurring-transactions/${id}`);
  console.log('[RecurringTxService] Recurring transaction by ID received:', response.data);
  return response.data;
};

const createRecurringTransaction = async (recurringTxData) => {
  console.log('[RecurringTxService] Creating new recurring transaction:', recurringTxData);
  const response = await apiClient.post('/recurring-transactions', recurringTxData);
  console.log('[RecurringTxService] Recurring transaction creation response:', response.data);
  return response.data;
};

const updateRecurringTransaction = async (id, recurringTxData) => {
  console.log('[RecurringTxService] Updating recurring transaction:', id, recurringTxData);
  const response = await apiClient.put(`/recurring-transactions/${id}`, recurringTxData);
  console.log('[RecurringTxService] Recurring transaction update response:', response.data);
  return response.data;
};

const deleteRecurringTransaction = async (id) => {
  console.log('[RecurringTxService] Deleting recurring transaction:', id);
  const response = await apiClient.delete(`/recurring-transactions/${id}`);
  console.log('[RecurringTxService] Recurring transaction deletion response:', response.data);
  return response.data;
};

const recurringTransactionsService = {
  getRecurringTransactions,
  getRecurringTransactionById,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};

export default recurringTransactionsService;
