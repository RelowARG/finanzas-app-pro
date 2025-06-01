// Ruta: src/components/accounts/PayCreditCardModal.jsx
// NUEVO ARCHIVO
import React, { useState, useEffect } from 'react';
import accountService from '../../services/accounts.service'; // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
import './PayCreditCardModal.css'; // Crearemos este CSS

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PayCreditCardModal = ({ isOpen, onClose, creditCardAccount, payingAccounts, onPaymentSuccess }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payingAccountId, setPayingAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && creditCardAccount) {
      // Sugerir el saldo del resumen si está disponible y es positivo (indicando deuda)
      // El saldo de la tarjeta ya es negativo si es deuda, así que usamos Math.abs
      const suggestedAmount = creditCardAccount.statementBalance 
                             ? Math.abs(parseFloat(creditCardAccount.statementBalance))
                             : (creditCardAccount.balance < 0 ? Math.abs(parseFloat(creditCardAccount.balance)) : '');
      setPaymentAmount(suggestedAmount.toString());
      
      // Preseleccionar la primera cuenta pagadora si existe
      if (payingAccounts && payingAccounts.length > 0) {
        setPayingAccountId(payingAccounts[0].id.toString());
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, creditCardAccount, payingAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payingAccountId || !paymentAmount || !paymentDate) {
      setError('Por favor, completa la cuenta pagadora, el monto y la fecha.');
      return;
    }
    const amountToPay = parseFloat(paymentAmount);
    if (amountToPay <= 0) {
      setError('El monto a pagar debe ser mayor a cero.');
      return;
    }

    // Opcional: Advertencia si el monto a pagar es mayor al saldo de la cuenta pagadora (si tenemos esa info)
    // const selectedPayingAccount = payingAccounts.find(acc => acc.id.toString() === payingAccountId);
    // if (selectedPayingAccount && parseFloat(selectedPayingAccount.balance) < amountToPay) {
    //   if (!window.confirm(`El saldo de la cuenta ${selectedPayingAccount.name} (${formatCurrency(selectedPayingAccount.balance, selectedPayingAccount.currency)}) es menor al monto a pagar. ¿Continuar?`)) {
    //     return;
    //   }
    // }

    setError('');
    setIsSubmitting(true);

    try {
      await accountService.payCreditCardStatement(creditCardAccount.id, { // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
        payingAccountId: parseInt(payingAccountId),
        paymentAmount: amountToPay,
        paymentDate,
        notes: notes.trim(),
      });
      onPaymentSuccess(); // Llama a la función para refrescar y cerrar
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al registrar el pago.');
      console.error("Error paying credit card statement:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !creditCardAccount) {
    return null;
  }

  // Filtrar la tarjeta de crédito actual de la lista de cuentas pagadoras
  const filteredPayingAccounts = payingAccounts.filter(acc => acc.id.toString() !== creditCardAccount.id.toString());

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-modal-content">
        <h3>Pagar Resumen de Tarjeta: {creditCardAccount.name}</h3>
        <p className="current-statement-balance">
          Saldo del resumen a pagar: 
          <strong>
            {creditCardAccount.statementBalance !== null && creditCardAccount.statementBalance !== undefined 
              ? formatCurrency(Math.abs(creditCardAccount.statementBalance), creditCardAccount.currency)
              : 'No especificado (se usará saldo total)'}
          </strong>
        </p>
        <p className="current-card-balance">
            Saldo actual de la tarjeta: {formatCurrency(creditCardAccount.balance, creditCardAccount.currency)}
        </p>

        <form onSubmit={handleSubmit}>
          {error && <p className="error-message small-error">{error}</p>}
          
          <div className="form-group">
            <label htmlFor="paymentAmount">Monto a Pagar (*):</label>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              step="0.01"
              min="0.01"
              required
              placeholder="Monto del pago"
            />
          </div>

          <div className="form-group">
            <label htmlFor="payingAccountId">Pagar con Cuenta (*):</label>
            <select 
              id="payingAccountId" 
              value={payingAccountId} 
              onChange={(e) => setPayingAccountId(e.target.value)} 
              required
              disabled={filteredPayingAccounts.length === 0}
            >
              <option value="" disabled>{filteredPayingAccounts.length === 0 ? "No hay cuentas disponibles para pagar" : "Seleccionar cuenta"}</option>
              {filteredPayingAccounts.map(acc => (
                <option key={acc.id} value={acc.id.toString()}>
                  {acc.icon || '🏦'} {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">Fecha del Pago (*):</label>
            <input 
              type="date" 
              id="paymentDate" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional):</label>
            <textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows="2"
              placeholder="Ej: Pago mínimo, Pago total"
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
            </button>
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayCreditCardModal;