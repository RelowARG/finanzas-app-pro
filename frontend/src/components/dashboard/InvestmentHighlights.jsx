// Ruta: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]
import './InvestmentHighlights.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css]

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getInvestmentTypeLabel = (type) => {
    const labels = {
      plazo_fijo: 'Plazo Fijo',
      acciones: 'Acciones',
      criptomonedas: 'Cripto',
      fci: 'FCI',
      obligaciones: 'ON',
      otro: 'Otra'
    };
    return labels[type] || type;
  };

const InvestmentHighlights = ({ highlights, loading, error }) => { // error prop añadido
  if (loading) {
    return (
      <div className="dashboard-widget investment-highlights-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Resumen de Inversiones</h3>
        <p className="loading-text-widget">Cargando...</p> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      </div>
    );
  }

  if (error) { // Manejo del error
    return (
      <div className="dashboard-widget investment-highlights-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Resumen de Inversiones</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }

  if (!highlights || highlights.totalNumberOfInvestments === 0) {
    return (
      <div className="dashboard-widget investment-highlights-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <h3>Resumen de Inversiones</h3>
        <p className="no-data-widget">No hay inversiones registradas para mostrar un resumen.</p> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <Link to="/investments/add" className="button button-small" style={{marginTop: '10px'}}>
          Registrar Inversión
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-widget investment-highlights-widget"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <h3>Resumen de Inversiones ({highlights.totalNumberOfInvestments})</h3>
      
      <div className="total-investments-value"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
        <span>Valor Total Estimado:</span>
        <div className="currency-values"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
          {Object.entries(highlights.totalValueByCurrency).map(([currency, value]) => (
            <strong key={currency} className="total-value-currency-item"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
              {formatCurrency(value, currency)}
            </strong>
          ))}
          {Object.keys(highlights.totalValueByCurrency).length === 0 && <span>N/A</span>}
        </div>
      </div>

      {highlights.topInvestments && highlights.topInvestments.length > 0 && (
        <div className="top-investments-list"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
          <h4>Inversiones Destacadas:</h4>
          <ul>
            {highlights.topInvestments.map(inv => (
              <li key={inv.id}>
                <Link to={`/investments#investment-${inv.id}`}>
                  <span className="inv-icon">{inv.icon || '⭐'}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
                  <span className="inv-name">{inv.name} ({getInvestmentTypeLabel(inv.type)})</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
                  <span className="inv-value">{formatCurrency(inv.currentValue, inv.currency)}</span> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/investments" className="button button-small button-view-all"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.css] */}
        Ver Todas las Inversiones
      </Link>
    </div>
  );
};

export default InvestmentHighlights;