// Ruta: frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './SettingsPage.css'; // Nuevo CSS para esta página

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar la pestaña activa basándose en la URL
  const [activeSettingTab, setActiveSettingTab] = useState('categories'); // Por defecto, mostrar categorías

  useEffect(() => {
    // Redirigir a la sub-ruta por defecto si se accede a /settings directamente
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      navigate('/settings/categories', { replace: true });
    } else if (location.pathname.includes('/settings/categories')) {
      setActiveSettingTab('categories');
    } else if (location.pathname.includes('/settings/recurring-transactions')) {
      setActiveSettingTab('recurring-transactions');
    } else if (location.pathname.includes('/settings/exchange-rates')) {
      setActiveSettingTab('exchange-rates');
    }
  }, [location.pathname, navigate]);

  return (
    <div className="page-container settings-page">
      <h1 className="settings-page-header-title">Configuración</h1>

      <div className="settings-content-wrapper">
        {/* Sub-Sidebar de Navegación */}
        <aside className="settings-sidebar">
          <ul className="settings-nav-list">
            <li className="settings-nav-item">
              <NavLink
                to="/settings/categories"
                className={({ isActive }) => "settings-nav-link" + (isActive ? " active" : "")}
              >
                Categorías
              </NavLink>
            </li>
            <li className="settings-nav-item">
              <NavLink
                to="/settings/recurring-transactions"
                className={({ isActive }) => "settings-nav-link" + (isActive ? " active" : "")}
              >
                Mov. Recurrentes
              </NavLink>
            </li>
            <li className="settings-nav-item">
              <NavLink
                to="/settings/exchange-rates"
                className={({ isActive }) => "settings-nav-link" + (isActive ? " active" : "")}
              >
                Tasas de Cambio
              </NavLink>
            </li>
            {/* Puedes añadir más elementos de configuración aquí */}
          </ul>
        </aside>

        {/* Área de Contenido Principal de Configuración */}
        <main className="settings-main-content-area">
          {/* Outlet renderiza el componente de la ruta anidada activa */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;