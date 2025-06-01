// Ruta: finanzas-app-pro/frontend/src/services/auth.service.js
import apiClient from './api';

const register = async (name, email, password) => {
  console.log('[AuthService] Attempting to register user:', { name, email });
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password,
  });
  console.log('[AuthService] Registration response:', response.data);
  return response.data;
};

const login = async (email, password) => {
  console.log('[AuthService] Attempting to login user:', { email });
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });
  if (response.data.token && response.data.user) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('authUser', JSON.stringify(response.data.user));
  }
  console.log('[AuthService] Login response:', response.data);
  return response.data; 
};

const logout = () => {
  console.log('[AuthService] Logging out user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  return Promise.resolve(); 
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('authUser');
  try {
    if (userStr) return JSON.parse(userStr);
  } catch (e) {
    console.error("Error parsing authUser from localStorage", e);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    return null;
  }
  return null;
};

const verifyTokenAndFetchUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return Promise.resolve(null);
    }
    try {
        const response = await apiClient.get('/auth/me');
        if (response.data) {
            localStorage.setItem('authUser', JSON.stringify(response.data)); 
            return response.data; // Esto ya incluye dashboardConfig y permissions
        }
        return null;
    } catch (error) {
        console.error('[AuthService] Token verification failed or user not found:', error.response?.data?.message || error.message);
        logout(); 
        return null;
    }
};

// *** NUEVA FUNCIÓN ***
const updateUserDashboardConfig = async (dashboardConfig) => {
  console.log('[AuthService] Updating user dashboard config:', dashboardConfig);
  try {
    const response = await apiClient.put('/auth/dashboard-config', { dashboardConfig });
    // El backend devuelve { message, dashboardConfig }
    // Actualizar el usuario en localStorage con la nueva config
    const currentUser = getCurrentUser();
    if (currentUser && response.data.dashboardConfig) {
        const updatedUser = { ...currentUser, dashboardConfig: response.data.dashboardConfig };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
    return response.data;
  } catch (error) {
    console.error("Error updating dashboard config:", error.response?.data || error.message);
    throw error.response?.data || new Error("No se pudo actualizar la configuración del dashboard.");
  }
};


const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  verifyTokenAndFetchUser,
  updateUserDashboardConfig // *** EXPORTAR NUEVA FUNCIÓN ***
};

export default authService;