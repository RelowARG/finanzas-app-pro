// Ruta: src/components/dashboard/ControlPanelWidget.jsx
import React from 'react';
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import './DashboardComponents.css';

const formatCurrencyBare = (amount, currency = 'ARS') => {
  const value = Number(amount) || 0;
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const ControlPanelItem = ({ title, value, currency, subValue, progressPercent, progressColor }) => {
  return (
    <div className="control-panel-item">
      <div className="control-panel-item-title">{title}</div>
      <div className="control-panel-item-value">
        {value}
        <span className="control-panel-item-currency">{currency}</span>
      </div>
      {subValue && <div className="control-panel-item-subvalue">{subValue}</div>}
      {progressPercent !== undefined && (
        <div className="control-panel-progress-bar-container">
          <div
            className="control-panel-progress-bar"
            style={{ width: `${Math.min(progressPercent, 100)}%`, backgroundColor: progressColor || '#3498db' }}
          >
            {progressPercent > 10 ? `${progressPercent.toFixed(0)}%` : ''}
          </div>
        </div>
      )}
    </div>
  );
};

const ControlPanelWidget = ({ saldoData, flujoData, gastadoData, loading, error, widgetDescription }) => {
  const widgetTitle = "Panel de Control";

  if (loading) {
    return (
      <div className="dashboard-widget control-panel-widget">
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando panel..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget control-panel-widget">
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{textAlign: 'center'}}>
            {typeof error === 'string' ? error : 'Error al cargar datos del panel.'}
          </p>
        </div>
      </div>
    );
  }
  
  const saldo = saldoData || { value: 0, currency: 'ARS' };
  const flujo = flujoData || { value: 0, currency: 'ARS', type: 'ingreso' };
  const gastado = gastadoData || { spent: 0, total: 0, currency: 'ARS' };

  const gastadoPercent = gastado.total > 0 ? (gastado.spent / gastado.total) * 100 : 0;
  let gastadoColor = '#3498db'; 
  if (gastadoPercent > 75) gastadoColor = '#f39c12'; 
  if (gastadoPercent >= 100) gastadoColor = '#e74c3c'; 

  return (
  <div className="dashboard-widget control-panel-widget">
    <div className="widget-header-container">
      <h3>{widgetTitle}</h3>
      <WidgetInfoIcon description={widgetDescription} />
    </div>
    <div className="dashboard-widget-content">
      <div className="gauges-container">
        <ControlPanelItem
            title="SALDO ACTUAL"
            value={formatCurrencyBare(saldo.value, saldo.currency)}
            currency={saldo.currency}
        />
        <ControlPanelItem
            title="FLUJO DEL MES"
            value={formatCurrencyBare(flujo.value, flujo.currency)}
            currency={flujo.currency}
            subValue={flujo.value >= 0 ? "Ingresos Netos" : "Egresos Netos"}
            progressColor={flujo.value >=0 ? '#2ecc71' : '#e74c3c'}
        />
        <ControlPanelItem
            title="GASTADO (Presup. General)"
            value={formatCurrencyBare(gastado.spent, gastado.currency)}
            currency={gastado.currency}
            subValue={gastado.total > 0 ? `de ${formatCurrencyBare(gastado.total, gastado.currency)}` : 'Sin presupuesto'}
            progressPercent={gastadoPercent}
            progressColor={gastadoColor}
        />
      </div>
    </div>
  </div>
  );
};
export default ControlPanelWidget;