// Ruta: finanzas-app-pro/frontend/src/services/auth.service.js
// ACTUALIZA ESTE ARCHIVO PARA USAR apiClient Y LLAMAR AL BACKEND REAL
import apiClient from './api'; // Tu instancia de Axios configurada

const register = async (name, email, password) => {
  console.log('[AuthService] Attempting to register user:', { name, email });
  // La llamada al backend ya no es simulada
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password,
  });
  // El backend debería devolver { message, user, token } o un error
  console.log('[AuthService] Registration response:', response.data);
  return response.data; // Devolver todos los datos de la respuesta
};

const login = async (email, password) => {
  console.log('[AuthService] Attempting to login user:', { email });
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });
  // Si el login es exitoso, el backend devuelve { message, user, token }
  if (response.data.token && response.data.user) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('authUser', JSON.stringify(response.data.user));
    // Aquí podrías establecer el token en las cabeceras por defecto de apiClient si no lo haces ya con un interceptor
    // apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
  }
  console.log('[AuthService] Login response:', response.data);
  return response.data; // Devuelve el objeto completo { message, user, token }
};

const logout = () => {
  console.log('[AuthService] Logging out user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  // Eliminar el token de las cabeceras por defecto de apiClient si lo estableciste en el login
  // delete apiClient.defaults.headers.common['Authorization'];
  // Aquí podrías también llamar a un endpoint de logout en el backend si lo tuvieras
  // return apiClient.post('/auth/logout');
  return Promise.resolve(); // Simulación de logout exitoso del lado del cliente
};

const getCurrentUser = () => {
  // Intenta obtener el usuario de localStorage
  const userStr = localStorage.getItem('authUser');
  try {
    if (userStr) return JSON.parse(userStr);
  } catch (e) {
    console.error("Error parsing authUser from localStorage", e);
    // Si está corrupto, limpiar
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    return null;
  }
  return null;
  // Para una verificación más robusta, podrías llamar a un endpoint '/auth/me'
  // y actualizar localStorage si el token sigue siendo válido.
  // Esto se haría típicamente en AuthContext.jsx al cargar la app.
};

// (Opcional) Nueva función para verificar el token con el backend
const verifyTokenAndFetchUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return Promise.resolve(null); // No hay token, no hay usuario
    }
    try {
        // Asumimos que apiClient ya tiene el interceptor para añadir el token
        const response = await apiClient.get('/auth/me');
        if (response.data) {
            localStorage.setItem('authUser', JSON.stringify(response.data)); // Actualizar datos del usuario
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('[AuthService] Token verification failed or user not found:', error.response?.data?.message || error.message);
        // Si el token es inválido (ej. expirado), el backend devolverá un 401
        // y el interceptor de Axios podría manejar el logout. O lo manejamos aquí.
        logout(); // Limpiar localStorage si el token no es válido
        return null;
    }
};


const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  verifyTokenAndFetchUser, // Exportar la nueva función
};

export default authService;