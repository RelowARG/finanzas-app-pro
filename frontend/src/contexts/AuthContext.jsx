// Ruta: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service'; //

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isInitialLoadAfterLogin, setIsInitialLoadAfterLogin] = useState(false); // *** NUEVO ESTADO ***

  useEffect(() => {
    const validateUserSession = async () => {
      setLoadingAuth(true);
      const fetchedUser = await authService.verifyTokenAndFetchUser(); //
      if (fetchedUser) {
        setUser(fetchedUser);
        // No marcamos isInitialLoadAfterLogin aquí porque esto es para validar sesión existente
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    };

    validateUserSession();
  }, []);

  const login = (userDataFromBackend) => {
    setUser(userDataFromBackend.user);
    setIsInitialLoadAfterLogin(true); // *** MARCAR COMO CARGA INICIAL DESPUÉS DE LOGIN ***
    // El token ya se guarda en authService.login
  };

  const logout = () => {
    authService.logout(); //
    setUser(null);
    setIsInitialLoadAfterLogin(false); // *** RESETEAR EN LOGOUT ***
  };

  const hasPermission = (permissionName) => {
    return user && user.permissions && user.permissions.includes(permissionName);
  };

  const updateUserInContext = (updatedUserData) => {
    setUser(currentUser => ({
      ...currentUser,
      ...updatedUserData
    }));
  };

  // *** NUEVA FUNCIÓN PARA LIMPIAR EL FLAG ***
  const clearInitialLoadAfterLoginFlag = () => {
    setIsInitialLoadAfterLogin(false);
  };

  const value = {
    user,
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    updateUserInContext,
    isInitialLoadAfterLogin, // *** EXPONER ESTADO ***
    clearInitialLoadAfterLoginFlag, // *** EXPONER FUNCIÓN ***
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};