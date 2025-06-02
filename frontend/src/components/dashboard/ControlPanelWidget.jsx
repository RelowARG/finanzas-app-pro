// Ruta: src/components/dashboard/ControlPanelWidget.jsx
import React from 'react';
import WidgetLoader from './WidgetLoader'; // *** IMPORTAR WidgetLoader ***
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]

const formatCurrencyBare = (amount, currency = 'ARS') => {
  const value = Number(amount) || 0;
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const ControlPanelItem = ({ title, value, currency, subValue, progressPercent, progressColor }) => {
  return (
    <div className="control-panel-item"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <div className="control-panel-item-title">{title}</div> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <div className="control-panel-item-value"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        {value}
        <span className="control-panel-item-currency">{currency}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      </div>
      {subValue && <div className="control-panel-item-subvalue">{subValue}</div>} {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      {progressPercent !== undefined && (
        <div className="control-panel-progress-bar-container"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
          <div
            className="control-panel-progress-bar" /* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */
            style={{ width: `${Math.min(progressPercent, 100)}%`, backgroundColor: progressColor || '#3498db' }}
          >
            {progressPercent > 10 ? `${progressPercent.toFixed(0)}%` : ''}
          </div>
        </div>
      )}
    </div>
  );
};

// Aceptar loading y error como props
const ControlPanelWidget = ({ saldoData, flujoData, gastadoData, loading, error }) => {
  if (loading) {
    return (
      <div className="dashboard-widget control-panel-widget">
        <h3>Panel de Control</h3>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando panel..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget control-panel-widget">
        <h3>Panel de Control</h3>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{textAlign: 'center'}}>
            {typeof error === 'string' ? error : 'Error al cargar datos del panel.'}
          </p>
        </div>
      </div>
    );
  }
  
  // Usar valores por defecto si los datos no están completamente cargados o son nulos
  const saldo = saldoData || { value: 0, currency: 'ARS' };
  const flujo = flujoData || { value: 0, currency: 'ARS', type: 'ingreso' };
  const gastado = gastadoData || { spent: 0, total: 0, currency: 'ARS' };


  const gastadoPercent = gastado.total > 0 ? (gastado.spent / gastado.total) * 100 : 0;
  let gastadoColor = '#3498db'; 
  if (gastadoPercent > 75) gastadoColor = '#f39c12'; 
  if (gastadoPercent >= 100) gastadoColor = '#e74c3c'; 

  return (
  <div className="dashboard-widget control-panel-widget">
    <h3>Panel de Control</h3>
    <div className="dashboard-widget-content">
      <div className="gauges-container"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
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
