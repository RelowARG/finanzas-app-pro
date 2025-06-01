// Ruta: finanzas-app-pro/frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // [cite: finanzas-app-pro/frontend/src/contexts/AuthContext.jsx]
import './Sidebar.css'; // [cite: finanzas-app-pro/frontend/src/components/Layout/Sidebar.css]

// Definición de iconos (asumiendo que ya los tienes o los crearás)
const DashboardIcon = () => <span role="img" aria-label="Dashboard">📊</span>;
const AccountsIcon = () => <span role="img" aria-label="Cuentas">🏦</span>;
const TransactionsIcon = () => <span role="img" aria-label="Movimientos">🔄</span>;
const BudgetsIcon = () => <span role="img" aria-label="Presupuestos">🎯</span>;
const ReportsIcon = () => <span role="img" aria-label="Informes">📈</span>;
const InvestmentsIcon = () => <span role="img" aria-label="Inversiones">💹</span>;
const DebtAndLoanIcon = () => <span role="img" aria-label="Deudas y Préstamos">🤝</span>;
const CategoriesIcon = () => <span role="img" aria-label="Categorías">🏷️</span>;
const RecurringIcon = () => <span role="img" aria-label="Recurrentes">🔁</span>;
const ExchangeRateIcon = () => <span role="img" aria-label="Tasas de Cambio">💲</span>;
const SettingsIcon = () => <span role="img" aria-label="Configuración">⚙️</span>;
const AdminIcon = () => <span role="img" aria-label="Administración">👑</span>;

const Sidebar = () => {
  const { user } = useAuth(); // Obtener el usuario del contexto

  // Si no hay usuario (ej. en la página de login), no mostrar el sidebar
  if (!user) {
    return null;
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <DashboardIcon />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounts" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <AccountsIcon />
              <span>Cuentas</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/transactions" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <TransactionsIcon />
              <span>Movimientos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/budgets" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <BudgetsIcon />
              <span>Presupuestos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <ReportsIcon />
              <span>Informes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/investments" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <InvestmentsIcon />
              <span>Inversiones</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/debts-loans" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <DebtAndLoanIcon />
              <span>Deudas y Préstamos</span>
            </NavLink>
          </li>
          
          <li className="sidebar-separator"></li>
          
          <li>
            <NavLink to="/settings/categories" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <CategoriesIcon />
              <span>Categorías</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings/recurring-transactions" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <RecurringIcon />
              <span>Mov. Recurrentes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings/exchange-rates" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <ExchangeRateIcon />
              <span>Tasas de Cambio</span>
            </NavLink>
          </li>
          <li>
            {/* Este enlace a "/settings" podría ser una página general de configuración o llevar al primer item de config */}
            <NavLink to="/settings/categories" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <SettingsIcon />
              <span>Configuración</span>
            </NavLink>
          </li>

          {/* Enlace de Administración solo para usuarios con rol 'admin' */}
          {user && user.role === 'admin' && (
            <>
              <li className="sidebar-separator"></li>
              <li>
                <NavLink to="/admin/users" className={({ isActive }) => "sidebar-link sidebar-link-admin" + (isActive ? " active" : "")}>
                  <AdminIcon />
                  <span>Admin Usuarios</span>
                </NavLink>
              </li>
              {/* Aquí podrías añadir más enlaces de administración en el futuro */}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;