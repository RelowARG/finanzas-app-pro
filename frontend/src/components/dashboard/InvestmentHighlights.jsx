// Ruta: finanzas-app-pro/frontend/src/components/dashboard/InvestmentHighlights.jsx
// ARCHIVO NUEVO
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardComponents.css'; // Reutilizamos el CSS general del dashboard
import './InvestmentHighlights.css'; // CSS específico para este componente

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
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget investment-highlights-widget">
        <h3>Resumen de Inversiones</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }

  if (!highlights || highlights.totalNumberOfInvestments === 0) {
    return (
      <div className="dashboard-widget investment-highlights-widget">
        <h3>Resumen de Inversiones</h3>
        <p>No hay inversiones registradas para mostrar un resumen.</p>
        <Link to="/investments/add" className="button button-small" style={{marginTop: '10px'}}>
          Registrar Inversión
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-widget investment-highlights-widget">
      <h3>Resumen de Inversiones ({highlights.totalNumberOfInvestments})</h3>
      
      <div className="total-investments-value">
        <span>Valor Total Estimado:</span>
        <div className="currency-values">
          {Object.entries(highlights.totalValueByCurrency).map(([currency, value]) => (
            <strong key={currency} className="total-value-currency-item">
              {formatCurrency(value, currency)}
            </strong>
          ))}
          {Object.keys(highlights.totalValueByCurrency).length === 0 && <span>N/A</span>}
        </div>
      </div>

      {highlights.topInvestments && highlights.topInvestments.length > 0 && (
        <div className="top-investments-list">
          <h4>Inversiones Destacadas:</h4>
          <ul>
            {highlights.topInvestments.map(inv => (
              <li key={inv.id}>
                <Link to={`/investments#${inv.id}`}> {/* Podríamos hacer un ancla o ir a detalle */}
                  <span className="inv-icon">{inv.icon || '⭐'}</span>
                  <span className="inv-name">{inv.name} ({getInvestmentTypeLabel(inv.type)})</span>
                  <span className="inv-value">{formatCurrency(inv.currentValue, inv.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/investments" className="button button-small button-view-all">
        Ver Todas las Inversiones
      </Link>
    </div>
  );
};

export default InvestmentHighlights;
