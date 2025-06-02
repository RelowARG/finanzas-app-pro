// finanzas-app-pro/frontend/src/components/goals/GoalItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateDMY, formatCurrency } from '../../utils/formatters'; //
// import './GoalItem.css'; // Crearemos este archivo CSS a continuación

const GoalItem = ({ goal, onDelete, onAddProgress }) => {
  if (!goal) {
    return null;
  }

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const cappedProgress = Math.min(Math.max(progress, 0), 100); // Asegurar que esté entre 0 y 100

  let progressBarClass = 'progress-bar-normal';
  if (cappedProgress >= 100) {
    progressBarClass = 'progress-bar-completed';
  } else if (cappedProgress > 75) {
    progressBarClass = 'progress-bar-good';
  } else if (cappedProgress > 40) {
    progressBarClass = 'progress-bar-medium';
  }

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
    <div className={`goal-item-card status-${goal.status}`}> {/* Define .goal-item-card en CSS */}
      <div className="goal-item-header">
        <span className="goal-item-icon">{goal.icon || '🎯'}</span>
        <h3 className="goal-item-name">{goal.name}</h3>
        <span className={`goal-item-status-badge status-badge-${goal.status}`}>
          {getStatusLabel(goal.status)}
        </span>
      </div>

      <div className="goal-item-body">
        <div className="goal-amounts">
          <p>
            <strong>Actual:</strong> {formatCurrency(goal.currentAmount, goal.currency || 'ARS')}
          </p>
          <p>
            <strong>Objetivo:</strong> {formatCurrency(goal.targetAmount, goal.currency || 'ARS')}
          </p>
        </div>

        <div className="goal-progress-bar-container"> {/* Define en CSS */}
          <div
            className={`goal-progress-bar ${progressBarClass}`} // Define en CSS
            style={{ width: `${cappedProgress}%` }}
            title={`${cappedProgress.toFixed(1)}% alcanzado`}
          >
            {cappedProgress > 10 ? `${cappedProgress.toFixed(0)}%` : ''}
          </div>
        </div>
        
        <p className="goal-remaining">
          <strong>Restante:</strong> 
          <span className={remainingAmount <= 0 ? 'text-positive' : 'text-negative'}>
            {formatCurrency(remainingAmount, goal.currency || 'ARS')}
          </span>
        </p>

        {goal.targetDate && (
          <p className="goal-target-date">
            <strong>Fecha Límite:</strong> {formatDateDMY(goal.targetDate)}
          </p>
        )}
        {goal.description && <p className="goal-description"><em>{goal.description}</em></p>}
        {goal.priority && <p className="goal-priority"><strong>Prioridad:</strong> <span className={`priority-${goal.priority}`}>{goal.priority}</span></p>}
      </div>

      <div className="goal-item-actions"> {/* Define en CSS */}
        {/* Botón para añadir progreso (funcionalidad futura) */}
        {goal.status === 'active' && onAddProgress && (
          <button 
            onClick={() => onAddProgress(goal.id)} 
            className="button button-small button-action" // Define en CSS
            title="Registrar Avance"
          >
            ➕ Avance
          </button>
        )}
        <Link to={`/goals/edit/${goal.id}`} className="button button-small button-edit">
          Editar
        </Link>
        <button onClick={() => onDelete(goal.id)} className="button button-small button-delete">
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default GoalItem;