// Ruta: finanzas-app-pro/frontend/src/services/transactions.service.js
import apiClient from './api';

const getAllTransactions = async (filters = {}) => {
  console.log('[TransactionService] Fetching all transactions from backend with filters:', filters);
  const params = new URLSearchParams();
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.type) params.append('type', filters.type);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  // Añadir parámetros de ordenamiento si están presentes en los filtros
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await apiClient.get(`/transactions?${params.toString()}`);
  console.log('[TransactionService] Transactions received:', response.data);
  return response.data; 
};

const getTransactionById = async (id) => {
  console.log('[TransactionService] Fetching transaction by ID from backend:', id);
  const response = await apiClient.get(`/transactions/${id}`);
  console.log('[TransactionService] Transaction by ID received:', response.data);
  return response.data;
};

const createTransaction = async (transactionData) => {
  console.log('[TransactionService] Creating new transaction via backend:', transactionData);
  const response = await apiClient.post('/transactions', transactionData);
  console.log('[TransactionService] Transaction creation response:', response.data);
  return response.data;
};

const updateTransaction = async (id, transactionData) => {
  console.log('[TransactionService] Updating transaction via backend:', id, transactionData);
  const response = await apiClient.put(`/transactions/${id}`, transactionData);
  console.log('[TransactionService] Transaction update response:', response.data);
  return response.data;
};

const deleteTransaction = async (id) => {
  console.log('[TransactionService] Deleting transaction via backend:', id);
  const response = await apiClient.delete(`/transactions/${id}`);
  console.log('[TransactionService] Transaction deletion response:', response.data);
  return response.data;
};

const transactionService = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

export default transactionService;