// Ruta: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx
// ACTUALIZA ESTE ARCHIVO PARA VERIFICAR EL TOKEN AL INICIO
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Para saber si se está verificando la auth inicial

  useEffect(() => {
    const validateUserSession = async () => {
      setLoadingAuth(true);
      const fetchedUser = await authService.verifyTokenAndFetchUser(); // Usar nueva función
      setUser(fetchedUser); // será null si el token no es válido o no existe
      setLoadingAuth(false);
    };

    validateUserSession();
  }, []);

  const login = (userDataFromBackend) => {
    // userDataFromBackend ya debería tener { user, token }
    // auth.service.js ya guardó el token y el usuario en localStorage
    setUser(userDataFromBackend.user); 
  };

  const logout = () => {
    authService.logout(); // Limpia localStorage y podría limpiar cabeceras de apiClient
    setUser(null);
  };

  const value = {
    user,
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!user, // Helper para saber si está autenticado
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
