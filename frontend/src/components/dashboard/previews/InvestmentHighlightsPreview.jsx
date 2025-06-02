// Ruta: src/components/dashboard/previews/InvestmentHighlightsPreview.jsx
import React from 'react';
import '../../dashboard/DashboardComponents.css';
import '../../dashboard/InvestmentHighlights.css'; // Reutilizar estilos del widget
import './PreviewStyles.css';

const formatCurrencyPreview = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  return `${symbol} ${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const InvestmentHighlightsPreview = () => {
  const highlights = {
    totalValueByCurrency: { ARS: 832160, USD: 2510.38 },
    topInvestments: [
      { id: 1, icon: '🏭', name: 'Pampa Energía SA (Acciones)', currentValue: 468160, currency: 'ARS' },
      { id: 2, icon: '🏛️', name: 'Grupo Financiero Galicia (Acciones)', currentValue: 364000, currency: 'ARS' },
    ],
    totalNumberOfInvestments: 5,
  };

  return (
    <div className="dashboard-widget investment-highlights-widget preview-mode">
      <h3>Resumen de Inversiones ({highlights.totalNumberOfInvestments})</h3>
      <div className="dashboard-widget-content">
        <div className="total-investments-value">
          <span>Valor Total Estimado:</span>
          <div className="currency-values">
            {Object.entries(highlights.totalValueByCurrency).map(([currency, value]) => (
              <strong key={currency} className="total-value-currency-item">
                {formatCurrencyPreview(value, currency)}
              </strong>
            ))}
          </div>
        </div>
        <div className="top-investments-list">
          <h4>Inversiones Destacadas:</h4>
          <ul>
            {highlights.topInvestments.map(inv => (
              <li key={inv.id}>
                <a href="#!"> {/* Enlaces desactivados en preview */}
                  <span className="inv-icon">{inv.icon || '⭐'}</span>
                  <span className="inv-name">{inv.name}</span>
                  <span className="inv-value">{formatCurrencyPreview(inv.currentValue, inv.currency)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
         <button className="button button-small button-view-all" disabled>Ver Todas</button>
      </div>
    </div>
  );
};
export default InvestmentHighlightsPreview;