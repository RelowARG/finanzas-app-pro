// Ruta: finanzas-app-pro/frontend/src/components/investments/InvestmentListItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './InvestmentListItem.css'; // [cite: finanzas-app-pro/frontend/src/components/investments/InvestmentListItem.css]
import { formatCurrency, formatDateDMY } from '../../utils/formatters'; // Asegúrate que formatDateDMY esté aquí si lo usas

const InvestmentListItem = ({ investment, onDeleteInvestment, onItemClick }) => {
  if (!investment) return null;

  const getInvestmentTypeForDisplay = (type) => {
    const labels = {
      plazo_fijo: 'Plazo Fijo',
      acciones: 'Acc. Extranjera',
      cedears: 'Acc. Argentina',
      criptomonedas: 'Cripto',
      fci: 'FCI',
      obligaciones: 'ON',
      otro: 'Otra'
    };
    return labels[type] || type.replace('_', ' ');
  };

  // Asegurar que los valores sean numéricos o 0 por defecto
  const initialValueBase = parseFloat(investment.initialInvestment) || parseFloat(investment.amountInvested) || 0;
  let currentValueBase = parseFloat(investment.currentValue) || 0; // Puede ser 0 si no hay valor actual
  const quantityNum = parseFloat(investment.quantity) || 0;
  const purchasePriceNum = parseFloat(investment.purchasePrice) || 0;
  const currentPriceNum = parseFloat(investment.currentPrice) || 0;

  let calculatedInitialValue = initialValueBase;
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && purchasePriceNum > 0 && initialValueBase === 0) {
    calculatedInitialValue = quantityNum * purchasePriceNum;
  }
  
  let calculatedCurrentValue = currentValueBase;
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && currentPriceNum > 0 ) {
    // Si hay precio actual, usarlo para calcular el valor actual, incluso si currentValueBase era 0.
    // Esto es importante si el currentValue en la BD no se actualizó pero sí el currentPrice.
    calculatedCurrentValue = quantityNum * currentPriceNum;
  } else if (currentValueBase === 0 && calculatedInitialValue > 0 && (investment.type !== 'acciones' && investment.type !== 'cedears' && investment.type !== 'criptomonedas')) {
    // Para activos no de mercado, si el valor actual es 0 pero hubo inversión inicial,
    // podríamos mostrar el valor inicial como actual para evitar un rendimiento de -100% si no hay datos.
    // O, si se prefiere, mostrar 0 y que el rendimiento sea -100%.
    // Por ahora, si currentValue es 0, lo dejamos en 0.
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

  // *** AJUSTE EN LA VISUALIZACIÓN DE GANANCIA/PÉRDIDA ***
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
            {/* Mostrar siempre el valor, incluso si es 0, y luego el porcentaje */}
            {profitOrLoss >= 0 ? '+' : ''}{displayProfitLoss} 
            {/* Evitar mostrar (NaN%) o (Infinity%) si calculatedInitialValue es 0 */}
            {calculatedInitialValue !== 0 ? ` (${rendimientoPercent.toFixed(2)}%)` : ' (---%)'}
          </span>
        </div>
        <div className="item-actions" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};

export default InvestmentListItem;