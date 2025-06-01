// Ruta: finanzas-app-pro/frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; //
import './Sidebar.css'; //

const DashboardIcon = () => <span role="img" aria-label="Dashboard">📊</span>;
const AccountsIcon = () => <span role="img" aria-label="Cuentas">🏦</span>;
// ... (otros iconos que ya tenías)
const CategoriesIcon = () => <span role="img" aria-label="Categorías">🏷️</span>;
const RecurringIcon = () => <span role="img" aria-label="Recurrentes">🔁</span>;
const ExchangeRateIcon = () => <span role="img" aria-label="Tasas de Cambio">💲</span>;
const SettingsIcon = () => <span role="img" aria-label="Configuración">⚙️</span>;
const AdminIcon = () => <span role="img" aria-label="Administración">👑</span>;
const PermissionsIcon = () => <span role="img" aria-label="Permisos">🔑</span>; // *** NUEVO ICONO ***
const TransactionsIcon = () => <span role="img" aria-label="Movimientos">🔄</span>;
const BudgetsIcon = () => <span role="img" aria-label="Presupuestos">🎯</span>;
const ReportsIcon = () => <span role="img" aria-label="Informes">📈</span>;
const InvestmentsIcon = () => <span role="img" aria-label="Inversiones">💹</span>;
const DebtAndLoanIcon = () => <span role="img" aria-label="Deudas y Préstamos">🤝</span>;


const Sidebar = () => {
  const { user, hasPermission } = useAuth(); //

  if (!user) {
    return null;
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          {/* ... (enlaces existentes) ... */}
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
           {/* El enlace general a /settings podría ir a la primera subpágina o a una página de resumen de config */}
          <li>
            <NavLink to="/settings/categories" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <SettingsIcon />
              <span>Configuración</span>
            </NavLink>
          </li>


          {/* Sección de Administración */}
          {user && user.role === 'admin' && (
            <>
              {(hasPermission('admin_view_all_users') || hasPermission('admin_manage_permissions_config')) && (
                <li className="sidebar-separator"></li>
              )}

              {hasPermission('admin_view_all_users') && (
                <li>
                  <NavLink 
                    to="/admin/users" 
                    className={({ isActive }) => "sidebar-link sidebar-link-admin" + (isActive ? " active" : "")}
                  >
                    <AdminIcon />
                    <span>Admin Usuarios</span>
                  </NavLink>
                </li>
              )}

              {/* *** NUEVO ENLACE PARA GESTIÓN DE PERMISOS *** */}
              {hasPermission('admin_manage_permissions_config') && (
                 <li>
                  <NavLink 
                    to="/admin/config/permissions" 
                    className={({ isActive }) => "sidebar-link sidebar-link-admin" + (isActive ? " active" : "")}
                  >
                    <PermissionsIcon />
                    <span>Admin Permisos</span>
                  </NavLink>
                </li>
              )}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;