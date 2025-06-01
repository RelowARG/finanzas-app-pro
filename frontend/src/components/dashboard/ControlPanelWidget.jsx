// Ruta: src/components/dashboard/ControlPanelWidget.jsx
import React from 'react';
import './DashboardComponents.css'; // Asegúrate que este archivo CSS exista y tenga estilos relevantes

// Datos de ejemplo - Deberían venir de props o de un servicio
const controlPanelData = {
  saldoActual: { value: 244000, currency: 'ARS' }, // Ejemplo
  flujoDeFondosMes: { value: 15000, currency: 'ARS', type: 'ingreso' }, // Ejemplo: positivo es ingreso
  gastadoPresupuestoGeneral: { spent: 80000, total: 200000, currency: 'ARS' } // Ejemplo
};

const formatCurrencyBare = (amount, currency = 'ARS') => {
  const value = Number(amount) || 0;
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0, // Sin decimales para montos grandes
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


const ControlPanelWidget = (props) => {
  // En una implementación real, estos datos vendrían de props o de un estado alimentado por un servicio
  const saldo = props.saldoData || controlPanelData.saldoActual;
  const flujo = props.flujoData || controlPanelData.flujoDeFondosMes;
  const gastado = props.gastadoData || controlPanelData.gastadoPresupuestoGeneral;

  const gastadoPercent = gastado.total > 0 ? (gastado.spent / gastado.total) * 100 : 0;
  let gastadoColor = '#3498db'; // Azul por defecto
  if (gastadoPercent > 75) gastadoColor = '#f39c12'; // Naranja si está cerca del límite
  if (gastadoPercent >= 100) gastadoColor = '#e74c3c'; // Rojo si se pasó

  return (
  <div className="dashboard-widget control-panel-widget">
    <h3>Panel de Control</h3>
    <div className="dashboard-widget-content">
      <div className="gauges-container"> {/* Reutilizamos esta clase para los items */}
        <ControlPanelItem
            title="SALDO ACTUAL"
            value={formatCurrencyBare(saldo.value, saldo.currency)}
            currency={saldo.currency}
            // subValue="Total cuentas resumidas" // Opcional
        />
        <ControlPanelItem
            title="FLUJO DEL MES"
            value={formatCurrencyBare(flujo.value, flujo.currency)}
            currency={flujo.currency}
            subValue={flujo.value >= 0 ? "Ingresos Netos" : "Egresos Netos"}
            progressColor={flujo.value >=0 ? '#2ecc71' : '#e74c3c'} // Verde o Rojo
        />
        <ControlPanelItem
            title="GASTADO (Presup. General)"
            value={formatCurrencyBare(gastado.spent, gastado.currency)}
            currency={gastado.currency}
            subValue={`de ${formatCurrencyBare(gastado.total, gastado.currency)}`}
            progressPercent={gastadoPercent}
            progressColor={gastadoColor}
        />
      </div>
    </div>
  </div>
  );
};
export default ControlPanelWidget;