// Ruta: finanzas-app-pro/frontend/src/services/transactions.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api';

const getAllTransactions = async (filters = {}) => {
  console.log('[TransactionService] Fetching all transactions from backend with filters:', filters);
  // Construir query params para los filtros
  const params = new URLSearchParams();
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.type) params.append('type', filters.type);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await apiClient.get(`/transactions?${params.toString()}`);
  console.log('[TransactionService] Transactions received:', response.data);
  // El backend ahora devuelve un objeto con { totalPages, currentPage, totalTransactions, transactions }
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
  // El backend espera: { description, amount, currency, date, type, notes, icon, accountId, categoryId }
  // El userId se añade en el backend.
  // El backend también recalcula el 'amount' para que sea negativo si es 'egreso'.
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
  return response.data; // El backend devuelve un mensaje de éxito
};

// Mantener la función simulada para el dashboard si aún no se ha migrado completamente
// o si el dashboard necesita un formato diferente que el backend aún no provee.
// Por ahora, la comentaremos para enfocarnos en el CRUD real.
/*
const getRecentTransactions = async (limit = 5) => {
  console.log('[MockTransactionService] getRecentTransactions, limit:', limit);
  // Esta función debería ser reemplazada por una llamada al backend
  // que obtenga las transacciones recientes, o getAllTransactions con limit y order.
  // Por ahora, para no romper el dashboard si aún usa esto:
  const allTxData = await getAllTransactions({ page: 1, limit, sortBy: 'date', sortOrder: 'DESC' });
  return allTxData.transactions || [];
};
*/

const transactionService = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  // getRecentTransactions, // Comentado por ahora, el dashboard debería usar getAllTransactions con filtros
};

export default transactionService;
