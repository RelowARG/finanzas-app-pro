// Ruta: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetLoader from './WidgetLoader';
import './DashboardComponents.css'; //
import './InvestmentHighlights.css'; //

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

const InvestmentHighlights = ({ highlights, loading, error }) => {
  if (loading) {
    return (
      <div className="dashboard-widget investment-highlights-widget">
        <h3>Resumen de Inversiones</h3>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando inversiones..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget investment-highlights-widget">
        <h3>Resumen de Inversiones</h3>
        <div className="dashboard-widget-content">
          <p className="error-message" style={{textAlign: 'center'}}>
            {typeof error === 'string' ? error : 'Error al cargar resumen de inversiones.'}
          </p>
        </div>
      </div>
    );
  }

  if (!highlights || highlights.totalNumberOfInvestments === 0) {
    return (
      <div className="dashboard-widget investment-highlights-widget">
        <h3>Resumen de Inversiones</h3>
        <div className="dashboard-widget-content">
          <p className="no-data-widget">No hay inversiones registradas.</p> {/* */}
          <Link to="/investments/add" className="button button-small" style={{marginTop: '10px'}}>
            Registrar Inversión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget investment-highlights-widget">
      <h3>Resumen de Inversiones ({highlights.totalNumberOfInvestments})</h3>
      <div className="dashboard-widget-content">
        <div className="total-investments-value"> {/* */}
          <span>Valor Total Estimado:</span>
          <div className="currency-values"> {/* */}
            {Object.entries(highlights.totalValueByCurrency).map(([currency, value]) => (
              <strong key={currency} className="total-value-currency-item"> {/* */}
                {formatCurrency(value, currency)}
              </strong>
            ))}
            {Object.keys(highlights.totalValueByCurrency).length === 0 && <span>N/A</span>}
          </div>
        </div>

        {highlights.topInvestments && highlights.topInvestments.length > 0 && (
          <div className="top-investments-list"> {/* */}
            <h4>Inversiones Destacadas:</h4>
            <ul>
              {highlights.topInvestments.map(inv => (
                <li key={inv.id}>
                  <Link to={`/investments#investment-${inv.id}`}>
                    <span className="inv-icon">{inv.icon || '⭐'}</span> {/* */}
                    <span className="inv-name">{inv.name} ({getInvestmentTypeLabel(inv.type)})</span> {/* */}
                    <span className="inv-value">{formatCurrency(inv.currentValue, inv.currency)}</span> {/* */}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link to="/investments" className="button button-small button-view-all"> {/* */}
          Ver Todas las Inversiones
        </Link>
      </div>
    </div>
  );
};

export default InvestmentHighlights;