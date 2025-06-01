// Ruta: finanzas-app-pro/frontend/src/components/Route/PermissionRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PermissionRoute = ({ requiredPermission, children }) => {
  const { user, loadingAuth, isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return <div className="page-container text-center">Verificando permisos...</div>;
  }

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado, guardando la ruta original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requiredPermission || hasPermission(requiredPermission)) {
    // Si no se requiere permiso específico, o si el usuario tiene el permiso
    return children ? children : <Outlet />;
  }

  // Si no tiene el permiso, redirigir (ej. al dashboard o a una página de acceso denegado)
  console.warn(`Acceso denegado a la ruta ${location.pathname}. Se requiere el permiso: ${requiredPermission}`);
  // Podrías tener una página específica de "Acceso Denegado" o simplemente redirigir al dashboard
  return <Navigate to="/dashboard" state={{ unauthorizedAttempt: true, requiredPerm: requiredPermission }} replace />;
};

export default PermissionRoute;