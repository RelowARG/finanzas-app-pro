// finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateDMY } from '../../utils/formatters'; // [cite: finanzas-app-pro/frontend/src/utils/formatters.js]
import WidgetLoader from './WidgetLoader'; // *** IMPORTAR WidgetLoader ***
import '../dashboard/DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import './SavingsGoalsWidget.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css]

const SavingsGoalItem = ({ goal }) => {
  const progress = goal.targetAmount > 0 ? (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100 : 0;
  const cappedProgress = Math.min(Math.max(progress, 0), 100);

  let progressBarClass = 'progress-bar-medium'; 
    if (cappedProgress >= 100) progressBarClass = 'progress-bar-completed';
    else if (cappedProgress >= 75) progressBarClass = 'progress-bar-good';
    else if (cappedProgress <= 25) progressBarClass = 'progress-bar-low';

  return (
    <li className="savings-goal-widget-item"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
      <Link to={`/goals#goal-${goal.id}`} className="goal-widget-link"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
        <span className="goal-widget-icon">{goal.icon || '🎯'}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
        <div className="goal-widget-info"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
          <span className="goal-widget-name">{goal.name}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
          <div className="goal-widget-progress-bar-container"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
            <div
              className={`goal-widget-progress-bar ${progressBarClass}`} /* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */
              style={{ width: `${cappedProgress}%` }}
              title={`${cappedProgress.toFixed(1)}%`}
            >
              {cappedProgress > 15 ? `${cappedProgress.toFixed(0)}%` : ''}
            </div>
          </div>
        </div>
        <div className="goal-widget-amounts"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
          <span className="goal-widget-current"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
            {formatCurrency(goal.currentAmount, goal.currency)}
          </span>
          <span className="goal-widget-target"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
            de {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>
      </Link>
    </li>
  );
};

// Aceptar goals, loading y error como props
const SavingsGoalsWidget = ({ goals, loading, error }) => {
  if (loading) {
    return (
      <div className="dashboard-widget savings-goals-widget">
        <h3>Metas de Ahorro</h3>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando metas..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget savings-goals-widget">
        <h3>Metas de Ahorro</h3>
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
        <h3>Metas de Ahorro</h3>
        <div className="dashboard-widget-content">
          <p className="no-data-widget" style={{ textAlign: 'center' }}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
            No tienes metas de ahorro activas. <Link to="/goals/add">¡Crea una!</Link>
          </p>
        </div>
      </div>
    );
  }
  
  const goalsToShow = activeGoals.slice(0, 4);

  return (
    <div className="dashboard-widget savings-goals-widget">
      <h3>Metas de Ahorro Activas</h3>
      <div className="dashboard-widget-content">
        <ul className="savings-goals-widget-list"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/SavingsGoalsWidget.css] */}
          {goalsToShow.map(goal => (
            <SavingsGoalItem key={goal.id} goal={goal} />
          ))}
        </ul>
        {activeGoals.length > goalsToShow.length && (
             <Link to="/goals" className="button button-small button-view-all" style={{marginTop:'10px'}}>Ver Todas ({activeGoals.length})</Link> // [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css]
        )}
      </div>
    </div>
  );
};

export default SavingsGoalsWidget;
