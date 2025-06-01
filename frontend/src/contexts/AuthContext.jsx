// Ruta: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [permissions, setPermissions] = useState([]); // *** NUEVO: Estado para permisos ***

  useEffect(() => {
    const validateUserSession = async () => {
      setLoadingAuth(true);
      const fetchedUser = await authService.verifyTokenAndFetchUser();
      if (fetchedUser) {
        setUser(fetchedUser);
        setPermissions(fetchedUser.permissions || []); // *** NUEVO: Guardar permisos ***
      } else {
        setUser(null);
        setPermissions([]); // Limpiar permisos si no hay usuario
      }
      setLoadingAuth(false);
    };

    validateUserSession();
  }, []);

  const login = (userDataFromBackend) => {
    setUser(userDataFromBackend.user);
    setPermissions(userDataFromBackend.user?.permissions || []); // *** NUEVO: Guardar permisos al loguear ***
    // El token ya se guarda en localStorage dentro de authService.login
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPermissions([]); // *** NUEVO: Limpiar permisos al desloguear ***
  };

  // *** NUEVO: Función para verificar permisos ***
  const hasPermission = (permissionName) => {
    return permissions.includes(permissionName);
  };

  const value = {
    user,
    loadingAuth,
    login,
    logout,
    isAuthenticated: !!user,
    permissions,      // *** NUEVO: Exponer permisos (opcional) ***
    hasPermission,    // *** NUEVO: Exponer función de verificación ***
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};