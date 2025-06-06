// Ruta: finanzas-app-pro/frontend/src/components/investments/InvestmentDetailModal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateDMY } from '../../utils/formatters';
import './InvestmentDetailModal.css';

const InvestmentDetailModal = ({ isOpen, onClose, investment }) => {
  if (!isOpen || !investment) return null;

  const initialValue = parseFloat(investment.initialInvestment) || parseFloat(investment.amountInvested) || 0;
  let currentValue = parseFloat(investment.currentValue) || 0;
  const quantityNum = parseFloat(investment.quantity) || 0;
  const purchasePriceNum = parseFloat(investment.purchasePrice) || 0;
  const currentPriceNum = parseFloat(investment.currentPrice) || 0;
  const interestRateNum = parseFloat(investment.interestRate) || 0;

  let calculatedInitialValue = initialValue;
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && purchasePriceNum > 0 && initialValue === 0) {
    calculatedInitialValue = quantityNum * purchasePriceNum;
  }
  
  if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && quantityNum > 0 && currentPriceNum > 0) {
    currentValue = quantityNum * currentPriceNum;
  }


  const profitOrLoss = currentValue - calculatedInitialValue;
  const rendimientoPercent = calculatedInitialValue !== 0 ? (profitOrLoss / calculatedInitialValue) * 100 : 0;
  const profitClass = profitOrLoss >= 0 ? 'profit-positive' : 'profit-negative';
  const arrowIcon = profitOrLoss >= 0 ? '▲' : '▼';

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


  return (
    <div className="modal-overlay">
      <div className="modal-content investment-detail-modal-content white-theme-modal"> 
        <div className="investment-detail-modal-header">
          <span className="modal-icon">{investment.icon || '⭐'}</span>
          <div className="modal-title-group">
            <h3>{investment.name}</h3>
            <span className="modal-subtitle">
              {getInvestmentTypeForDisplay(investment.type)} - {investment.entity || 'N/A'}
            </span>
          </div>
          <button onClick={onClose} className="close-modal-button">&times;</button>
        </div>

        <div className="investment-detail-modal-body">
          <section className="detail-section">
            <h4>Resumen de Tenencia</h4>
            <div className="detail-grid">
              <div className="detail-grid-item">
                <span className="label">Valor Actual:</span>
                <span className="value prominent">{formatCurrency(currentValue, investment.currency)}</span>
              </div>
              <div className="detail-grid-item">
                <span className="label">Gan./Pérdida:</span>
                <span className={`value ${profitClass}`}>{formatCurrency(profitOrLoss, investment.currency)}</span>
              </div>
              <div className="detail-grid-item">
                <span className="label">Rendimiento:</span>
                <span className={`value ${profitClass}`}>{calculatedInitialValue !== 0 ? `${arrowIcon} ${rendimientoPercent.toFixed(2)}%` : '---%'}</span>
              </div>
              <div className="detail-grid-item">
                <span className="label">Inversión Inicial:</span>
                <span className="value">{formatCurrency(calculatedInitialValue, investment.currency)}</span>
              </div>

              {(investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && (
                <>
                  <div className="detail-grid-item">
                    <span className="label">Cantidad:</span>
                    <span className="value">{quantityNum.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="detail-grid-item">
                    <span className="label">Precio Compra:</span>
                    <span className="value">{formatCurrency(purchasePriceNum, investment.currency)}</span>
                  </div>
                  <div className="detail-grid-item">
                    <span className="label">Precio Actual:</span>
                    <span className="value">{formatCurrency(currentPriceNum, investment.currency)}</span>
                  </div>
                </>
              )}
              {(investment.type === 'plazo_fijo' || (investment.type === 'fci' && interestRateNum > 0)) && (
                <>
                  {investment.type === 'plazo_fijo' && (
                    <>
                      <div className="detail-grid-item">
                        <span className="label">Fecha Inicio:</span>
                        <span className="value">{formatDateDMY(investment.startDate)}</span>
                      </div>
                      <div className="detail-grid-item">
                        <span className="label">Fecha Fin:</span>
                        <span className="value">{formatDateDMY(investment.endDate)}</span>
                      </div>
                    </>
                  )}
                  {interestRateNum > 0 && (
                    <div className="detail-grid-item">
                      <span className="label">TNA:</span>
                      <span className="value">{interestRateNum.toFixed(2)}%</span>
                    </div>
                  )}
                </>
              )}
              {investment.purchaseDate && (investment.type !== 'plazo_fijo') && (
                <div className="detail-grid-item">
                    <span className="label">Fecha Adq.:</span>
                    <span className="value">{formatDateDMY(investment.purchaseDate)}</span>
                </div>
              )}
            </div>
          </section>

          <div className="portfolio-chart-placeholder-main" style={{marginTop: '20px'}}>
            <p>(Gráfico de Rendimiento del Instrumento - Próximamente)</p>
          </div>

          {investment.notes && (
            <section className="detail-section notes-section">
              <h4>Notas Adicionales</h4>
              <p>{investment.notes}</p>
            </section>
          )}
        </div>

        <div className="investment-detail-modal-actions">
          <Link to={`/investments/edit/${investment.id}`} className="button button-secondary">
            Ir a Editar
          </Link>
          <button onClick={onClose} className="button button-primary">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailModal;