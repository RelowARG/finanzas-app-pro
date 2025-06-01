// Ruta: finanzas-app-pro/frontend/src/services/admin.service.js
// NUEVO ARCHIVO
import apiClient from './api'; // [cite: finanzas-app-pro/frontend/src/services/api.js]

const API_ADMIN_URL = '/admin';

const getUsers = async () => {
  try {
    const response = await apiClient.get(`${API_ADMIN_URL}/users`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users (admin):", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudieron obtener los usuarios.");
  }
};

const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`${API_ADMIN_URL}/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo actualizar el rol del usuario.");
  }
};

const deleteUserByAdmin = async (userId) => {
  try {
    const response = await apiClient.delete(`${API_ADMIN_URL}/users/${userId}`);
    return response.data; // Espera un mensaje de éxito
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo eliminar el usuario.");
  }
};

const adminService = {
  getUsers,
  updateUserRole,
  deleteUserByAdmin,
};

export default adminService;
