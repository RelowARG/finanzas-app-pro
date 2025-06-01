// Ruta: finanzas-app-pro/frontend/src/components/Route/AdminRoute.jsx
// NUEVO ARCHIVO
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // [cite: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx]

const AdminRoute = () => {
  const { user, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <div className="page-container text-center">Verificando autorización...</div>;
  }

  if (!user) {
    // Si no hay usuario, redirigir a login
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Si el usuario no es admin, redirigir al dashboard (o a una página de "acceso denegado")
    console.warn("Acceso denegado: Se requiere rol de administrador.");
    return <Navigate to="/dashboard" replace />; 
  }

  // Si es admin, renderizar el contenido de la ruta hija
  return <Outlet />;
};

export default AdminRoute;
