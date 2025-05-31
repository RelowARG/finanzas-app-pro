// Ruta: finanzas-app-pro/frontend/src/components/transactions/TransactionItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './TransactionItem.css'; // [cite: finanzas-app-pro/frontend/src/components/transactions/TransactionItem.css]

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  // El backend ya devuelve el monto con el signo correcto para la transacción.
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Asumiendo que dateString es "YYYY-MM-DD" o un formato que new Date() puede parsear correctamente.
  const dateObj = new Date(dateString + 'T00:00:00'); // Añadir hora para evitar problemas de zona horaria al parsear solo fecha
  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short', // 'short' como "may." o "jun."
    year: 'numeric',
  });
};

const TransactionItem = ({ transaction, onDeleteTransaction }) => {
  if (!transaction) {
    return null;
  }

  // Determinar clase basada en el monto (positivo/negativo) ya que 'type' podría no ser suficiente si hay errores
  const amountValue = parseFloat(transaction.amount) || 0;
  const amountClass = amountValue >= 0 ? 'amount-positive' : 'amount-negative';

  return (
    <tr className={`transaction-row ${transaction.type}`}>
      <td className="transaction-cell-icon">{transaction.icon || transaction.category?.icon || (transaction.type === 'ingreso' ? '🟢' : '🔴')}</td>
      <td className="transaction-cell-description">
        {transaction.description}
        <span className="transaction-cell-category">{transaction.category?.name || 'Sin Categoría'}</span>
        {/* Mostrar información de cuotas si existe */}
        {transaction.isInstallment && transaction.currentInstallment && transaction.totalInstallments && (
          <span className="transaction-cell-installments">
            (Cuota {transaction.currentInstallment}/{transaction.totalInstallments})
          </span>
        )}
      </td>
      <td className="transaction-cell-date">{formatDate(transaction.date)}</td>
      <td className="transaction-cell-account">{transaction.account?.name || `ID Cuenta: ${transaction.accountId}`}</td>
      <td className={`transaction-cell-amount ${amountClass}`}>
        {formatCurrency(transaction.amount, transaction.currency)}
      </td>
      <td className="transaction-cell-actions">
        <Link to={`/transactions/edit/${transaction.id}`} className="button button-small button-edit">
          Editar
        </Link>
        <button 
          onClick={() => onDeleteTransaction(transaction.id)}
          className="button button-small button-delete"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default TransactionItem;
