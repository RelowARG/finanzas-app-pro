// Ruta: finanzas-app-pro/frontend/src/components/investments/InvestmentSummary.jsx
import React from 'react';
import './InvestmentSummary.css';

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$'; 
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const InvestmentSummary = ({ investments }) => {
  if (!investments || investments.length === 0) {
    return (
        <div className="investment-summary-widget">
            <h3 className="summary-title">Resumen General de Inversiones</h3>
            <p className="summary-note">No hay inversiones registradas para mostrar un resumen.</p>
        </div>
    );
  }
  
  const summaryByCurrency = investments.reduce((acc, inv) => {
    const currency = inv.currency || 'ARS';
    acc[currency] = acc[currency] || { totalInitial: 0, totalCurrent: 0, count: 0 };
    
    const initialInvestment = parseFloat(inv.initialInvestment) || parseFloat(inv.amountInvested) || 0;
    const currentValue = parseFloat(inv.currentValue) || 0;

    acc[currency].totalInitial += initialInvestment;
    acc[currency].totalCurrent += currentValue;
    acc[currency].count += 1;
    return acc;
  }, {});

  const hasData = Object.keys(summaryByCurrency).length > 0;

  return (
    <div className="investment-summary-widget">
      <h3 className="summary-title">Resumen General de Inversiones</h3>
      {!hasData && <p className="summary-note">No hay datos de inversión para resumir.</p>}

      {/* El contenedor de bloques de moneda vuelve a ser de flujo normal (vertical) */}
      <div className="summary-currency-blocks-container">
        {Object.entries(summaryByCurrency).map(([currency, data]) => {
          const totalProfitOrLoss = data.totalCurrent - data.totalInitial;
          const profitClass = totalProfitOrLoss >= 0 ? 'profit-positive' : 'profit-negative';
          const arrowIcon = totalProfitOrLoss >= 0 ? '▲' : '▼';
          const totalRendimientoPercent = data.totalInitial !== 0 ? (totalProfitOrLoss / data.totalInitial) * 100 : 0;

          return (
            <div key={currency} className="summary-currency-block">
              <h4>Total en {currency}:</h4>
              {/* Nuevo contenedor para la cuadrícula de detalles */}
              <div className="summary-details-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Invertido:</span>
                  <span className="summary-value">{formatCurrency(data.totalInitial, currency)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Valor Actual Total:</span>
                  <span className="summary-value value-prominent">{formatCurrency(data.totalCurrent, currency)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ganancia/Pérdida Total:</span>
                  <span className={`summary-value ${profitClass}`}>{formatCurrency(totalProfitOrLoss, currency)}</span>
                </div>
                 <div className="summary-item">
                    <span className="summary-label">Rendimiento Total (%):</span>
                    <span className={`summary-value ${profitClass}`}>
                        {data.totalInitial === 0 && totalProfitOrLoss === 0 ? '-' : `${arrowIcon} ${totalRendimientoPercent.toFixed(2)}%`}
                    </span>
                </div>
              </div> {/* Fin de summary-details-grid */}
              <p className="summary-count">({data.count} {data.count === 1 ? 'inversión' : 'inversiones'} en {currency})</p>
            </div>
          );
        })}
      </div>

       {Object.keys(summaryByCurrency).length > 1 && (
           <p className="summary-note">* Los totales se muestran por moneda. No se realiza conversión entre ellas.</p>
       )}
    </div>
  );
};

export default InvestmentSummary;