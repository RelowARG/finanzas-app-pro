// Ruta: finanzas-app-pro/frontend/src/components/investments/InvestmentCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './InvestmentCard.css'; // [cite: finanzas-app-pro/frontend/src/components/investments/InvestmentCard.css]

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0; // Default to 0 if amount is not a valid number
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  // Ensure date is parsed correctly, assuming YYYY-MM-DD from backend for DATEONLY
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit', // 'short' o '2-digit'
      year: 'numeric',
    });
  }
  return new Date(dateString).toLocaleDateString('es-AR'); // Fallback for full ISO strings
};

const InvestmentCard = ({ investment, onDeleteInvestment }) => {
  if (!investment) return null;

  const getInvestmentTypeLabel = (type) => {
    const labels = {
      plazo_fijo: 'Plazo Fijo',
      acciones: 'CEDEAR',
      criptomonedas: 'Cripto',
      fci: 'FCI',
      obligaciones: 'ON',
      otro: 'Otra'
    };
    return labels[type] || type.replace('_', ' ');
  };

  // Safely parse numeric fields, defaulting to 0 if null, undefined, or not a number
  const initialValue = parseFloat(investment.initialInvestment) || parseFloat(investment.amountInvested) || 0;
  const currentValue = parseFloat(investment.currentValue) || 0;
  const quantityNum = parseFloat(investment.quantity) || 0;
  const purchasePriceNum = parseFloat(investment.purchasePrice) || 0;
  const currentPriceNum = parseFloat(investment.currentPrice) || 0;
  const interestRateNum = parseFloat(investment.interestRate) || 0;


  // Recalculate initialValue for stocks/crypto if not directly provided but quantity and purchasePrice are
  let calculatedInitialValue = initialValue;
  if ((investment.type === 'acciones' || investment.type === 'criptomonedas') && quantityNum > 0 && purchasePriceNum > 0 && initialValue === 0) {
    calculatedInitialValue = quantityNum * purchasePriceNum;
  }
  
  // Recalculate currentValue for stocks/crypto if not directly provided but quantity and currentPrice are
  let calculatedCurrentValue = currentValue;
   if ((investment.type === 'acciones' || investment.type === 'criptomonedas') && quantityNum > 0 && currentPriceNum > 0 && currentValue === 0) {
    calculatedCurrentValue = quantityNum * currentPriceNum;
  }
  // If currentValue is still 0 after potential calculation (e.g. for FCI, Plazo Fijo where it might be set manually),
  // and initialValue is present, use initialValue as a fallback for currentValue to avoid NaN in profit calculation.
  // This is a display fallback, the actual currentValue should come from the backend or be updated.
  if (calculatedCurrentValue === 0 && calculatedInitialValue > 0 && (investment.type !== 'acciones' && investment.type !== 'criptomonedas')) {
      // For non-market priced assets, if current value is 0, assume it's at least the initial value for display
      // calculatedCurrentValue = calculatedInitialValue;
      // Or, if current value is explicitly 0 from backend, respect that.
      // The line above is commented because if currentValue is truly 0 (e.g. investment lost all value), it should show 0.
  }


  const profitOrLoss = calculatedCurrentValue - calculatedInitialValue;
  const rendimientoPercent = calculatedInitialValue !== 0 ? (profitOrLoss / calculatedInitialValue) * 100 : 0;

  const profitClass = profitOrLoss >= 0 ? 'profit-positive' : 'profit-negative';
  const arrowIcon = profitOrLoss >= 0 ? '▲' : '▼';

  return (
    <div className="investment-card" id={`investment-${investment.id}`}> {/* Added ID for potential anchoring */}
      <div className="investment-card-header">
        <span className="investment-card-icon">{investment.icon || '⭐'}</span>
        <h3 className="investment-card-name">{investment.name}</h3>
        <span className="investment-card-type">{getInvestmentTypeLabel(investment.type)}</span>
      </div>

      <div className="investment-card-body">
        <div className="investment-main-values">
            <div className="value-block">
                <span className="value-label">Valor Actual</span>
                <span className="value-amount value-prominent">{formatCurrency(calculatedCurrentValue, investment.currency)}</span>
            </div>
            <div className="value-block">
                <span className="value-label">Gan./Pérd.</span>
                <span className={`value-amount ${profitClass}`}>
                    {formatCurrency(profitOrLoss, investment.currency)}
                </span>
            </div>
            <div className="value-block">
                <span className="value-label">Rend. (%)</span>
                <span className={`value-amount ${profitClass}`}>
                    {profitOrLoss === 0 && calculatedInitialValue === 0 ? '-' : `${arrowIcon} ${rendimientoPercent.toFixed(2)}%`}
                </span>
            </div>
        </div>

        <div className="investment-details-grid">
            {calculatedInitialValue !== calculatedCurrentValue && ( // Show only if different or if currentValue is not just a mirror of initial
                 <div className="investment-detail-item">
                    <span className="detail-label">Invertido:</span>
                    <span className="detail-value">{formatCurrency(calculatedInitialValue, investment.currency)}</span>
                </div>
            )}
            {investment.type === 'plazo_fijo' && (
            <>
                <div className="investment-detail-item">
                <span className="detail-label">Inicio:</span>
                <span className="detail-value">{formatDate(investment.startDate)}</span>
                </div>
                <div className="investment-detail-item">
                <span className="detail-label">Fin:</span>
                <span className="detail-value">{formatDate(investment.endDate)}</span>
                </div>
                {interestRateNum > 0 && (
                    <div className="investment-detail-item">
                        <span className="detail-label">TNA:</span>
                        <span className="detail-value">{interestRateNum}%</span>
                    </div>
                )}
            </>
            )}
            {(investment.type === 'acciones' || investment.type === 'criptomonedas') && (
            <>
                <div className="investment-detail-item">
                <span className="detail-label">Cantidad:</span>
                <span className="detail-value">{quantityNum} {investment.ticker || ''}</span>
                </div>
                <div className="investment-detail-item">
                <span className="detail-label">P. Compra:</span>
                <span className="detail-value">{formatCurrency(purchasePriceNum, investment.currency)}</span>
                </div>
                 {currentPriceNum > 0 && (
                    <div className="investment-detail-item">
                    <span className="detail-label">P. Actual:</span>
                    <span className="detail-value">{formatCurrency(currentPriceNum, investment.currency)}</span>
                    </div>
                )}
            </>
            )}
            {/* Mostrar fecha de adquisición para tipos donde aplique y esté presente */}
            {(investment.type === 'acciones' || investment.type === 'criptomonedas' || investment.type === 'fci' || investment.type === 'obligaciones' || (investment.type === 'otro' && investment.purchaseDate) ) && investment.purchaseDate && (
                 <div className="investment-detail-item">
                    <span className="detail-label">Fecha Adq.:</span>
                    <span className="detail-value">{formatDate(investment.purchaseDate)}</span>
                </div>
            )}
            {investment.entity && (
            <div className="investment-detail-item full-width">
                <span className="detail-label">Entidad:</span>
                <span className="detail-value">{investment.entity}</span>
            </div>
            )}
        </div>
        
        {investment.notes && (
          <p className="investment-notes">Nota: {investment.notes}</p>
        )}
      </div>

      <div className="investment-card-actions">
        <Link to={`/investments/edit/${investment.id}`} className="button button-small button-edit">
          Editar
        </Link>
        <button 
          onClick={() => onDeleteInvestment(investment.id)} 
          className="button button-small button-delete"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default InvestmentCard;
