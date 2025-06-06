import React, { useState, useEffect } from 'react';
import goalsService from '../../services/goals.service.js';
// Se elimina la importación de accountService, ya que no es necesario
import { alertService } from '../../utils/alert.service.js';
import { formatCurrency } from '../../utils/formatters.js';
import './GoalModal.css';

// El componente ahora recibe la lista completa de cuentas a través de las props
const AddGoalProgressModal = ({ isOpen, onClose, onProgressAdded, goalData, accounts }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableAccounts, setAvailableAccounts] = useState([]); // Cuentas filtradas para el dropdown
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // *** LÓGICA CORREGIDA ***
  // Este efecto ahora depende de la prop 'accounts' y la usa para filtrar.
  useEffect(() => {
    if (isOpen && goalData && accounts) {
      // Resetea los campos del formulario al abrir
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
      setIsSubmitting(false);

      // Filtra las cuentas recibidas para que coincidan con la moneda de la meta
      const filteredAccounts = accounts.filter(acc => acc.currency === goalData.currency);
      setAvailableAccounts(filteredAccounts);

      // Preselecciona la primera cuenta válida o limpia la selección si no hay ninguna
      if (filteredAccounts.length > 0) {
        setAccountId(filteredAccounts[0].id.toString());
      } else {
        setAccountId('');
      }
    }
  }, [isOpen, goalData, accounts]); // Dependencias correctas

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !accountId || !date) {
      setError('Todos los campos son requeridos.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await goalsService.addProgress(goalData.id, {
        amount: parseFloat(amount),
        accountId: parseInt(accountId),
        date,
      });
      alertService.showSuccessToast('Progreso Añadido');
      if (onProgressAdded) {
        onProgressAdded();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al añadir progreso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !goalData) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm goal-modal-content" style={{maxWidth: '500px'}}>
        <div className="modal-header-atm">
          <h3>Añadir Avance a: {goalData.name}</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm goal-form">
          {error && <p className="error-message small-error-atm">{error}</p>}
          <div className="form-group-atm">
            <label htmlFor="progress-amount">Monto a Añadir (*)</label>
            <input type="number" id="progress-amount" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
          </div>
          <div className="form-group-atm">
            <label htmlFor="progress-account">Desde la Cuenta (*)</label>
            <select id="progress-account" value={accountId} onChange={e => setAccountId(e.target.value)} required disabled={availableAccounts.length === 0}>
              <option value="" disabled>{availableAccounts.length > 0 ? "Seleccionar..." : `No hay cuentas en ${goalData.currency}`}</option>
              {availableAccounts.map(acc => 
                <option key={acc.id} value={acc.id}>
                  {acc.icon} {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                </option>
              )}
            </select>
          </div>
          <div className="form-group-atm">
            <label htmlFor="progress-date">Fecha del Aporte (*)</label>
            <input type="date" id="progress-date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Añadir Avance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalProgressModal;