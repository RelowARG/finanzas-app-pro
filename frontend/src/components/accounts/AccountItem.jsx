// Ruta: finanzas-app-pro/frontend/src/components/accounts/AccountItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AccountItem.css'; // [cite: finanzas-app-pro/frontend/src/components/accounts/AccountItem.css]

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Asegurar que la fecha se parsee correctamente como UTC para evitar desfases
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Añadimos onPayStatement como prop
const AccountItem = ({ account, onDeleteAccount, onPayStatement }) => { 
  if (!account) {
    return null;
  }

  const balanceClass = parseFloat(account.balance) >= 0 ? 'balance-positive' : 'balance-negative';

  return (
    <li className="account-item-card"> 
      <div className="account-item-header">
        <span className="account-item-icon">{account.icon || '📁'}</span>
        <h3 className="account-item-name">{account.name}</h3>
      </div>
      <div className="account-item-body">
        <p className="account-item-type">
          Tipo: <span>{account.type ? account.type.replace(/_/g, ' ') : 'No especificado'}</span>
        </p>
        <p className={`account-item-balance ${balanceClass}`}>
          Saldo: <span>{formatCurrency(account.balance, account.currency)}</span>
        </p>
        {account.currency !== 'ARS' && account.currency && (
            <p className="account-item-currency-note">Moneda: {account.currency}</p>
        )}
        {account.bankName && (
          <p className="account-item-detail">Banco/Emisor: {account.bankName}</p>
        )}
        {account.accountNumberLast4 && (
          <p className="account-item-detail">Terminación: {account.accountNumberLast4}</p>
        )}
        {account.type === 'tarjeta_credito' && account.creditLimit && (
          <p className="account-item-detail">Límite: {formatCurrency(account.creditLimit, account.currency)}</p>
        )}

        {/* Nueva sección para información del resumen de tarjeta */}
        {account.type === 'tarjeta_credito' && (
          <div className="statement-details">
            {account.statementBalance !== null && account.statementBalance !== undefined && (
              <p className="account-item-detail statement-balance-due">
                Saldo Resumen: <span>{formatCurrency(account.statementBalance, account.currency)}</span>
              </p>
            )}
            {account.statementCloseDate && (
              <p className="account-item-detail">Cierre Resumen: {formatDate(account.statementCloseDate)}</p>
            )}
            {account.statementDueDate && (
              <p className="account-item-detail">Venc. Resumen: {formatDate(account.statementDueDate)}</p>
            )}
          </div>
        )}
      </div>
      <div className="account-item-actions">
        <Link 
          to={`/accounts/edit/${account.id}`} 
          className="button button-small button-edit"
        >
          Editar
        </Link>
        {/* Botón para pagar resumen de tarjeta */}
        {account.type === 'tarjeta_credito' && onPayStatement && (
          <button
            onClick={() => onPayStatement(account)} // Pasar toda la info de la cuenta al modal
            className="button button-small button-pay-statement"
          >
            Pagar Resumen
          </button>
        )}
        <button 
          onClick={() => onDeleteAccount(account.id)}
          className="button button-small button-delete"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
};

export default AccountItem;