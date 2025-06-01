// Ruta: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user ahora contendrá dashboardConfig y permissions
  const [loadingAuth, setLoadingAuth] = useState(true);
  // Los permisos ya se manejan aquí si getMe y login devuelven user.permissions

  useEffect(() => {
    const validateUserSession = async () => {
      setLoadingAuth(true);
      const fetchedUser = await authService.verifyTokenAndFetchUser();
      if (fetchedUser) {
        setUser(fetchedUser); // fetchedUser ya incluye permissions y dashboardConfig desde el backend
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    };

    validateUserSession();
  }, []);

  const login = (userDataFromBackend) => { // userDataFromBackend es { message, user, token }
    setUser(userDataFromBackend.user); // user aquí ya tiene permissions y dashboardConfig
    // El token ya se guarda en authService.login
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasPermission = (permissionName) => {
    return user && user.permissions && user.permissions.includes(permissionName);
  };

  // *** NUEVA FUNCIÓN PARA ACTUALIZAR EL USER EN EL CONTEXTO DESPUÉS DE GUARDAR CONFIG ***
  const updateUserInContext = (updatedUserData) => {
    setUser(currentUser => ({
      ...currentUser,
      ...updatedUserData // Esto fusionará los campos actualizados, como dashboardConfig
    }));
  };


  const value = {
    user,
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    updateUserInContext, // *** EXPORTAR NUEVA FUNCIÓN ***
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};