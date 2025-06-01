// Ruta: finanzas-app-pro/frontend/src/services/accounts.service.js
import apiClient from './api'; // [cite: finanzas-app-pro/frontend/src/services/api.js]

const getAllAccounts = async () => {
  console.log('[AccountService] Fetching all accounts from backend');
  const response = await apiClient.get('/accounts');
  console.log('[AccountService] Accounts received:', response.data);
  return response.data; 
};

const getAccountById = async (id) => {
  console.log('[AccountService] Fetching account by ID from backend:', id);
  const response = await apiClient.get(`/accounts/${id}`);
  console.log('[AccountService] Account by ID received:', response.data);
  return response.data; 
};

const createAccount = async (accountData) => {
  console.log('[AccountService] Creating new account via backend:', accountData);
  // Campos esperados por el backend:
  // name, type, balance, currency, icon, 
  // bankName, accountNumberLast4, creditLimit,
  // includeInDashboardSummary,
  // statementBalance, statementCloseDate, statementDueDate (si es tarjeta_credito)
  const response = await apiClient.post('/accounts', accountData);
  console.log('[AccountService] Account creation response:', response.data);
  return response.data;
};

const updateAccount = async (id, accountData) => {
  console.log('[AccountService] Updating account via backend:', id, accountData);
  // Campos esperados por el backend:
  // name, balance, currency, icon, 
  // bankName, accountNumberLast4, creditLimit,
  // includeInDashboardSummary,
  // statementBalance, statementCloseDate, statementDueDate (si es tarjeta_credito)
  // El tipo de cuenta no se suele editar.
  const response = await apiClient.put(`/accounts/${id}`, accountData);
  console.log('[AccountService] Account update response:', response.data);
  return response.data; 
};

const deleteAccount = async (id) => {
  console.log('[AccountService] Deleting account via backend:', id);
  const response = await apiClient.delete(`/accounts/${id}`);
  console.log('[AccountService] Account deletion response:', response.data);
  return response.data; 
};

// Nueva función para pagar el resumen de la tarjeta de crédito
const payCreditCardStatement = async (cardAccountId, paymentData) => {
  // paymentData: { payingAccountId, paymentAmount, paymentDate, notes (opcional) }
  console.log(`[AccountService] Paying credit card statement for card ID ${cardAccountId} via backend:`, paymentData);
  const response = await apiClient.post(`/accounts/${cardAccountId}/pay`, paymentData);
  console.log('[AccountService] Pay credit card statement response:', response.data);
  return response.data; // El backend devuelve { message, payingAccount, creditCardAccount }
};


const accountService = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  payCreditCardStatement, // Añadir nueva función
};

export default accountService;