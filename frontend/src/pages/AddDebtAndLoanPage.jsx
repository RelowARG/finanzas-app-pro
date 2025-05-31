// Ruta: finanzas-app-pro/frontend/src/pages/AddDebtAndLoanPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import debtAndLoanService from '../services/debtAndLoan.service';
import './AddDebtAndLoanPage.css'; 

const AddDebtAndLoanPage = () => {
  const navigate = useNavigate();

  const [type, setType] = useState('debt'); 
  const [description, setDescription] = useState('');
  const [personInvolved, setPersonInvolved] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [initialDate, setInitialDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Para "Presté mi tarjeta a Gabi"
  const [isMyCreditCardLoanToOther, setIsMyCreditCardLoanToOther] = useState(false);
  const [installmentsTotalForOther, setInstallmentsTotalForOther] = useState('');

  // Para "Presté $X y me devuelven $Y en Z cuotas"
  const [isRepaidInInstallments, setIsRepaidInInstallments] = useState(false);
  const [repaymentInstallmentAmount, setRepaymentInstallmentAmount] = useState('');
  const [repaymentTotalInstallments, setRepaymentTotalInstallments] = useState('');
  const [repaymentFrequency, setRepaymentFrequency] = useState('monthly');
  const [firstRepaymentDate, setFirstRepaymentDate] = useState('');
  
  // Para el caso de un préstamo con devolución única o para la primera cuota de un préstamo en cuotas
  const [nextExpectedPaymentDate, setNextExpectedPaymentDate] = useState(''); // Asegurar que este estado esté declarado
  const [nextExpectedPaymentAmount, setNextExpectedPaymentAmount] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
  ];
  const repaymentFrequencyOptions = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'weekly', label: 'Semanal' },
  ];

  // useEffect para resetear campos condicionales cuando cambia el tipo o las opciones de préstamo
  useEffect(() => {
    if (type === 'debt') {
      setIsMyCreditCardLoanToOther(false);
      setInstallmentsTotalForOther('');
      setIsRepaidInInstallments(false);
      setRepaymentInstallmentAmount('');
      setRepaymentTotalInstallments('');
      setRepaymentFrequency('monthly');
      setFirstRepaymentDate('');
      setNextExpectedPaymentAmount('');
      setNextExpectedPaymentDate(''); // Resetear también este campo
    } else { // type === 'loan'
      if (!isMyCreditCardLoanToOther) {
        setInstallmentsTotalForOther('');
      }
      if (!isRepaidInInstallments) {
        setRepaymentInstallmentAmount('');
        setRepaymentTotalInstallments('');
        setRepaymentFrequency('monthly');
        setFirstRepaymentDate('');
        // No necesariamente reseteamos nextExpectedPaymentDate/Amount aquí,
        // ya que podrían ser para un préstamo de pago único si AMBAS opciones de cuotas están desactivadas.
      }
    }
  }, [type, isMyCreditCardLoanToOther, isRepaidInInstallments]);


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

    setLoading(true);

    const data = {
      type,
      description: description.trim(),
      personInvolved: personInvolved.trim(),
      totalAmount: parseFloat(totalAmount),
      currency,
      initialDate,
      dueDate: dueDate || null,
      notes: notes.trim(),
      
      isMyCreditCardLoanToOther: type === 'loan' ? isMyCreditCardLoanToOther : false,
      installmentsTotalForOther: (type === 'loan' && isMyCreditCardLoanToOther) ? parseInt(installmentsTotalForOther, 10) : null,
      
      isRepaidInInstallments: type === 'loan' ? isRepaidInInstallments : false,
      repaymentInstallmentAmount: (type === 'loan' && isRepaidInInstallments) ? parseFloat(repaymentInstallmentAmount) : null,
      repaymentTotalInstallments: (type === 'loan' && isRepaidInInstallments) ? parseInt(repaymentTotalInstallments, 10) : null,
      repaymentFrequency: (type === 'loan' && isRepaidInInstallments) ? repaymentFrequency : null,
      firstRepaymentDate: (type === 'loan' && isRepaidInInstallments) ? (firstRepaymentDate || null) : null,
      
      // Lógica para nextExpectedPaymentDate y nextExpectedPaymentAmount
      nextExpectedPaymentAmount: (type === 'loan' && isRepaidInInstallments && repaymentInstallmentAmount) 
                                    ? parseFloat(repaymentInstallmentAmount) 
                                    : (nextExpectedPaymentAmount ? parseFloat(nextExpectedPaymentAmount) : null),
      nextExpectedPaymentDate: (type === 'loan' && isRepaidInInstallments && firstRepaymentDate)
                                    ? firstRepaymentDate
                                    : (nextExpectedPaymentDate || null), // Esta es la línea que daba error (aprox. 261)
    };

    try {
      await debtAndLoanService.createDebtAndLoan(data);
      navigate('/debts-loans');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el registro.');
      console.error("Error creating debt/loan:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container add-debt-loan-page">
      <div className="form-container" style={{ maxWidth: '750px' }}>
        <h2>Nuevo Registro de Deuda o Préstamo</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="type">Tipo de Registro (*):</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value) }>
              <option value="debt">Deuda (Yo debo a alguien)</option>
              <option value="loan">Préstamo (Alguien me debe / Yo presté)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción (*):</label>
            <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required 
                   placeholder={type === 'debt' ? "Ej: Préstamo de Mamá para viaje" : "Ej: Préstamo a Gabi para compra"}/>
          </div>

          <div className="form-group">
            <label htmlFor="personInvolved">{type === 'debt' ? 'A Quién Debo (*):' : 'Quién Me Debe / A Quién Presté (*):'}</label>
            <input type="text" id="personInvolved" value={personInvolved} onChange={(e) => setPersonInvolved(e.target.value)} required 
                   placeholder="Ej: Mamá, Gabi, Banco X"/>
          </div>
          
          <div className="form-grid-halves">
            <div className="form-group">
              <label htmlFor="totalAmount">Monto Total (*):</label>
              <input type="number" id="totalAmount" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} step="0.01" required placeholder="Ej: 300.00"/>
            </div>
            <div className="form-group">
              <label htmlFor="currency">Moneda (*):</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
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
                    ¿Es un préstamo de tu tarjeta de crédito a otra persona (ej: Gabi te devuelve a vos lo que pagaste con tu tarjeta)?
                  </label>
                </div>
                {isMyCreditCardLoanToOther && (
                  <div className="form-group">
                    <label htmlFor="installmentsTotalForOther">Total de Cuotas que te devolverá esa persona (*):</label>
                    <input type="number" id="installmentsTotalForOther" value={installmentsTotalForOther}
                           onChange={(e) => setInstallmentsTotalForOther(e.target.value)}
                           placeholder="Ej: 3" min="1" required={isMyCreditCardLoanToOther} />
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
                    <div className="form-group">
                      <label htmlFor="firstRepaymentDate">Fecha de la Primera Devolución (*):</label>
                      <input type="date" id="firstRepaymentDate" value={firstRepaymentDate}
                             onChange={(e) => setFirstRepaymentDate(e.target.value)} required={isRepaidInInstallments} />
                    </div>
                  </>
                )}
              </div>
              
              {type === 'loan' && !isRepaidInInstallments && !isMyCreditCardLoanToOther && ( 
                <>
                    <hr className="form-separator" />
                    <h5>Opción 3: Préstamo Directo de Dinero (Devolución Única o No Especificada en Cuotas)</h5>
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
                </>
              )}

            </>
          )}

          <div className="form-group" style={{marginTop: '20px'}}>
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"
                      placeholder="Acuerdos, detalles de la compra en cuotas, etc."></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
            <button type="button" onClick={() => navigate('/debts-loans')} className="button-secondary" disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebtAndLoanPage;
