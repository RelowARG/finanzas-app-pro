// Ruta: finanzas-app-pro/frontend/src/pages/EditDebtAndLoanPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import debtAndLoanService from '../services/debtAndLoan.service';
import './AddDebtAndLoanPage.css'; // Reutilizamos estilos

// Definir formatCurrency aquí
const formatCurrency = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const EditDebtAndLoanPage = () => {
  const navigate = useNavigate();
  const { debtLoanId } = useParams(); 

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

  const [originalData, setOriginalData] = useState(null); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); 
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
    setOriginalData(data);
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
    const loadDebtLoanData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await debtAndLoanService.getDebtAndLoanById(debtLoanId);
        if (data) {
          populateForm(data);
        } else {
          setError('Registro no encontrado.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar el registro.');
        console.error("Error fetching debt/loan for edit:", err);
      } finally {
        setLoading(false);
      }
    };
    if (debtLoanId) {
      loadDebtLoanData();
    }
  }, [debtLoanId, populateForm]);

   useEffect(() => {
    if (loading) return; 

    if (type === 'debt') {
      setIsMyCreditCardLoanToOther(false);
      setIsRepaidInInstallments(false);
      if (originalData && originalData.type === 'loan' && type === 'debt') {
        setInstallmentsTotalForOther('');
        setInstallmentsPaidByOther('0');
        setRepaymentInstallmentAmount('');
        setRepaymentTotalInstallments('');
        setRepaymentInstallmentsPaid('0');
        setRepaymentFrequency('monthly');
        setFirstRepaymentDate('');
      }
    } else { 
      if (!isMyCreditCardLoanToOther && originalData && originalData.isMyCreditCardLoanToOther && type === 'loan') {
        // setInstallmentsTotalForOther(''); // No resetear si solo se desmarcó
        // setInstallmentsPaidByOther('0');
      }
      if (!isRepaidInInstallments && originalData && originalData.isRepaidInInstallments && type === 'loan') {
        // setRepaymentInstallmentAmount('');
        // setRepaymentTotalInstallments('');
        // setRepaymentInstallmentsPaid('0');
        // setRepaymentFrequency('monthly');
        // setFirstRepaymentDate('');
      }
    }
  }, [type, isMyCreditCardLoanToOther, isRepaidInInstallments, loading, originalData]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 

    if (!description.trim() || !personInvolved.trim() || !totalAmount || !initialDate) {
      setError('Descripción, persona, monto total y fecha inicial son requeridos.');
      return;
    }
    if (type === 'loan' && isMyCreditCardLoanToOther && (!installmentsTotalForOther || parseInt(installmentsTotalForOther, 10) <=0 ) ) {
        setError('Si es un préstamo de tarjeta, especifica el total de cuotas a recibir (mayor a cero).');
        return;
    }
    if (type === 'loan' && isRepaidInInstallments) {
        if(!repaymentInstallmentAmount || parseFloat(repaymentInstallmentAmount) <= 0) {
            setError('Para préstamos con devolución en cuotas, el monto de cada cuota es requerido.'); return;
        }
        if(!repaymentTotalInstallments || parseInt(repaymentTotalInstallments, 10) <= 0) {
            setError('Para préstamos con devolución en cuotas, el total de cuotas es requerido.'); return;
        }
        if(!firstRepaymentDate) {
            setError('Para préstamos con devolución en cuotas, la fecha de la primera devolución es requerida.'); return;
        }
    }

    setIsSubmitting(true);

    const dataToUpdate = {
      description: description.trim(),
      personInvolved: personInvolved.trim(),
      totalAmount: parseFloat(totalAmount),
      currency,
      initialDate,
      dueDate: dueDate || null,
      status, 
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
      await debtAndLoanService.updateDebtAndLoan(debtLoanId, dataToUpdate);
      navigate('/debts-loans');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el registro.');
      console.error("Error updating debt/loan:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Esta función ahora usa la `formatCurrency` definida al inicio del archivo
  const formatCurrencyForDisplay = (amountStr, currencyStr) => {
    const num = parseFloat(amountStr);
    if (isNaN(num)) return formatCurrency(0, currencyStr); // Muestra $0.00 si no es un número
    return formatCurrency(num, currencyStr);
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos del registro...</p></div>;
  }
  if (error && !originalData) { 
     return (
        <div className="page-container">
            <p className="error-message">{error}</p> 
            <Link to="/debts-loans" className="button button-secondary">Volver</Link> 
        </div>
    );
  }

  return (
    <div className="page-container add-debt-loan-page"> 
      <div className="form-container" style={{ maxWidth: '750px' }}>
        <h2>Editar Registro: {originalData?.description || 'Deuda/Préstamo'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

            <div className="form-group">
                <label htmlFor="typeDisplay">Tipo de Registro:</label>
                <input 
                    type="text" 
                    id="typeDisplay" 
                    value={type === 'debt' ? 'Deuda (Yo debo)' : 'Préstamo (Me deben)'} 
                    disabled 
                    style={{backgroundColor: '#e9ecef', cursor: 'not-allowed'}}
                />
            </div>

          <div className="form-group">
            <label htmlFor="description">Descripción (*):</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="personInvolved">{type === 'debt' ? 'A Quién Debo (*):' : 'Quién Me Debe / A Quién Presté (*):'}</label>
            <input type="text" id="personInvolved" value={personInvolved} onChange={(e) => setPersonInvolved(e.target.value)} required />
          </div>
          
          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="totalAmount">Monto Total Original (*):</label>
              <input type="number" id="totalAmount" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} step="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Moneda (*):</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>
           <div className="form-group">
                <label htmlFor="paidAmountDisplay">Monto Pagado/Recibido (informativo):</label>
                <input type="text" id="paidAmountDisplay" value={formatCurrencyForDisplay(paidAmount, currency)} disabled style={{backgroundColor: '#e9ecef'}}/>
                <small>Para registrar un nuevo pago/cobro, usa el botón en la lista principal.</small>
            </div>

          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="initialDate">Fecha Inicial (Origen) (*):</label>
              <input type="date" id="initialDate" value={initialDate} onChange={(e) => setInitialDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Fecha de Vencimiento (Opcional):</label>
              <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
           <div className="form-group">
            <label htmlFor="status">Estado (*):</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          {type === 'loan' && (
            <>
              <hr className="form-separator" />
              <h4>Detalles Específicos del Préstamo</h4>
              
              <div className="form-section">
                <h5>Opción 1: Préstamo de tu Tarjeta de Crédito a un Tercero</h5>
                <div className="form-group">
                  <label htmlFor="isMyCreditCardLoanToOther" className="checkbox-label">
                    <input type="checkbox" id="isMyCreditCardLoanToOther" checked={isMyCreditCardLoanToOther}
                           onChange={(e) => setIsMyCreditCardLoanToOther(e.target.checked)} />
                    ¿Es un préstamo de tu tarjeta de crédito a otra persona?
                  </label>
                </div>
                {isMyCreditCardLoanToOther && (
                  <div className="form-grid-halves">
                    <div className="form-group">
                    <label htmlFor="installmentsTotalForOther">Total de Cuotas que te devolverá (*):</label>
                    <input type="number" id="installmentsTotalForOther" value={installmentsTotalForOther}
                            onChange={(e) => setInstallmentsTotalForOther(e.target.value)}
                            placeholder="Ej: 3" min="1" required={isMyCreditCardLoanToOther} />
                    </div>
                    <div className="form-group">
                    <label htmlFor="installmentsPaidByOther">Cuotas ya devueltas por el tercero:</label>
                    <input type="number" id="installmentsPaidByOther" value={installmentsPaidByOther}
                            onChange={(e) => setInstallmentsPaidByOther(e.target.value)}
                            placeholder="Ej: 0" min="0" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h5>Opción 2: Préstamo Directo de Dinero (Devolución en Cuotas)</h5>
                <div className="form-group">
                  <label htmlFor="isRepaidInInstallments" className="checkbox-label">
                    <input type="checkbox" id="isRepaidInInstallments" checked={isRepaidInInstallments}
                           onChange={(e) => setIsRepaidInInstallments(e.target.checked)} />
                    ¿Este préstamo te lo devolverán en cuotas?
                  </label>
                </div>
                {isRepaidInInstallments && (
                  <>
                    <div className="form-grid-thirds">
                        <div className="form-group">
                        <label htmlFor="repaymentInstallmentAmount">Monto de Cada Cuota de Devolución (*):</label>
                        <input type="number" id="repaymentInstallmentAmount" value={repaymentInstallmentAmount}
                                onChange={(e) => setRepaymentInstallmentAmount(e.target.value)}
                                step="0.01" placeholder="Ej: 55000" required={isRepaidInInstallments} />
                        </div>
                        <div className="form-group">
                        <label htmlFor="repaymentTotalInstallments">Total de Cuotas de Devolución (*):</label>
                        <input type="number" id="repaymentTotalInstallments" value={repaymentTotalInstallments}
                                onChange={(e) => setRepaymentTotalInstallments(e.target.value)}
                                placeholder="Ej: 3" min="1" required={isRepaidInInstallments} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="repaymentFrequency">Frecuencia de Devolución (*):</label>
                            <select id="repaymentFrequency" value={repaymentFrequency} 
                                    onChange={(e) => setRepaymentFrequency(e.target.value)} required={isRepaidInInstallments}>
                                {repaymentFrequencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                        </div>
                    </div>
                     <div className="form-grid-halves">
                        <div className="form-group">
                        <label htmlFor="firstRepaymentDate">Fecha de la Primera Devolución (*):</label>
                        <input type="date" id="firstRepaymentDate" value={firstRepaymentDate}
                                onChange={(e) => setFirstRepaymentDate(e.target.value)} required={isRepaidInInstallments} />
                        </div>
                        <div className="form-group">
                        <label htmlFor="repaymentInstallmentsPaid">Cuotas de Devolución ya Recibidas:</label>
                        <input type="number" id="repaymentInstallmentsPaid" value={repaymentInstallmentsPaid}
                                onChange={(e) => setRepaymentInstallmentsPaid(e.target.value)}
                                placeholder="Ej: 0" min="0" />
                        </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="form-section">
                <h5>Próximo Pago/Devolución Esperada (General)</h5>
                 <div className="form-grid-halves">
                    <div className="form-group">
                        <label htmlFor="nextExpectedPaymentDateLoan">Próxima Fecha de Devolución Esperada (Opcional):</label>
                        <input type="date" id="nextExpectedPaymentDateLoan" value={nextExpectedPaymentDate} onChange={(e) => setNextExpectedPaymentDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nextExpectedPaymentAmountLoan">Monto de Devolución Esperada (Opcional):</label>
                        <input type="number" id="nextExpectedPaymentAmountLoan" value={nextExpectedPaymentAmount} onChange={(e) => setNextExpectedPaymentAmount(e.target.value)} step="0.01" placeholder="Monto total o parcial"/>
                    </div>
                </div>
              </div>
            </>
          )}

          <div className="form-group" style={{marginTop: '20px'}}>
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/debts-loans')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDebtAndLoanPage;
