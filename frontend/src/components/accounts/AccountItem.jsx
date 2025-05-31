// Ruta: finanzas-app-pro/frontend/src/components/accounts/AccountItem.jsx
// ACTUALIZA ESTE ARCHIVO (o créalo si no existe en esta ruta exacta)
import React from 'react';
import { Link } from 'react-router-dom';
// Asumiendo que tienes un AccountItem.css en la misma carpeta o en una carpeta de estilos de componentes
import './AccountItem.css'; 

// Función helper para formatear moneda (debería ser consistente con otras partes de tu app)
const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AccountItem = ({ account, onDeleteAccount }) => { // Añadimos onDeleteAccount como prop
  if (!account) {
    return null;
  }

  const balanceClass = parseFloat(account.balance) >= 0 ? 'balance-positive' : 'balance-negative';

  return (
    <li className="account-item-card"> {/* Usamos la clase que definimos para el estilo de tarjeta */}
      <div className="account-item-header">
        <span className="account-item-icon">{account.icon || '📁'}</span>
        <h3 className="account-item-name">{account.name}</h3>
      </div>
      <div className="account-item-body">
        <p className="account-item-type">
          Tipo: <span>{account.type ? account.type.replace('_', ' ') : 'No especificado'}</span>
        </p>
        <p className={`account-item-balance ${balanceClass}`}>
          Saldo: <span>{formatCurrency(account.balance, account.currency)}</span>
        </p>
        {account.currency !== 'ARS' && account.currency && (
            <p className="account-item-currency-note">Moneda: {account.currency}</p>
        )}
        {account.bankName && (
          <p className="account-item-detail">Banco: {account.bankName}</p>
        )}
        {account.accountNumberLast4 && (
          <p className="account-item-detail">Terminación: {account.accountNumberLast4}</p>
        )}
        {account.type === 'tarjeta_credito' && account.creditLimit && (
          <p className="account-item-detail">Límite: {formatCurrency(account.creditLimit, account.currency)}</p>
        )}
      </div>
      <div className="account-item-actions">
        <Link 
          to={`/accounts/edit/${account.id}`} 
          className="button button-small button-edit"
        >
          Editar
        </Link>
        <button 
          onClick={() => onDeleteAccount(account.id)} // Llamar a la función pasada por props
          className="button button-small button-delete"
        >
          Eliminar
        </button>
        {/* Podríamos añadir un botón para ver movimientos de esta cuenta en el futuro */}
        {/* <Link to={`/transactions?accountId=${account.id}`} className="button button-small button-view">
          Ver Mov.
        </Link> */}
      </div>
    </li>
  );
};

export default AccountItem;
