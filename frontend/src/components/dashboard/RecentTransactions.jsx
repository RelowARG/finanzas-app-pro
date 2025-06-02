// Ruta: src/components/dashboard/RecentTransactions.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import DashboardTransactionItem from './DashboardTransactionItem';
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import './DashboardComponents.css';

const RecentTransactions = ({ transactions, loading, error, widgetDescription }) => {
  const widgetTitle = "Últimos Registros";

  if (loading) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando movimientos..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{textAlign: 'center'}}>
            {typeof error === 'string' ? error : 'Error al cargar últimos movimientos.'}
          </p>
        </div>
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <p className="no-data-widget">No hay transacciones recientes.</p>
           <Link to="/transactions/add" className="button button-small" style={{marginTop: '10px'}}>
            Registrar Movimiento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget recent-transactions-widget">
      <div className="widget-header-container">
        <h3>{widgetTitle}</h3>
        <WidgetInfoIcon description={widgetDescription} />
      </div>
      <div className="dashboard-widget-content">
        <ul className="transactions-list">
          {transactions.slice(0, 5).map(tx => (
            <DashboardTransactionItem key={tx.id} transaction={tx} />
          ))}
        </ul>
         {transactions.length > 5 && (
            <Link to="/transactions" className="button button-small button-view-all" style={{marginTop:'10px'}}>Ver Todos</Link>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;