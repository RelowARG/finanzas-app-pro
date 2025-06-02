// Ruta: src/components/dashboard/previews/BalanceOverviewPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css'; // Reutilizar estilos base
import './PreviewStyles.css'; // Estilos específicos de previews

const formatCurrencyPreview = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  return `${symbol} ${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const BalanceOverviewPreview = () => {
  const summary = {
    balances: { ARS: 125500.75, USD: 780.50 },
    totalBalanceARSConverted: 125500.75 + (780.50 * 950), // Tasa ejemplo
    conversionRateUsed: 950,
    rateMonthYear: '06/2025'
  };

  return (
    <div className="dashboard-widget balance-overview-widget preview-mode">
      <h3>Resumen de Balance</h3>
      <div className="dashboard-widget-content">
        <div className="balance-total-multi-currency">
          {summary.balances.ARS !== null && (
            <div className="balance-currency-item">
              <span>Saldo Total (ARS):</span>
              <strong className="text-positive">
                {formatCurrencyPreview(summary.balances.ARS, 'ARS')}
              </strong>
            </div>
          )}
          {summary.balances.USD !== null && (
            <div className="balance-currency-item">
              <span>Saldo Total (USD):</span>
              <strong className="text-positive">
                {formatCurrencyPreview(summary.balances.USD, 'USD')}
              </strong>
            </div>
          )}
          <div className="balance-currency-item consolidated-total">
            <span>Saldo Consolidado (ARS Aprox.):</span>
            <strong className="text-positive">
              {formatCurrencyPreview(summary.totalBalanceARSConverted, 'ARS')}
            </strong>
          </div>
        </div>
        <p className="balance-overview-note preview-note">
          Conversión USD a ARS con tasa: {summary.conversionRateUsed}.
        </p>
      </div>
    </div>
  );
};
export default BalanceOverviewPreview;