// Ruta: /frontend/src/components/debtAndLoan/AddDebtAndLoanModal.jsx
import React, { useState, useEffect } from 'react';
import debtAndLoanService from '../../services/debtAndLoan.service';
import { alertService } from '../../utils/alert.service';
import './DebtAndLoanModal.css';

const AddDebtAndLoanModal = ({ isOpen, onClose, onDebtLoanCreated }) => {
  const [type, setType] = useState('debt');
  const [description, setDescription] = useState('');
  const [personInvolved, setPersonInvolved] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [initialDate, setInitialDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isMyCreditCardLoanToOther, setIsMyCreditCardLoanToOther] = useState(false);
  const [installmentsTotalForOther, setInstallmentsTotalForOther] = useState('');
  const [isRepaidInInstallments, setIsRepaidInInstallments] = useState(false);
  const [repaymentInstallmentAmount, setRepaymentInstallmentAmount] = useState('');
  const [repaymentTotalInstallments, setRepaymentTotalInstallments] = useState('');
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

  useEffect(() => {
    if (isOpen) {
      setType('debt');
      setDescription('');
      setPersonInvolved('');
      setTotalAmount('');
      setCurrency('ARS');
      setInitialDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setNotes('');
      setIsMyCreditCardLoanToOther(false);
      setInstallmentsTotalForOther('');
      setIsRepaidInInstallments(false);
      setRepaymentInstallmentAmount('');
      setRepaymentTotalInstallments('');
      setRepaymentFrequency('monthly');
      setFirstRepaymentDate('');
      setNextExpectedPaymentDate('');
      setNextExpectedPaymentAmount('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    // ... (otras validaciones que tenías en la página)
    setIsSubmitting(true);
    const data = {
      type, description: description.trim(), personInvolved: personInvolved.trim(),
      totalAmount: parseFloat(totalAmount), currency, initialDate, dueDate: dueDate || null,
      notes: notes.trim(), isMyCreditCardLoanToOther: type === 'loan' ? isMyCreditCardLoanToOther : false,
      installmentsTotalForOther: (type === 'loan' && isMyCreditCardLoanToOther) ? parseInt(installmentsTotalForOther, 10) : null,
      isRepaidInInstallments: type === 'loan' ? isRepaidInInstallments : false,
      repaymentInstallmentAmount: (type === 'loan' && isRepaidInInstallments) ? parseFloat(repaymentInstallmentAmount) : null,
      repaymentTotalInstallments: (type === 'loan' && isRepaidInInstallments) ? parseInt(repaymentTotalInstallments, 10) : null,
      repaymentFrequency: (type === 'loan' && isRepaidInInstallments) ? repaymentFrequency : null,
      firstRepaymentDate: (type === 'loan' && isRepaidInInstallments) ? (firstRepaymentDate || null) : null,
      nextExpectedPaymentAmount: (type === 'loan' && isRepaidInInstallments && repaymentInstallmentAmount) ? parseFloat(repaymentInstallmentAmount) : (nextExpectedPaymentAmount ? parseFloat(nextExpectedPaymentAmount) : null),
      nextExpectedPaymentDate: (type === 'loan' && isRepaidInInstallments && firstRepaymentDate) ? firstRepaymentDate : (nextExpectedPaymentDate || null),
    };

    try {
      await debtAndLoanService.createDebtAndLoan(data);
      alertService.showSuccessToast('Registro Creado');
      onDebtLoanCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm debt-loan-modal-content">
        <div className="modal-header-atm">
          <h3>Nuevo Registro de Deuda/Préstamo</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm">
          {error && <p className="error-message small-error-atm">{error}</p>}
          {/* Aquí va todo el JSX del formulario que tenías en AddDebtAndLoanPage.jsx */}
          <div className="form-group">
            <label htmlFor="type">Tipo de Registro (*):</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value) }>
              <option value="debt">Deuda (Yo debo a alguien)</option>
              <option value="loan">Préstamo (Alguien me debe / Yo presté)</option>
            </select>
          </div>

           {/* ... Resto de los campos del formulario ... */}

           <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebtAndLoanModal;