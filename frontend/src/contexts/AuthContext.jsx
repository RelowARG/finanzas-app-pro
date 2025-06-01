// Ruta: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service'; //

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const validateUserSession = async () => {
      setLoadingAuth(true);
      const fetchedUser = await authService.verifyTokenAndFetchUser(); //
      // fetchedUser ya debería incluir 'role' y 'lastLoginAt' si el backend los devuelve en /me
      setUser(fetchedUser); 
      setLoadingAuth(false);
    };

    validateUserSession();
  }, []);

  const login = (userDataFromBackend) => {
    // userDataFromBackend viene de authService.login, que a su vez viene del backend
    // y ahora debería incluir { id, name, email, role, lastLoginAt, createdAt, updatedAt }
    setUser(userDataFromBackend.user); 
  };

  const logout = () => {
    authService.logout(); 
    setUser(null);
  };

  const value = {
    user, // Este objeto user ahora debería tener lastLoginAt si el backend lo envía
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
