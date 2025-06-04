// Ruta: finanzas-app-pro/frontend/src/components/recurring/RecurringTransactionItem.jsx
import React from 'react';
// import { Link } from 'react-router-dom'; // Ya no se usa Link para editar
import { formatDateDMY, formatCurrency } from '../../utils/formatters';
import './RecurringTransactionItem.css';

// *** AÑADIR onEdit COMO PROP ***
const RecurringTransactionItem = ({ transaction, onDelete, onToggleActive, onProcessNow, onEdit }) => {
  const {
    id, description, amount, currency, type, frequency,
    nextRunDate, lastRunDate, isActive, notes, account, category, icon
  } = transaction;

  const amountColor = type === 'ingreso' ? 'amount-positive' : 'amount-negative';
  const defaultIcon = type === 'ingreso' ? '💰' : '💸';
  const displayIcon = icon || category?.icon || defaultIcon;

  const handleToggle = () => {
    if (onToggleActive) onToggleActive(id, !isActive);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(id);
  };

  const handleProcessNow = () => {
    if (onProcessNow) onProcessNow(id);
  };

  // *** NUEVO MANEJADOR PARA EDITAR ***
  const handleEdit = () => {
    if (onEdit) onEdit(transaction); // Pasar el objeto completo de la transacción
  };

  const canProcessNow = isActive;

  return (
    <div className={`recurring-item ${!isActive ? 'inactive' : ''} ${type}`}>
      <div className="recurring-item-header">
        <span className="recurring-item-icon">{displayIcon}</span>
        <h3 className="recurring-item-description">{description}</h3>
        <span className={`recurring-item-amount ${amountColor}`}>
          {formatCurrency(Math.abs(amount), currency)}
        </span>
      </div>
      <div className="recurring-item-details">
        <p><strong>Tipo:</strong> <span className={`type-label type-${type}`}>{type}</span></p>
        <p><strong>Frecuencia:</strong> {frequency}</p>
        {nextRunDate && <p><strong>Próx. Ejec.:</strong> {formatDateDMY(nextRunDate)}</p>}
        {lastRunDate && <p><strong>Últ. Ejec.:</strong> {formatDateDMY(lastRunDate)}</p>}
        <p><strong>Cuenta:</strong> {account?.name || 'N/A'}</p>
        <p><strong>Categoría:</strong> {category?.name || 'N/A'}</p>
        {notes && <p className="recurring-item-notes"><strong>Notas:</strong> {notes}</p>}
        <p>
            <strong>Estado: </strong> 
            <span onClick={handleToggle} className={`status-toggle ${isActive ? 'active' : 'inactive'}`} role="button" tabIndex="0" aria-pressed={isActive}>
                {isActive ? 'Activo' : 'Inactivo'} (click para cambiar)
            </span>
        </p>
      </div>
      <div className="recurring-item-actions">
        {/* *** BOTÓN DE EDITAR MODIFICADO *** */}
        <button onClick={handleEdit} className="button button-edit button-small">
          Editar
        </button>
        <button onClick={handleDelete} className="button button-danger button-small">
          Eliminar
        </button>
        <button 
            onClick={handleProcessNow} 
            className="button button-secondary button-small"
            disabled={!canProcessNow}
            title={!canProcessNow ? "Activa el movimiento para registrarlo" : "Registra este movimiento ahora"}
        >
          Registrar Ahora
        </button>
      </div>
    </div>
  );
};

export default RecurringTransactionItem;