// finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateDMY } from '../../utils/formatters';
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import '../dashboard/DashboardComponents.css';
import './SavingsGoalsWidget.css';

const SavingsGoalItem = ({ goal }) => {
  const progress = goal.targetAmount > 0 ? (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100 : 0;
  const cappedProgress = Math.min(Math.max(progress, 0), 100);

  let progressBarClass = 'progress-bar-medium'; 
    if (cappedProgress >= 100) progressBarClass = 'progress-bar-completed';
    else if (cappedProgress >= 75) progressBarClass = 'progress-bar-good';
    else if (cappedProgress <= 25) progressBarClass = 'progress-bar-low';

  return (
    <li className="savings-goal-widget-item">
      <Link to={`/goals#goal-${goal.id}`} className="goal-widget-link">
        <span className="goal-widget-icon">{goal.icon || '🎯'}</span>
        <div className="goal-widget-info">
          <span className="goal-widget-name">{goal.name}</span>
          <div className="goal-widget-progress-bar-container">
            <div
              className={`goal-widget-progress-bar ${progressBarClass}`}
              style={{ width: `${cappedProgress}%` }}
              title={`${cappedProgress.toFixed(1)}%`}
            >
              {cappedProgress > 15 ? `${cappedProgress.toFixed(0)}%` : ''}
            </div>
          </div>
        </div>
        <div className="goal-widget-amounts">
          <span className="goal-widget-current">
            {formatCurrency(goal.currentAmount, goal.currency)}
          </span>
          <span className="goal-widget-target">
            de {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>
      </Link>
    </li>
  );
};

const SavingsGoalsWidget = ({ goals, loading, error, widgetDescription }) => {
  const widgetTitle = "Metas de Ahorro Activas";

  if (loading) {
    return (
      <div className="dashboard-widget savings-goals-widget">
        <div className="widget-header-container">
          <h3>Metas de Ahorro</h3> {/* Título genérico mientras carga */}
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando metas..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget savings-goals-widget">
        <div className="widget-header-container">
          <h3>Metas de Ahorro</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{ textAlign: 'center' }}>
            {typeof error === 'string' ? error : 'Error al cargar metas.'}
          </p>
        </div>
      </div>
    );
  }

  const activeGoals = goals || [];

  if (activeGoals.length === 0) {
    return (
      <div className="dashboard-widget savings-goals-widget">
        <div className="widget-header-container">
          <h3>Metas de Ahorro</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <p className="no-data-widget" style={{ textAlign: 'center' }}>
            No tienes metas de ahorro activas. <Link to="/goals/add">¡Crea una!</Link>
          </p>
        </div>
      </div>
    );
  }
  
  const goalsToShow = activeGoals.slice(0, 4);

  return (
    <div className="dashboard-widget savings-goals-widget">
      <div className="widget-header-container">
        <h3>{widgetTitle}</h3>
        <WidgetInfoIcon description={widgetDescription} />
      </div>
      <div className="dashboard-widget-content">
        <ul className="savings-goals-widget-list">
          {goalsToShow.map(goal => (
            <SavingsGoalItem key={goal.id} goal={goal} />
          ))}
        </ul>
        {activeGoals.length > goalsToShow.length && (
             <Link to="/goals" className="button button-small button-view-all" style={{marginTop:'10px'}}>Ver Todas ({activeGoals.length})</Link>
        )}
      </div>
    </div>
  );
};

export default SavingsGoalsWidget;