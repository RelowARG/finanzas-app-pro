// Ruta: finanzas-app-pro/frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const DashboardIcon = () => <span>📊</span>;
const AccountsIcon = () => <span>🏦</span>;
const TransactionsIcon = () => <span>🔄</span>;
const BudgetsIcon = () => <span>🎯</span>;
const ReportsIcon = () => <span>📈</span>;
const InvestmentsIcon = () => <span>💹</span>;
const DebtAndLoanIcon = () => <span>🤝</span>;
const CategoriesIcon = () => <span>🏷️</span>;
const RecurringIcon = () => <span>🔁</span>;
const ExchangeRateIcon = () => <span>💲</span>; // NUEVO ICONO
const SettingsIcon = () => <span>⚙️</span>;

const Sidebar = () => {
  const { user } = useAuth();

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
          <li> {/* NUEVO ENLACE */}
            <NavLink to="/settings/exchange-rates" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <ExchangeRateIcon />
              <span>Tasas de Cambio</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
              <SettingsIcon />
              <span>Configuración General</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
