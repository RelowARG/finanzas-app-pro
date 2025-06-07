// Ruta: /frontend/src/components/debtAndLoan/EditDebtAndLoanModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import debtAndLoanService from '../../services/debtAndLoan.service';
import { alertService } from '../../utils/alert.service';
import { formatCurrency } from '../../utils/formatters';
import './DebtAndLoanModal.css';

const EditDebtAndLoanModal = ({ isOpen, onClose, onDebtLoanUpdated, debtLoanData }) => {
  const [type, setType] = useState('debt');
  const [description, setDescription] = useState('');
  const [personInvolved, setPersonInvolved] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [initialDate, setInitialDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [isMyCreditCardLoanToOther, setIsMyCreditCardLoanToOther] = useState(false);
  const [installmentsTotalForOther, setInstallmentsTotalForOther] = useState('');
  const [installmentsPaidByOther, setInstallmentsPaidByOther] = useState('');
  const [isRepaidInInstallments, setIsRepaidInInstallments] = useState(false);
  const [repaymentInstallmentAmount, setRepaymentInstallmentAmount] = useState('');
  const [repaymentTotalInstallments, setRepaymentTotalInstallments] = useState('');
  const [repaymentInstallmentsPaid, setRepaymentInstallmentsPaid] = useState('');
  const [repaymentFrequency, setRepaymentFrequency] = useState('monthly');
  const [firstRepaymentDate, setFirstRepaymentDate] = useState('');
  const [nextExpectedPaymentDate, setNextExpectedPaymentDate] = useState('');
  const [nextExpectedPaymentAmount, setNextExpectedPaymentAmount] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];
  const repaymentFrequencyOptions = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'weekly', label: 'Semanal' },
  ];
  const statusOptions = [ 
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completado' },
    { value: 'defaulted', label: 'Incumplido' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const populateForm = useCallback((data) => {
    if (!data) return;
    setType(data.type);
    setDescription(data.description || '');
    setPersonInvolved(data.personInvolved || '');
    setTotalAmount(data.totalAmount ? data.totalAmount.toString() : '');
    setPaidAmount(data.paidAmount ? data.paidAmount.toString() : '0');
    setCurrency(data.currency || 'ARS');
    setInitialDate(data.initialDate ? data.initialDate.split('T')[0] : '');
    setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
    setStatus(data.status || 'pending');
    setNotes(data.notes || '');
    setIsMyCreditCardLoanToOther(data.isMyCreditCardLoanToOther || false);
    setInstallmentsTotalForOther(data.installmentsTotalForOther ? data.installmentsTotalForOther.toString() : '');
    setInstallmentsPaidByOther(data.installmentsPaidByOther ? data.installmentsPaidByOther.toString() : '0');
    setIsRepaidInInstallments(data.isRepaidInInstallments || false);
    setRepaymentInstallmentAmount(data.repaymentInstallmentAmount ? data.repaymentInstallmentAmount.toString() : '');
    setRepaymentTotalInstallments(data.repaymentTotalInstallments ? data.repaymentTotalInstallments.toString() : '');
    setRepaymentInstallmentsPaid(data.repaymentInstallmentsPaid ? data.repaymentInstallmentsPaid.toString() : '0');
    setRepaymentFrequency(data.repaymentFrequency || 'monthly');
    setFirstRepaymentDate(data.firstRepaymentDate ? data.firstRepaymentDate.split('T')[0] : '');
    setNextExpectedPaymentDate(data.nextExpectedPaymentDate ? data.nextExpectedPaymentDate.split('T')[0] : '');
    setNextExpectedPaymentAmount(data.nextExpectedPaymentAmount ? data.nextExpectedPaymentAmount.toString() : '');
  }, []);

  useEffect(() => {
    if (isOpen && debtLoanData) {
      populateForm(debtLoanData);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, debtLoanData, populateForm]);

  useEffect(() => {
    if (type === 'debt') {
      setIsMyCreditCardLoanToOther(false);
      setIsRepaidInInstallments(false);
    }
    if (!isMyCreditCardLoanToOther) setInstallmentsTotalForOther('');
    if (!isRepaidInInstallments) {
      setRepaymentInstallmentAmount('');
      setRepaymentTotalInstallments('');
      setRepaymentFrequency('monthly');
      setFirstRepaymentDate('');
    }
  }, [type, isMyCreditCardLoanToOther, isRepaidInInstallments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    if (!description.trim() || !personInvolved.trim() || !totalAmount || !initialDate) {
      setError('Descripción, persona, monto total y fecha inicial son requeridos.');
      return;
    }
    setIsSubmitting(true);
    const dataToUpdate = {
      description: description.trim(),
      personInvolved: personInvolved.trim(),
      totalAmount: parseFloat(totalAmount),
      currency, initialDate, dueDate: dueDate || null, status, 
      notes: notes.trim(),
      isMyCreditCardLoanToOther: type === 'loan' ? isMyCreditCardLoanToOther : false,
      installmentsTotalForOther: (type === 'loan' && isMyCreditCardLoanToOther) ? parseInt(installmentsTotalForOther, 10) : null,
      installmentsPaidByOther: (type === 'loan' && isMyCreditCardLoanToOther) ? parseInt(installmentsPaidByOther, 10) || 0 : null,
      isRepaidInInstallments: type === 'loan' ? isRepaidInInstallments : false,
      repaymentInstallmentAmount: (type === 'loan' && isRepaidInInstallments) ? parseFloat(repaymentInstallmentAmount) : null,
      repaymentTotalInstallments: (type === 'loan' && isRepaidInInstallments) ? parseInt(repaymentTotalInstallments, 10) : null,
      repaymentInstallmentsPaid: (type === 'loan' && isRepaidInInstallments) ? parseInt(repaymentInstallmentsPaid, 10) || 0 : null,
      repaymentFrequency: (type === 'loan' && isRepaidInInstallments) ? repaymentFrequency : null,
      firstRepaymentDate: (type === 'loan' && isRepaidInInstallments) ? (firstRepaymentDate || null) : null,
      nextExpectedPaymentDate: nextExpectedPaymentDate || null,
      nextExpectedPaymentAmount: nextExpectedPaymentAmount ? parseFloat(nextExpectedPaymentAmount) : null,
    };
    try {
      await debtAndLoanService.updateDebtAndLoan(debtLoanData.id, dataToUpdate);
      alertService.showSuccessToast('Registro Actualizado');
      onDebtLoanUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm debt-loan-modal-content">
        <div className="modal-header-atm">
          <h3>Editar Registro</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm">
          {error && <p className="error-message small-error-atm">{error}</p>}
          
          <div className="form-group">
              <label>Tipo de Registro (No editable):</label>
              <input type="text" value={type === 'debt' ? 'Deuda (Yo debo)' : 'Préstamo (Me deben)'} disabled style={{backgroundColor: '#e9ecef'}} />
          </div>
          <div className="form-group">
            <label htmlFor="edit-desc">Descripción (*):</label>
            <input type="text" id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-person">{type === 'debt' ? 'A Quién Debo (*):' : 'Quién Me Debe (*):'}</label>
            <input type="text" id="edit-person" value={personInvolved} onChange={(e) => setPersonInvolved(e.target.value)} required />
          </div>
          <div className="form-grid-halves">
            <div className="form-group"><label htmlFor="edit-totalAmount">Monto Total Original (*):</label><input type="number" id="edit-totalAmount" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} step="0.01" required /></div>
            <div className="form-group"><label htmlFor="edit-currency">Moneda (*):</label><select id="edit-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
          </div>
          <div className="form-group">
              <label>Monto Pagado/Recibido (Informativo):</label>
              <input type="text" value={formatCurrency(paidAmount, currency)} disabled style={{backgroundColor: '#e9ecef'}} />
              <small>Para registrar un pago/cobro, usa el botón correspondiente en la lista principal.</small>
          </div>
          <div className="form-grid-halves">
            <div className="form-group"><label htmlFor="edit-initialDate">Fecha Inicial (*):</label><input type="date" id="edit-initialDate" value={initialDate} onChange={(e) => setInitialDate(e.target.value)} required /></div>
            <div className="form-group"><label htmlFor="edit-dueDate">Fecha Vencimiento (Opcional):</label><input type="date" id="edit-dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="form-group"><label htmlFor="edit-status">Estado (*):</label><select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>{statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>

          {type === 'loan' && (
            <>
              <hr className="form-separator" />
              <h4>Detalles Específicos del Préstamo</h4>
              <div className="form-section">
                <h5>Opción 1: Préstamo de tu Tarjeta a Tercero</h5>
                <div className="form-group"><label htmlFor="edit-isMyCreditCardLoanToOther" className="checkbox-label"><input type="checkbox" id="edit-isMyCreditCardLoanToOther" checked={isMyCreditCardLoanToOther} onChange={(e) => setIsMyCreditCardLoanToOther(e.target.checked)} />¿Es un préstamo de tu tarjeta de crédito a otra persona?</label></div>
                {isMyCreditCardLoanToOther && (<div className="form-grid-halves"><div className="form-group"><label htmlFor="edit-installmentsTotalForOther">Total de Cuotas que te devolverá (*):</label><input type="number" id="edit-installmentsTotalForOther" value={installmentsTotalForOther} onChange={(e) => setInstallmentsTotalForOther(e.target.value)} min="1" required={isMyCreditCardLoanToOther} /></div><div className="form-group"><label htmlFor="edit-installmentsPaidByOther">Cuotas ya devueltas:</label><input type="number" id="edit-installmentsPaidByOther" value={installmentsPaidByOther} onChange={(e) => setInstallmentsPaidByOther(e.target.value)} min="0" /></div></div>)}
              </div>
              <div className="form-section">
                <h5>Opción 2: Préstamo Directo (Devolución en Cuotas)</h5>
                <div className="form-group"><label htmlFor="edit-isRepaidInInstallments" className="checkbox-label"><input type="checkbox" id="edit-isRepaidInInstallments" checked={isRepaidInInstallments} onChange={(e) => setIsRepaidInInstallments(e.target.checked)} />¿Este préstamo te lo devolverán en cuotas?</label></div>
                {isRepaidInInstallments && (<> <div className="form-grid-thirds"><div className="form-group"><label htmlFor="edit-repaymentInstallmentAmount">Monto de Cada Cuota (*):</label><input type="number" id="edit-repaymentInstallmentAmount" value={repaymentInstallmentAmount} onChange={(e) => setRepaymentInstallmentAmount(e.target.value)} step="0.01" required={isRepaidInInstallments} /></div><div className="form-group"><label htmlFor="edit-repaymentTotalInstallments">Total de Cuotas (*):</label><input type="number" id="edit-repaymentTotalInstallments" value={repaymentTotalInstallments} onChange={(e) => setRepaymentTotalInstallments(e.target.value)} min="1" required={isRepaidInInstallments} /></div><div className="form-group"><label htmlFor="edit-repaymentFrequency">Frecuencia (*):</label><select id="edit-repaymentFrequency" value={repaymentFrequency} onChange={(e) => setRepaymentFrequency(e.target.value)} required={isRepaidInInstallments}>{repaymentFrequencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div></div><div className="form-grid-halves"><div className="form-group"><label htmlFor="edit-firstRepaymentDate">Fecha de 1ra Devolución (*):</label><input type="date" id="edit-firstRepaymentDate" value={firstRepaymentDate} onChange={(e) => setFirstRepaymentDate(e.target.value)} required={isRepaidInInstallments} /></div><div className="form-group"><label htmlFor="edit-repaymentInstallmentsPaid">Cuotas ya Recibidas:</label><input type="number" id="edit-repaymentInstallmentsPaid" value={repaymentInstallmentsPaid} onChange={(e) => setRepaymentInstallmentsPaid(e.target.value)} min="0" /></div></div></>)}
              </div>
              <div className="form-section">
                <h5>Próximo Vencimiento (General)</h5>
                 <div className="form-grid-halves"><div className="form-group"><label htmlFor="edit-nextExpectedPaymentDateLoan">Próx. Fecha Esperada:</label><input type="date" id="edit-nextExpectedPaymentDateLoan" value={nextExpectedPaymentDate} onChange={(e) => setNextExpectedPaymentDate(e.target.value)} /></div><div className="form-group"><label htmlFor="edit-nextExpectedPaymentAmountLoan">Monto Esperado:</label><input type="number" id="edit-nextExpectedPaymentAmountLoan" value={nextExpectedPaymentAmount} onChange={(e) => setNextExpectedPaymentAmount(e.target.value)} step="0.01" /></div></div>
              </div>
            </>
          )}

          <div className="form-group" style={{marginTop: '20px'}}><label htmlFor="edit-notes">Notas (Opcional):</label><textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea></div>

          <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDebtAndLoanModal;