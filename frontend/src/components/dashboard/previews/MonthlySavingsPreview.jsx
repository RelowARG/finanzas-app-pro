// Ruta: src/components/dashboard/previews/MonthlySavingsPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css';
import '../../dashboard/MonthlySavingsWidget.css'; // Reutilizar estilos
import './PreviewStyles.css';

const formatCurrencyPreview = (amount, currency = 'ARS') => {
    const symbol = currency === 'USD' ? 'U$S' : '$';
    const value = Number(amount) || 0;
    const absAmount = Math.abs(value);
    const sign = value < 0 ? '-' : ''; // Manejar el signo explícitamente
    // Usar toLocaleString para el formato numérico, luego añadir signo y símbolo manualmente
    return `${sign}${symbol} ${absAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const MonthlySavingsPreview = () => {
  const status = {
    statusByCurrency: {
      ARS: { income: 2117184, expenses: 765000, savings: 1352184 },
    },
    monthName: "Junio",
    year: 2025,
    rateUsed: 980.50
  };
  const arsData = status.statusByCurrency.ARS;
  const savingsClass = arsData.savings >= 0 ? 'savings-positive' : 'savings-negative';
  const savingsLabel = arsData.savings >= 0 ? `Ahorro (ARS)` : `Déficit (ARS)`;

  return (
    <div className="dashboard-widget monthly-savings-widget preview-mode">
      <h3>Finanzas de {status.monthName} {status.year}</h3>
      <div className="dashboard-widget-content">
        {arsData && (
          <div className="currency-summary-block">
            <h4>Resumen Consolidado en ARS</h4>
            <div className="financial-summary-grid">
              <div className="summary-item income">
                <span className="summary-label">Ingresos (ARS)</span>
                <span className="summary-value text-positive">{formatCurrencyPreview(arsData.income, 'ARS')}</span>
              </div>
              <div className="summary-item expenses">
                <span className="summary-label">Egresos (ARS)</span>
                <span className="summary-value text-negative">{formatCurrencyPreview(arsData.expenses, 'ARS')}</span>
              </div>
            </div>
            <div className={`savings-total ${savingsClass}`}>
              <span className="savings-label">{savingsLabel}:</span>
              <strong className="savings-amount">
                {formatCurrencyPreview(arsData.savings, 'ARS')}
              </strong>
            </div>
             {status.rateUsed && <p className="conversion-note-widget preview-note">Tasa de conversión: {Number(status.rateUsed).toFixed(2)}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlySavingsPreview;