// finanzas-app-pro/frontend/src/components/dashboard/previews/SavingsGoalsPreview.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters'; //
import '../../dashboard/DashboardComponents.css'; //
import '../../dashboard/SavingsGoalsWidget.css'; // Reutilizar estilos del widget
import './PreviewStyles.css'; //

const SavingsGoalItemPreview = ({ goal }) => {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const cappedProgress = Math.min(Math.max(progress, 0), 100);
  let progressBarClass = 'progress-bar-medium';
  if (cappedProgress >= 100) progressBarClass = 'progress-bar-completed';
  else if (cappedProgress >= 75) progressBarClass = 'progress-bar-good';

  return (
    <li className="savings-goal-widget-item">
      <a href="#!" className="goal-widget-link">
        <span className="goal-widget-icon">{goal.icon}</span>
        <div className="goal-widget-info">
          <span className="goal-widget-name" title={goal.name}>
            {goal.name.length > 20 ? goal.name.substring(0,17) + '...' : goal.name}
          </span>
          <div className="goal-widget-progress-bar-container" style={{height: '10px'}}> {/* Barra más pequeña en preview */}
            <div
              className={`goal-widget-progress-bar ${progressBarClass}`}
              style={{ width: `${cappedProgress}%`, height: '10px', lineHeight: '10px', fontSize: '0.6rem' }}
            >
              {cappedProgress > 20 ? `${cappedProgress.toFixed(0)}%` : ''}
            </div>
          </div>
        </div>
        <div className="goal-widget-amounts" style={{minWidth:'70px'}}>
          <span className="goal-widget-current" style={{fontSize:'0.75rem'}}>
            {formatCurrency(goal.currentAmount, goal.currency).replace(/\.\d+$/, '')} {/* Sin decimales */}
          </span>
          <span className="goal-widget-target" style={{fontSize:'0.6rem'}}>
            de {formatCurrency(goal.targetAmount, goal.currency).replace(/\.\d+$/, '')}
          </span>
        </div>
      </a>
    </li>
  );
}

const SavingsGoalsPreview = () => {
  const goals = [
    { id: 1, icon: '✈️', name: 'Vacaciones Europa 2026', currentAmount: 75000, targetAmount: 300000, currency: 'ARS' },
    { id: 2, icon: '🚗', name: 'Anticipo Auto Nuevo', currentAmount: 1200, targetAmount: 5000, currency: 'USD' },
    { id: 3, icon: '🏠', name: 'Fondo Emergencia', currentAmount: 250000, targetAmount: 250000, currency: 'ARS' },
  ];

  return (
    <div className="dashboard-widget savings-goals-widget preview-mode"> {/* */}
      <h3>Metas de Ahorro</h3>
      <div className="dashboard-widget-content" style={{ padding: '5px 0 0 0' }}>
        <ul className="savings-goals-widget-list">
          {goals.slice(0, 3).map(goal => (
            <SavingsGoalItemPreview key={goal.id} goal={goal} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SavingsGoalsPreview;