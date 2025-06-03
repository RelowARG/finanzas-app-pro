// Ruta: frontend/src/pages/AdminPanelPage.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminUsersPage from './AdminUsersPage'; // Importar el componente existente
import AdminPermissionsPage from './AdminPermissionsPage'; // Importar el componente existente
import { useAuth } from '../contexts/AuthContext'; // Para verificar permisos
import './AdminPanelPage.css'; // Nuevo archivo CSS para esta página

const AdminPanelPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth(); // Obtener la función hasPermission

  // Determinar la pestaña activa basándose en la URL
  const [activeTab, setActiveTab] = useState('users'); // Por defecto, mostrar usuarios

  useEffect(() => {
    if (location.pathname.includes('/admin/users')) {
      setActiveTab('users');
    } else if (location.pathname.includes('/admin/config/permissions')) {
      setActiveTab('permissions');
    } else {
      // Si la URL es solo /admin, redirigir a /admin/users por defecto
      navigate('/admin/users', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Permisos para las pestañas
  const canViewUsers = hasPermission('admin_view_all_users');
  const canManagePermissions = hasPermission('admin_manage_permissions_config');

  if (!canViewUsers && !canManagePermissions) {
    // Si el usuario no tiene ningún permiso de admin, redirigir o mostrar mensaje de acceso denegado
    return (
      <div className="page-container admin-panel-page">
        <h1 className="admin-page-header-title">Panel de Administración</h1>
        <p className="error-message" style={{ textAlign: 'center', marginTop: '30px' }}>
          Acceso denegado. No tienes permisos para ver el panel de administración.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container admin-panel-page">
      <h1 className="admin-page-header-title">Panel de Administración</h1>

      <nav className="admin-tabs-navigation">
        <ul className="admin-tabs-list">
          {canViewUsers && (
            <li className="admin-tab-item">
              <NavLink
                to="/admin/users"
                className={({ isActive }) => "admin-tab-link" + (isActive ? " active" : "")}
              >
                Usuarios
              </NavLink>
            </li>
          )}
          {canManagePermissions && (
            <li className="admin-tab-item">
              <NavLink
                to="/admin/config/permissions"
                className={({ isActive }) => "admin-tab-link" + (isActive ? " active" : "")}
              >
                Permisos y Roles
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="admin-content-area">
        {activeTab === 'users' && canViewUsers && <AdminUsersPage />}
        {activeTab === 'permissions' && canManagePermissions && <AdminPermissionsPage />}
        {/* Si el usuario no tiene permiso para la pestaña activa, pero sí para el panel,
            podríamos mostrar un mensaje o redirigir a la primera pestaña disponible. */}
        {(activeTab === 'users' && !canViewUsers) && canManagePermissions && (
            <p className="info-message" style={{ textAlign: 'center', marginTop: '30px' }}>
                No tienes permiso para ver usuarios. Redirigiendo a Permisos.
            </p>
        )}
        {(activeTab === 'permissions' && !canManagePermissions) && canViewUsers && (
            <p className="info-message" style={{ textAlign: 'center', marginTop: '30px' }}>
                No tienes permiso para gestionar permisos. Redirigiendo a Usuarios.
            </p>
        )}
      </div>
    </div>
  );
};

export default AdminPanelPage;