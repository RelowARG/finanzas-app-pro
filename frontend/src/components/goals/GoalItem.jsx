import React from 'react';
import { formatDateDMY, formatCurrency } from '../../utils/formatters.js'; //
import './GoalItem.css';

const GoalItem = ({ goal, onDelete, onEdit, onAddProgress }) => {
  if (!goal) {
    return null;
  }

  const progress = goal.targetAmount > 0 ? (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100 : 0;
  const cappedProgress = Math.min(Math.max(progress, 0), 100);

  let progressBarClass = 'progress-bar-medium';
  if (cappedProgress >= 100) progressBarClass = 'progress-bar-completed';
  else if (cappedProgress > 75) progressBarClass = 'progress-bar-good';
  else if (cappedProgress <= 25) progressBarClass = 'progress-bar-low';

  const remainingAmount = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activa',
      completed: 'Completada',
      paused: 'Pausada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  return (
    <div className={`goal-item-card status-${goal.status}`}>
      <div className="goal-item-header">
        <span className="goal-item-icon">{goal.icon || '🎯'}</span>
        <h3 className="goal-item-name">{goal.name}</h3>
        <span className={`goal-item-status-badge status-badge-${goal.status}`}>
          {getStatusLabel(goal.status)}
        </span>
      </div>

      <div className="goal-item-body">
        <div className="goal-amounts">
          <div className="amount-block">
            <span className="label">Ahorrado</span>
            <span className="value">{formatCurrency(goal.currentAmount, goal.currency || 'ARS')}</span>
          </div>
          <div className="amount-block target">
            <span className="label">Objetivo</span>
            <span className="value">{formatCurrency(goal.targetAmount, goal.currency || 'ARS')}</span>
          </div>
        </div>

        <div className="goal-progress-bar-container">
          <div
            className={`goal-progress-bar ${progressBarClass}`}
            style={{ width: `${cappedProgress}%` }}
            title={`${cappedProgress.toFixed(1)}% alcanzado`}
          >
            {cappedProgress > 15 ? `${cappedProgress.toFixed(0)}%` : ''}
          </div>
        </div>
        
        {remainingAmount > 0 && goal.status === 'active' && (
            <p className="goal-remaining">
                Faltan: <strong>{formatCurrency(remainingAmount, goal.currency || 'ARS')}</strong>
            </p>
        )}

        {goal.targetDate && (
          <p className="goal-target-date">
            Fecha Límite: <strong>{formatDateDMY(goal.targetDate)}</strong>
          </p>
        )}
        {goal.description && <p className="goal-description"><em>{goal.description}</em></p>}
      </div>

      {/* *** SECCIÓN DE ACCIONES CORREGIDA *** */}
      <div className="goal-item-actions">
        {goal.status === 'active' && (
          <button 
            onClick={() => onAddProgress(goal)} 
            className="button button-small button-action"
            title="Registrar Avance"
          >
            ➕ Avance
          </button>
        )}
        <button onClick={() => onEdit(goal)} className="button button-small button-edit">
          Editar
        </button>
        <button onClick={() => onDelete(goal.id)} className="button button-small button-delete">
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default GoalItem;