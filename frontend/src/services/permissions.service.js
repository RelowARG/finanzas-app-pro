// Ruta: finanzas-app-pro/frontend/src/services/permissions.service.js
import apiClient from './api';

const API_BASE_URL = '/admin/config/permissions'; // Coincide con cómo lo montamos en api/index.js

const getAllAvailablePermissions = async () => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/`);
    return response.data; // Array de objetos de permiso { id, name, description }
  } catch (error) {
    console.error("Error fetching all available permissions:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudieron obtener los permisos disponibles.");
  }
};

const getPermissionsForRole = async (roleName) => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/role/${roleName}`);
    return response.data; // Array de objetos de permiso asignados al rol
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleName}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`No se pudieron obtener los permisos para el rol ${roleName}.`);
  }
};

const updatePermissionsForRole = async (roleName, permissionIds) => {
  // permissionIds debe ser un array de números (IDs de los permisos)
  try {
    const response = await apiClient.put(`${API_BASE_URL}/role/${roleName}`, { permissionIds });
    return response.data; // Mensaje de éxito y permisos actualizados
  } catch (error) {
    console.error(`Error updating permissions for role ${roleName}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`No se pudieron actualizar los permisos para el rol ${roleName}.`);
  }
};

const permissionsService = {
  getAllAvailablePermissions,
  getPermissionsForRole,
  updatePermissionsForRole,
};

export default permissionsService;