// Ruta: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.jsx
import React from 'react';
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import './MonthlySavingsWidget.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css]

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  const absAmount = Math.abs(value);
  const sign = value < 0 ? '-' : ''; 
  
  return `${sign}${symbol} ${absAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MonthlySavingsWidget = ({ status, loading, error }) => { // error prop añadido
  if (loading) {
    return (
      <div className="dashboard-widget monthly-savings-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Finanzas del Mes</h3>
        <p className="loading-text-widget" style={{textAlign: 'center'}}>Calculando...</p> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      </div>
    );
  }

  if (error) { // Manejo del error
     return (
      <div className="dashboard-widget monthly-savings-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Finanzas del Mes</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }

  const arsData = status?.statusByCurrency?.ARS;
  const usdUnconvertedData = status?.statusByCurrency?.USD_UNCONVERTED;
  const monthName = status?.monthName || new Date().toLocaleString('es-AR', { month: 'long' });
  const year = status?.year || new Date().getFullYear();
  const rateUsed = status?.rateUsed;

  if (!status || (!arsData && !usdUnconvertedData)) {
    return (
      <div className="dashboard-widget monthly-savings-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Finanzas de {monthName} {year}</h3>
        <p className="no-data-widget" style={{textAlign: 'center'}}>No hay datos de transacciones para mostrar este mes.</p> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      </div>
    );
  }
  
  const savingsClass = arsData?.savings >= 0 ? 'savings-positive' : 'savings-negative'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css]
  const savingsLabel = arsData?.savings >= 0 ? `Ahorro (ARS)` : `Déficit (ARS)`;

  return (
    <div className="dashboard-widget monthly-savings-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <h3>Finanzas de {monthName} {year}</h3>
      
      {arsData && (
        <div className="currency-summary-block"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
          <h4>Resumen Consolidado en ARS</h4>
          <div className="financial-summary-grid"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <div className="summary-item income"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-label">Ingresos (ARS)</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-value text-positive">{formatCurrency(arsData.income, 'ARS')}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
            </div>
            <div className="summary-item expenses"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-label">Egresos (ARS)</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-value text-negative">{formatCurrency(arsData.expenses, 'ARS')}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
            </div>
          </div>
          <div className={`savings-total ${savingsClass}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <span className="savings-label">{savingsLabel}:</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <strong className="savings-amount"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              {formatCurrency(arsData.savings, 'ARS')}
            </strong>
          </div>
          {rateUsed && <p className="conversion-note-widget">Conversión USD a ARS con tasa: {parseFloat(rateUsed).toFixed(2)}.</p>} {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
        </div>
      )}

      {usdUnconvertedData && (
        <div className="currency-summary-block unconverted-block"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
          <h4>Movimientos en USD (No Convertidos)</h4>
           <p className="conversion-note-widget error"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            {usdUnconvertedData.note || "Estos montos en USD no se incluyeron en el total ARS por falta de tasa de cambio para el mes."}
          </p>
          <div className="financial-summary-grid"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <div className="summary-item income"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-label">Ingresos (USD)</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-value text-positive">{formatCurrency(usdUnconvertedData.income, 'USD')}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
            </div>
            <div className="summary-item expenses"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-label">Egresos (USD)</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              <span className="summary-value text-negative">{formatCurrency(usdUnconvertedData.expenses, 'USD')}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
            </div>
          </div>
           <div className={`savings-total ${usdUnconvertedData.savings >= 0 ? 'savings-positive' : 'savings-negative'}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <span className="savings-label">{usdUnconvertedData.savings >= 0 ? `Ahorro (USD)` : `Déficit (USD)`}:</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
            <strong className="savings-amount"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/MonthlySavingsWidget.css] */}
              {formatCurrency(usdUnconvertedData.savings, 'USD')}
            </strong>
          </div>
        </div>
      )}

      {!arsData && !usdUnconvertedData && (
         <p className="no-data-widget" style={{textAlign: 'center'}}>No hay datos financieros para el mes actual.</p> // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
      )}
    </div>
  );
};

export default MonthlySavingsWidget;