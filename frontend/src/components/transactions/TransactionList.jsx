// Ruta: finanzas-app-pro/frontend/src/components/transactions/TransactionList.jsx
// ACTUALIZA ESTE ARCHIVO
import React from 'react';
import TransactionItem from './TransactionItem';
import './TransactionList.css';

// Añadimos onDeleteTransaction como prop
const TransactionList = ({ transactions, onDeleteTransaction }) => {
  if (!transactions || transactions.length === 0) {
    return <p className="no-transactions-message">No se encontraron movimientos con los filtros aplicados.</p>;
  }

  return (
    <div className="transaction-list-container">
      <table className="transaction-table">
        <thead>
          <tr>
            <th className="th-icon"></th>
            <th className="th-description">Descripción / Categoría</th>
            <th className="th-date">Fecha</th>
            <th className="th-account">Cuenta</th>
            <th className="th-amount">Monto</th>
            <th className="th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
              onDeleteTransaction={onDeleteTransaction} // Pasar la prop
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
