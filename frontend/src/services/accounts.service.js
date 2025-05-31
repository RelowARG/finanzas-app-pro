// Ruta: finanzas-app-pro/frontend/src/services/accounts.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api'; // Tu instancia de Axios configurada

const getAllAccounts = async () => {
  console.log('[AccountService] Fetching all accounts from backend');
  // El backend ya filtra por el userId del token
  const response = await apiClient.get('/accounts');
  console.log('[AccountService] Accounts received:', response.data);
  return response.data; // El backend devuelve un array de cuentas
};

const getAccountById = async (id) => {
  console.log('[AccountService] Fetching account by ID from backend:', id);
  const response = await apiClient.get(`/accounts/${id}`);
  console.log('[AccountService] Account by ID received:', response.data);
  return response.data; // El backend devuelve el objeto de la cuenta
};

const createAccount = async (accountData) => {
  console.log('[AccountService] Creating new account via backend:', accountData);
  // El backend espera: { name, type, balance, currency, icon, bankName, accountNumberLast4, creditLimit }
  // El userId se añade en el backend a partir del token.
  const response = await apiClient.post('/accounts', accountData);
  console.log('[AccountService] Account creation response:', response.data);
  return response.data; // El backend devuelve la cuenta creada
};

const updateAccount = async (id, accountData) => {
  console.log('[AccountService] Updating account via backend:', id, accountData);
  const response = await apiClient.put(`/accounts/${id}`, accountData);
  console.log('[AccountService] Account update response:', response.data);
  return response.data; // El backend devuelve la cuenta actualizada
};

const deleteAccount = async (id) => {
  console.log('[AccountService] Deleting account via backend:', id);
  const response = await apiClient.delete(`/accounts/${id}`);
  console.log('[AccountService] Account deletion response:', response.data);
  return response.data; // El backend devuelve un mensaje de éxito
};

const accountService = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
};

export default accountService;
