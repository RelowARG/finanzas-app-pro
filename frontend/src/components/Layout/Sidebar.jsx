// Ruta: finanzas-app-pro/frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; //
import './Sidebar.css'; //

// Iconos (asumiendo que ya están definidos como antes)
const DashboardIcon = () => <span role="img" aria-label="Dashboard">📊</span>;
const AccountsIcon = () => <span role="img" aria-label="Cuentas">🏦</span>;
const TransactionsIcon = () => <span role="img" aria-label="Movimientos">🔄</span>;
const BudgetsIcon = () => <span role="img" aria-label="Presupuestos">🎯</span>;
const ReportsIcon = () => <span role="img" aria-label="Informes">📈</span>;
const InvestmentsIcon = () => <span role="img" aria-label="Inversiones">💹</span>;
const DebtAndLoanIcon = () => <span role="img" aria-label="Deudas y Préstamos">🤝</span>;
const GoalsIcon = () => <span role="img" aria-label="Metas">🏆</span>; // *** NUEVO ÍCONO ***
const CategoriesIcon = () => <span role="img" aria-label="Categorías">🏷️</span>;
const RecurringIcon = () => <span role="img" aria-label="Recurrentes">🔁</span>;
const ExchangeRateIcon = () => <span role="img" aria-label="Tasas de Cambio">💲</span>;
const AdminIcon = () => <span role="img" aria-label="Administración">👑</span>; // Mantener por si se usa en otro lado
const PermissionsIcon = () => <span role="img" aria-label="Permisos">🔑</span>; // Mantener por si se usa en otro lado


const Sidebar = () => {
  const { user, hasPermission } = useAuth(); //

  if (!user) {
    return null;
  }

  return (
    <aside className="sidebar new-look">
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
          <li>
            <NavLink to="/goals" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <GoalsIcon />
              <span>Metas</span>
            </NavLink>
          </li>
          
          <li className="sidebar-separator"></li>
          <li className="sidebar-nav-header"><span>CONFIGURACIÓN</span></li>
          
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

          {/* *** SECCIÓN DE ADMINISTRACIÓN ELIMINADA DEL SIDEBAR *** */}
          {/* Ya no se renderiza aquí */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;