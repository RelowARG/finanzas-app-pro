// Ruta: finanzas-app-pro/frontend/src/components/transactions/TransactionList.jsx
import React from 'react';
import TransactionItem from './TransactionItem';
import './TransactionList.css';

const TransactionList = ({ transactions, onDeleteTransaction, onSort, sortConfig }) => {
  if (!transactions || transactions.length === 0) {
    return <p className="no-transactions-message">No se encontraron movimientos con los filtros aplicados.</p>;
  }

  const getSortIndicator = (columnKey) => {
    if (sortConfig && sortConfig.key === columnKey) {
      return sortConfig.direction === 'ASC' ? ' ▲' : ' ▼';
    }
    return ''; 
  };

  const requestSort = (key) => {
    if (!onSort) return;
    let direction = 'ASC';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC';
    }
    onSort(key, direction);
  };

  return (
    <div className="transaction-list-container">
      <table className="transaction-table">
        <thead>
          <tr>
            <th className="th-icon"></th>
            <th 
              className="th-description sortable-header" 
              onClick={() => requestSort('description')}
            >
              Descripción / Categoría
              <span className="sort-indicator">{getSortIndicator('description')}</span>
            </th>
            <th 
              className="th-date sortable-header"
              onClick={() => requestSort('date')}
            >
              Fecha
              <span className="sort-indicator">{getSortIndicator('date')}</span>
            </th>
            <th 
              className="th-account sortable-header" // *** AÑADIDA CLASE SORTABLE Y ONCLICK ***
              onClick={() => requestSort('accountName')} // *** USAR 'accountName' COMO KEY ***
            >
              Cuenta
              <span className="sort-indicator">{getSortIndicator('accountName')}</span> {/* *** USAR 'accountName' *** */}
            </th>
            <th 
              className="th-amount sortable-header"
              onClick={() => requestSort('amount')}
            >
              Monto
              <span className="sort-indicator">{getSortIndicator('amount')}</span>
            </th>
            <th className="th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
              onDeleteTransaction={onDeleteTransaction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;