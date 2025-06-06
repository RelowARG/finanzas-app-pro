// Ruta: finanzas-app-pro/frontend/src/components/investments/InvestmentListItem.jsx
import React from 'react';
import { formatCurrency, formatDateDMY } from '../../utils/formatters';
import './InvestmentListItem.css';

const InvestmentListItem = ({ investment, onDeleteInvestment, onItemClick, onEdit }) => {
  if (!investment) return null;

  const getInvestmentTypeForDisplay = (type) => {
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

  const initialValueBase = parseFloat(investment.initialInvestment) || parseFloat(investment.amountInvested) || 0;
  let currentValueBase = parseFloat(investment.currentValue) || 0;
  const quantityNum = parseFloat(investment.quantity) || 0;
  const purchasePriceNum = parseFloat(investment.purchasePrice) || 0;
  const currentPriceNum = parseFloat(investment.currentPrice) || 0;

  let calculatedInitialValue = initialValueBase;
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && purchasePriceNum > 0 && initialValueBase === 0) {
    calculatedInitialValue = quantityNum * purchasePriceNum;
  }
  
  let calculatedCurrentValue = currentValueBase;
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && currentPriceNum > 0 ) {
    calculatedCurrentValue = quantityNum * currentPriceNum;
  }

  const profitOrLoss = calculatedCurrentValue - calculatedInitialValue;
  const rendimientoPercent = calculatedInitialValue !== 0 ? (profitOrLoss / calculatedInitialValue) * 100 : 0;
  const profitClass = profitOrLoss >= 0 ? 'profit-positive' : 'profit-negative';

  let subTitle = '';
  if (investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') {
    subTitle = `${quantityNum > 0 ? quantityNum.toLocaleString('es-AR') + ' ' : ''}${investment.ticker || ''}`;
  } else if (investment.type === 'fci' || investment.type === 'obligaciones' || investment.type === 'plazo_fijo') {
    subTitle = investment.entity || getInvestmentTypeForDisplay(investment.type);
  } else {
    subTitle = getInvestmentTypeForDisplay(investment.type);
  }

  const displayProfitLoss = formatCurrency(profitOrLoss, investment.currency);

  return (
    <div className="investment-list-item-wrapper" onClick={() => onItemClick(investment)}>
      <div className="investment-list-item" id={`investment-${investment.id}`}>
        <div className="item-main-info">
          <span className="item-icon">{investment.icon || '⭐'}</span>
          <div className="item-name-details">
            <span className="item-name">{investment.name}</span>
            <span className="item-subtitle">{subTitle}</span>
          </div>
        </div>
        <div className="item-financials">
          <span className="item-current-value">{formatCurrency(calculatedCurrentValue, investment.currency)}</span>
          <span className={`item-profit-loss ${profitClass}`}>
            {profitOrLoss >= 0 ? '+' : ''}{displayProfitLoss} 
            {calculatedInitialValue !== 0 ? ` (${rendimientoPercent.toFixed(2)}%)` : ' (---%)'}
          </span>
        </div>
        <div className="item-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="button button-small button-edit">
            Editar
          </button>
          <button 
            onClick={() => onDeleteInvestment(investment.id)} 
            className="button button-small button-delete"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentListItem;