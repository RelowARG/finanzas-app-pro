// Ruta: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.jsx
import React from 'react';
import './DashboardComponents.css';
import './MonthlySavingsWidget.css';

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  const absAmount = Math.abs(value);
  const sign = value < 0 ? '-' : ''; 
  
  return `${sign}${symbol} ${absAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MonthlySavingsWidget = ({ status, loading, error }) => {
  // *** AÑADIR ESTE CONSOLE.LOG ***
  console.log("[MonthlySavingsWidget] Datos recibidos del servicio (prop 'status'):", JSON.parse(JSON.stringify(status || {})));

  if (loading) {
    return (
      <div className="dashboard-widget monthly-savings-widget">
        <h3>Finanzas del Mes</h3>
        <p className="loading-text-widget" style={{textAlign: 'center'}}>Calculando...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="dashboard-widget monthly-savings-widget">
        <h3>Finanzas del Mes</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }

  const arsData = status?.statusByCurrency?.ARS;
  const usdUnconvertedData = status?.statusByCurrency?.USD_UNCONVERTED;
  const monthName = status?.monthName || new Date().toLocaleString('es-AR', { month: 'long', timeZone: 'UTC' });
  const year = status?.year || new Date().getUTCFullYear();
  const rateUsed = status?.rateUsed;

  if (!status || (!arsData && !usdUnconvertedData)) {
    return (
      <div className="dashboard-widget monthly-savings-widget">
        <h3>Finanzas de {monthName} {year}</h3>
        <p className="no-data-widget" style={{textAlign: 'center'}}>No hay datos de transacciones para mostrar este mes.</p>
      </div>
    );
  }
  
  const savingsClass = arsData?.savings >= 0 ? 'savings-positive' : 'savings-negative';
  const savingsLabel = arsData?.savings >= 0 ? `Ahorro (ARS)` : `Déficit (ARS)`;

  return (
    <div className="dashboard-widget monthly-savings-widget">
      <h3>Finanzas de {monthName} {year}</h3>
      
      {arsData && (
        <div className="currency-summary-block">
          <h4>Resumen Consolidado en ARS</h4>
          <div className="financial-summary-grid">
            <div className="summary-item income">
              <span className="summary-label">Ingresos (ARS)</span>
              <span className="summary-value text-positive">{formatCurrency(arsData.income, 'ARS')}</span>
            </div>
            <div className="summary-item expenses">
              <span className="summary-label">Egresos (ARS)</span>
              <span className="summary-value text-negative">{formatCurrency(arsData.expenses, 'ARS')}</span>
            </div>
          </div>
          <div className={`savings-total ${savingsClass}`}>
            <span className="savings-label">{savingsLabel}:</span>
            <strong className="savings-amount">
              {formatCurrency(arsData.savings, 'ARS')}
            </strong>
          </div>
          {rateUsed && <p className="conversion-note-widget">Conversión USD a ARS con tasa: {parseFloat(rateUsed).toFixed(2)}.</p>}
        </div>
      )}

      {usdUnconvertedData && (
        <div className="currency-summary-block unconverted-block">
          <h4>Movimientos en USD (No Convertidos)</h4>
           <p className="conversion-note-widget error">
            {usdUnconvertedData.note || "Estos montos en USD no se incluyeron en el total ARS por falta de tasa de cambio para el mes."}
          </p>
          <div className="financial-summary-grid">
            <div className="summary-item income">
              <span className="summary-label">Ingresos (USD)</span>
              <span className="summary-value text-positive">{formatCurrency(usdUnconvertedData.income, 'USD')}</span>
            </div>
            <div className="summary-item expenses">
              <span className="summary-label">Egresos (USD)</span>
              <span className="summary-value text-negative">{formatCurrency(usdUnconvertedData.expenses, 'USD')}</span>
            </div>
          </div>
           <div className={`savings-total ${usdUnconvertedData.savings >= 0 ? 'savings-positive' : 'savings-negative'}`}>
            <span className="savings-label">{usdUnconvertedData.savings >= 0 ? `Ahorro (USD)` : `Déficit (USD)`}:</span>
            <strong className="savings-amount">
              {formatCurrency(usdUnconvertedData.savings, 'USD')}
            </strong>
          </div>
        </div>
      )}

      {!arsData && !usdUnconvertedData && (
         <p className="no-data-widget" style={{textAlign: 'center'}}>No hay datos financieros para el mes actual.</p>
      )}
    </div>
  );
};

export default MonthlySavingsWidget;