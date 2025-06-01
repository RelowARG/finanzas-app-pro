// Ruta: src/components/dashboard/DashboardTransactionItem.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Si quieres que sea clickeable
import './DashboardComponents.css'; // Usaremos estilos de aquí

// Reutilizamos las funciones de formato
const formatCurrencyForDashboard = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${value < 0 ? '-' : ''}${symbol}${Math.abs(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Menos decimales para dashboard
};

const formatDateForDashboard = (dateString) => {
  if (!dateString) return 'N/A';
  const dateObj = new Date(dateString + 'T00:00:00Z'); // Asumir UTC para evitar problemas de timezone
  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    // No mostrar el año para ahorrar espacio, o 'numeric' si se prefiere
  });
};

const DashboardTransactionItem = ({ transaction }) => {
  if (!transaction) {
    return null;
  }

  const amountValue = parseFloat(transaction.amount) || 0;
  const amountClass = amountValue >= 0 ? 'text-positive' : 'text-negative';
  const defaultIcon = transaction.type === 'ingreso' ? '🟢' : '🔴';

  return (
    <li className={`dashboard-transaction-item ${transaction.type}`}>
      <Link to={`/transactions/edit/${transaction.id}`} className="dashboard-transaction-link">
        <span className="dashboard-transaction-icon">{transaction.icon || transaction.category?.icon || defaultIcon}</span>
        <div className="dashboard-transaction-info">
          <span className="dashboard-transaction-description" title={transaction.description}>
            {transaction.description}
          </span>
          <span className="dashboard-transaction-category">
            {transaction.category?.name || 'Sin Categoría'}
          </span>
        </div>
        <div className="dashboard-transaction-details">
          <span className={`dashboard-transaction-amount ${amountClass}`}>
            {formatCurrencyForDashboard(transaction.amount, transaction.currency)}
          </span>
          <span className="dashboard-transaction-date">{formatDateForDashboard(transaction.date)}</span>
        </div>
      </Link>
    </li>
  );
};

export default DashboardTransactionItem;