// Ruta: src/components/dashboard/previews/ControlPanelPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css';
import './PreviewStyles.css';

const formatCurrencyBarePreview = (amount) => {
  return Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const ControlPanelItemPreview = ({ title, value, currency, subValue, progressPercent, progressColor }) => (
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

const ControlPanelPreview = () => {
  const saldo = { value: 244000, currency: 'ARS' };
  const flujo = { value: 15850, currency: 'ARS' };
  const gastado = { spent: 82500, total: 180000, currency: 'ARS' };
  const gastadoPercent = (gastado.spent / gastado.total) * 100;

  return (
    <div className="dashboard-widget control-panel-widget preview-mode">
      <h3>Panel de Control</h3>
      <div className="dashboard-widget-content">
        <div className="gauges-container">
          <ControlPanelItemPreview
            title="SALDO ACTUAL"
            value={formatCurrencyBarePreview(saldo.value)}
            currency={saldo.currency}
          />
          <ControlPanelItemPreview
            title="FLUJO DEL MES"
            value={formatCurrencyBarePreview(flujo.value)}
            currency={flujo.currency}
            subValue={flujo.value >= 0 ? "Ingresos Netos" : "Egresos Netos"}
            progressColor={flujo.value >=0 ? '#2ecc71' : '#e74c3c'}
          />
          <ControlPanelItemPreview
            title="GASTADO (Presup.)"
            value={formatCurrencyBarePreview(gastado.spent)}
            currency={gastado.currency}
            subValue={`de ${formatCurrencyBarePreview(gastado.total)}`}
            progressPercent={gastadoPercent}
            progressColor={gastadoPercent > 75 ? (gastadoPercent >= 100 ? '#e74c3c' : '#f39c12') : '#3498db'}
          />
        </div>
      </div>
    </div>
  );
};
export default ControlPanelPreview;