// Ruta: finanzas-app-pro/frontend/src/components/debtAndLoan/DebtAndLoanItem.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import debtAndLoanService from '../../services/debtAndLoan.service';
import './DebtAndLoanItem.css'; // Asegúrate que este CSS se actualice también

const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(year, parseInt(month,10) - 1, parseInt(day,10) ).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const DebtAndLoanItem = ({ item, onDelete, onPaymentRecorded }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Nuevo estado para la expansión

  let displayRemainingAmount;
  let progressBasedOn = parseFloat(item.totalAmount) || 0;

  if (item.type === 'loan' && item.isRepaidInInstallments && parseFloat(item.repaymentInstallmentAmount) > 0 && parseInt(item.repaymentTotalInstallments, 10) > 0) {
    const totalToReceive = parseFloat(item.repaymentInstallmentAmount) * parseInt(item.repaymentTotalInstallments, 10);
    displayRemainingAmount = totalToReceive - (parseFloat(item.paidAmount) || 0);
    progressBasedOn = totalToReceive;
  } else {
    displayRemainingAmount = (parseFloat(item.totalAmount) || 0) - (parseFloat(item.paidAmount) || 0);
  }
  
  const progress = progressBasedOn > 0 ? ((parseFloat(item.paidAmount) || 0) / progressBasedOn) * 100 : 0;

  let itemClass = item.type === 'debt' ? 'debt-item' : 'loan-item';
  if (item.status === 'completed') itemClass += ' completed';
  if (item.status === 'defaulted' || item.status === 'cancelled') itemClass += ` ${item.status}`;

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('El monto del pago debe ser mayor a cero.'); return;
    }
    let actualRemainingForWarning = displayRemainingAmount;
    if (item.type === 'loan' && item.isRepaidInInstallments) {
        actualRemainingForWarning = parseFloat(item.repaymentInstallmentAmount) || displayRemainingAmount;
    }
    if (parseFloat(paymentAmount) > actualRemainingForWarning && actualRemainingForWarning > 0) {
        if (!window.confirm(`El monto ingresado (${formatCurrency(paymentAmount, item.currency)}) es mayor al saldo/cuota pendiente (${formatCurrency(actualRemainingForWarning, item.currency)}). ¿Continuar?`)) {
            return;
        }
    }
    setPaymentError('');
    setIsSubmittingPayment(true);
    try {
      await debtAndLoanService.recordPayment(item.id, {
        paymentAmount: parseFloat(paymentAmount), paymentDate, paymentNotes,
      });
      setShowPaymentForm(false); setPaymentAmount(''); setPaymentNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      if (onPaymentRecorded) onPaymentRecorded(); 
    } catch (err) {
      setPaymentError(err.message || 'Error al registrar el pago.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };
  
  const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado',
        defaulted: 'Incumplido', cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  return (
    <div className={`item-card ${itemClass} ${isExpanded ? 'expanded' : ''}`}>
      <div className="item-summary-clickable" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-header">
          <span className="item-icon">{item.type === 'debt' ? '💸' : '💰'}</span>
          <h4 className="item-description">{item.description}</h4>
          <span className={`item-status status-${item.status}`}>{getStatusLabel(item.status)}</span>
          <span className="expand-indicator">{isExpanded ? '➖' : '➕'}</span>
        </div>
        <div className="item-body-summary">
          <p><strong>{item.type === 'debt' ? 'A:' : 'De:'}</strong> {item.personInvolved}</p>
          <p><strong>Restante:</strong> <span className={displayRemainingAmount <=0 ? 'text-success' : (item.type === 'debt' ? 'text-danger' : 'text-warning') }>{formatCurrency(displayRemainingAmount, item.currency)}</span></p>
          {progressBasedOn > 0 && item.status !== 'cancelled' && (
            <div className="progress-bar-container-dl">
              <div className={`progress-bar-dl ${item.status === 'completed' ? 'bg-completed' : ''}`} style={{ width: `${Math.min(progress, 100)}%` }}>
                {progress > 5 ? `${progress.toFixed(0)}%` : ''} {/* Mostrar % solo si hay espacio */}
              </div>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="item-body-detailed">
          {item.type === 'loan' && item.isRepaidInInstallments && parseFloat(item.repaymentInstallmentAmount) > 0 ? (
              <p><strong>Total a Recibir (cuotas):</strong> {formatCurrency(parseFloat(item.repaymentInstallmentAmount) * parseInt(item.repaymentTotalInstallments, 10), item.currency)}</p>
          ) : (
              <p><strong>Total Original:</strong> {formatCurrency(item.totalAmount, item.currency)}</p>
          )}
          <p><strong>{item.type === 'debt' ? 'Pagado:' : 'Recibido:'}</strong> {formatCurrency(item.paidAmount, item.currency)}</p>
          <p><strong>Fecha Inicial:</strong> {formatDate(item.initialDate)}</p>
          {item.dueDate && <p><strong>Fecha Vencimiento:</strong> {formatDate(item.dueDate)}</p>}

          {item.type === 'loan' && item.isMyCreditCardLoanToOther && (
            <div className="specific-details">
              <h5>Préstamo de Tarjeta (a Tercero)</h5>
              <p><strong>Cuotas a Recibir:</strong> {item.installmentsPaidByOther || 0} / {item.installmentsTotalForOther || 'N/A'}</p>
            </div>
          )}
          {item.type === 'loan' && item.isRepaidInInstallments && (
            <div className="specific-details">
              <h5>Préstamo Directo (Devolución en Cuotas)</h5>
              <p><strong>Monto por Cuota:</strong> {formatCurrency(item.repaymentInstallmentAmount, item.currency)}</p>
              <p><strong>Frecuencia:</strong> {item.repaymentFrequency || 'N/A'}</p>
              <p><strong>Cuotas Recibidas:</strong> {item.repaymentInstallmentsPaid || 0} / {item.repaymentTotalInstallments || 'N/A'}</p>
              <p><strong>Primera Devolución:</strong> {formatDate(item.firstRepaymentDate)}</p>
            </div>
          )}
          {item.nextExpectedPaymentDate && item.status !== 'completed' && item.status !== 'cancelled' && (
               <p><strong>Próx. Pago/Devolución Esperada:</strong> {formatDate(item.nextExpectedPaymentDate)} 
                  {item.nextExpectedPaymentAmount && ` - ${formatCurrency(item.nextExpectedPaymentAmount, item.currency)}`}
               </p>
          )}
          {item.notes && <p className="item-notes"><strong>Notas:</strong> {item.notes}</p>}
        
            <div className="item-actions">
                {item.status !== 'completed' && item.status !== 'cancelled' && (
                    <button 
                        onClick={() => {
                            setShowPaymentForm(!showPaymentForm);
                            if (item.type === 'loan' && item.isRepaidInInstallments && item.repaymentInstallmentAmount) {
                                setPaymentAmount((parseFloat(item.repaymentInstallmentAmount) || 0).toString());
                            } else if (displayRemainingAmount > 0) {
                                setPaymentAmount(displayRemainingAmount.toFixed(2));
                            } else {
                                setPaymentAmount(''); 
                            }
                            setPaymentError('');
                            setPaymentDate(new Date().toISOString().split('T')[0]);
                            setPaymentNotes('');
                        }} 
                        className="button button-small button-action"
                    >
                    {showPaymentForm ? 'Cancelar Registro' : (item.type === 'debt' ? 'Registrar Pago' : 'Registrar Cobro')}
                    </button>
                )}
                <Link to={`/debts-loans/edit/${item.id}`} className="button button-small button-edit">
                Editar
                </Link>
                <button onClick={() => onDelete(item.id)} className="button button-small button-delete">
                Eliminar
                </button>
            </div>

            {showPaymentForm && item.status !== 'completed' && item.status !== 'cancelled' && (
                <form onSubmit={handleRecordPaymentSubmit} className="payment-form">
                <h5>{item.type === 'debt' ? 'Registrar Pago Realizado' : 'Registrar Cobro Recibido'}</h5>
                {paymentError && <p className="error-message small-error">{paymentError}</p>}
                <div className="form-group">
                    <label htmlFor={`paymentAmount-${item.id}`}>Monto (*):</label>
                    <input type="number" id={`paymentAmount-${item.id}`} value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            step="0.01" min="0.01" required />
                </div>
                <div className="form-group">
                    <label htmlFor={`paymentDate-${item.id}`}>Fecha del Pago/Cobro (*):</label>
                    <input type="date" id={`paymentDate-${item.id}`} value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor={`paymentNotes-${item.id}`}>Notas del Pago/Cobro (Opcional):</label>
                    <textarea id={`paymentNotes-${item.id}`} value={paymentNotes} 
                                onChange={(e) => setPaymentNotes(e.target.value)} rows="2"></textarea>
                </div>
                <button type="submit" className="button button-primary button-small" disabled={isSubmittingPayment}>
                    {isSubmittingPayment ? 'Registrando...' : 'Confirmar'}
                </button>
                </form>
            )}
        </div> // Cierre de item-body-detailed
      )} 
    </div>
  );
};

export default DebtAndLoanItem;
