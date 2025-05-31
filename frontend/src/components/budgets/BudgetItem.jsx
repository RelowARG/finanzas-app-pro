// Ruta: finanzas-app-pro/frontend/src/components/budgets/BudgetItem.jsx
// ACTUALIZA ESTE ARCHIVO
import React from 'react';
import { Link } from 'react-router-dom';
import './BudgetItem.css';

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Añadimos onDeleteBudget como prop
const BudgetItem = ({ budget, onDeleteBudget }) => {
  if (!budget) return null;

  const progress = Math.min(Math.max(budget.progress || 0, 0), 100);
  let progressBarClass = 'progress-bar-normal';
  if (progress > 85) progressBarClass = 'progress-bar-warning';
  if (progress >= 100) progressBarClass = 'progress-bar-danger';

  const remainingClass = budget.remaining >= 0 ? 'remaining-positive' : 'remaining-negative';

  return (
    <div className="budget-item-card">
      <div className="budget-item-header">
        <span className="budget-item-icon">{budget.icon || budget.category?.icon || '🎯'}</span>
        <h3 className="budget-item-category">{budget.categoryNameSnapshot || budget.category?.name || 'Presupuesto'}</h3>
        <span className="budget-item-period">{budget.period}</span>
      </div>

      <div className="budget-item-body">
        <div className="budget-amounts">
          <div className="amount-spent">
            <span className="label">Gastado:</span>
            <span className="value">{formatCurrency(budget.spent, budget.currency)}</span>
          </div>
          <div className="amount-budgeted">
            <span className="label">de</span>
            <span className="value">{formatCurrency(budget.amount, budget.currency)}</span>
          </div>
        </div>

        <div className="progress-bar-container">
          <div
            className={`progress-bar ${progressBarClass}`}
            style={{ width: `${progress}%` }}
            title={`${progress.toFixed(1)}% Gastado`}
          >
          </div>
        </div>
        
        <div className="budget-remaining">
          <span className="label">Restante:</span>
          <span className={`value ${remainingClass}`}>
            {formatCurrency(budget.remaining, budget.currency)}
          </span>
        </div>
      </div>

      <div className="budget-item-actions">
        <Link to={`/budgets/edit/${budget.id}`} className="button button-small button-edit">
          Ajustar
        </Link>
        <Link 
          to={`/transactions?categoryId=${budget.categoryId}&dateFrom=${budget.startDate.split('T')[0]}&dateTo=${budget.endDate.split('T')[0]}`} 
          className="button button-small button-view"
        >
          Ver Gastos
        </Link>
        <button 
          onClick={() => onDeleteBudget(budget.id)} // Llamar a la función pasada por props
          className="button button-small button-delete"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default BudgetItem;