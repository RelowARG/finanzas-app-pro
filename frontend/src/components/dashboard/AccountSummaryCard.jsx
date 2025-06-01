// Ruta: src/components/dashboard/AccountSummaryCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardComponents.css'; // Usaremos este archivo CSS, asegúrate que exista y lo actualizaremos

const formatCurrencyForCard = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AccountSummaryCard = ({ account, bgColorClass, icon }) => {
  // Si no hay datos de cuenta, se renderiza como una tarjeta para añadir cuenta
  if (!account) {
    return (
      <Link to="/accounts/add" className="account-summary-card add-account-card">
        <div className="add-account-icon">➕</div>
        <div>Añadir cuenta</div>
      </Link>
    );
  }

  return (
    <div className={`account-summary-card ${bgColorClass || ''}`}>
      <div className="account-card-icon">{icon || account.icon || '🏦'}</div>
      <div className="account-card-main-info">
        <div className="account-card-name">{account.name}</div>
        <div className="account-card-balance">
          {formatCurrencyForCard(account.balance, account.currency)}
        </div>
      </div>
      {/* Opcional: Enlace para ver detalles o transacciones de la cuenta */}
      {/* <Link to={`/accounts/transactions/${account.id}`} className="account-card-details-link">Ver movimientos</Link> */}
    </div>
  );
};

export default AccountSummaryCard;