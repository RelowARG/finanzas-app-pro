// Ruta: finanzas-app-pro/frontend/src/components/recurring/RecurringTransactionItem.jsx
// ARCHIVO NUEVO
import React from 'react';
import { Link } from 'react-router-dom';
import './RecurringTransactionItem.css'; // Crearemos este CSS

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${value < 0 ? '-' : ''}${symbol} ${Math.abs(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const RecurringTransactionItem = ({ recurringTx, onDelete }) => {
  if (!recurringTx) {
    return null;
  }

  const amountClass = recurringTx.type === 'ingreso' ? 'amount-positive' : 'amount-negative';
  const frequencyLabels = {
    diaria: 'Diaria',
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
    bimestral: 'Bimestral',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
  };
  const daysOfWeekMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];


  return (
    <div className={`recurring-tx-card ${recurringTx.isActive ? 'active' : 'inactive'}`}>
      <div className="recurring-tx-card-header">
        <span className="recurring-tx-icon">{recurringTx.category?.icon || (recurringTx.type === 'ingreso' ? '💰' : '💸')}</span>
        <h4 className="recurring-tx-description">{recurringTx.description}</h4>
        <span className={`recurring-tx-status ${recurringTx.isActive ? 'status-active' : 'status-inactive'}`}>
          {recurringTx.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="recurring-tx-card-body">
        <div className="detail-item">
          <span className="detail-label">Monto:</span>
          <span className={`detail-value ${amountClass}`}>{formatCurrency(recurringTx.amount, recurringTx.currency)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Tipo:</span>
          <span className="detail-value type-badge">{recurringTx.type}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Cuenta:</span>
          <span className="detail-value">{recurringTx.account?.name || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Categoría:</span>
          <span className="detail-value">{recurringTx.category?.name || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Frecuencia:</span>
          <span className="detail-value">{frequencyLabels[recurringTx.frequency] || recurringTx.frequency}</span>
        </div>
        
        {recurringTx.frequency === 'semanal' && recurringTx.dayOfWeek !== null && (
          <div className="detail-item">
            <span className="detail-label">Día Semana:</span>
            <span className="detail-value">{daysOfWeekMap[recurringTx.dayOfWeek]}</span>
          </div>
        )}
        {(recurringTx.frequency === 'mensual' || recurringTx.frequency === 'quincenal' || recurringTx.frequency === 'bimestral' || recurringTx.frequency === 'trimestral' || recurringTx.frequency === 'semestral' || recurringTx.frequency === 'anual') && recurringTx.dayOfMonth && (
          <div className="detail-item">
            <span className="detail-label">Día del Mes:</span>
            <span className="detail-value">{recurringTx.dayOfMonth}</span>
          </div>
        )}

        <div className="detail-item">
          <span className="detail-label">Próxima Ejec.:</span>
          <span className="detail-value date-value">{formatDate(recurringTx.nextRunDate)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Inicia:</span>
          <span className="detail-value date-value">{formatDate(recurringTx.startDate)}</span>
        </div>
        {recurringTx.endDate && (
          <div className="detail-item">
            <span className="detail-label">Finaliza:</span>
            <span className="detail-value date-value">{formatDate(recurringTx.endDate)}</span>
          </div>
        )}
        {recurringTx.notes && (
            <div className="detail-item notes-item">
                <span className="detail-label">Notas:</span>
                <span className="detail-value notes-value">{recurringTx.notes}</span>
            </div>
        )}
      </div>

      <div className="recurring-tx-card-actions">
        <Link to={`/settings/recurring-transactions/edit/${recurringTx.id}`} className="button button-small button-edit">
          Editar
        </Link>
        <button onClick={() => onDelete(recurringTx.id)} className="button button-small button-delete">
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default RecurringTransactionItem;