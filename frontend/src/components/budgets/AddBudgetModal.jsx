// Ruta: finanzas-app-pro/frontend/src/components/budgets/AddBudgetModal.jsx
import React, { useState, useEffect } from 'react';
import budgetsService from '../../services/budgets.service.js';
import categoriesService from '../../services/categories.service.js';
import '../transactions/AddTransactionModal.css'; // Reutilizamos estilos de modal

const AddBudgetModal = ({ isOpen, onClose, onBudgetCreated }) => {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [period, setPeriod] = useState('mensual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setCategoryId('');
      setAmount('');
      setCurrency('ARS');
      setPeriod('mensual');
      setError('');
      setIsSubmitting(false);

      // Set default dates for mensual
      const now = new Date();
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);

      // Load categories
      categoriesService.getCategoriesByType('egreso')
        .then(data => setAvailableCategories(data || []))
        .catch(err => setError("No se pudieron cargar las categorías."));
    }
  }, [isOpen]);

  useEffect(() => {
    if (period !== 'personalizado' && isOpen) {
      const now = new Date();
      let newStartDateObj, newEndDateObj;

      switch(period) {
        case 'anual':
          newStartDateObj = new Date(now.getFullYear(), 0, 1);
          newEndDateObj = new Date(now.getFullYear(), 11, 31);
          break;
        case 'quincenal':
          if (now.getDate() <= 15) {
            newStartDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
            newEndDateObj = new Date(now.getFullYear(), now.getMonth(), 15);
          } else {
            newStartDateObj = new Date(now.getFullYear(), now.getMonth(), 16);
            newEndDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          }
          break;
        case 'semanal':
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          newStartDateObj = new Date(now);
          newStartDateObj.setDate(now.getDate() + diffToMonday);
          newEndDateObj = new Date(newStartDateObj);
          newEndDateObj.setDate(newStartDateObj.getDate() + 6);
          break;
        default: // mensual
          newStartDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
          newEndDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }
      setStartDate(newStartDateObj.toISOString().split('T')[0]);
      setEndDate(newEndDateObj.toISOString().split('T')[0]);
    }
  }, [period, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      setError('Categoría y monto son requeridos.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const newBudget = await budgetsService.createBudget({ categoryId, amount, currency, period, startDate, endDate });
      onBudgetCreated(newBudget);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm">
        <div className="modal-header-atm">
          <h3>Nuevo Presupuesto</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm">
          {error && <p className="error-message small-error-atm">{error}</p>}
          <div className="form-group-atm">
            <label htmlFor="budget-category">Categoría de Gasto</label>
            <select id="budget-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="" disabled>Seleccionar...</option>
              {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm amount-group-atm">
              <label htmlFor="budget-amount">Monto</label>
              <input type="number" id="budget-amount" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
            </div>
            <div className="form-group-atm currency-group-atm">
              <label htmlFor="budget-currency">Moneda</label>
              <select id="budget-currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="form-group-atm">
            <label htmlFor="budget-period">Período</label>
            <select id="budget-period" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="mensual">Mensual</option>
              <option value="quincenal">Quincenal</option>
              <option value="semanal">Semanal</option>
              <option value="anual">Anual</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="budget-startDate">Desde</label>
              <input type="date" id="budget-startDate" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={period !== 'personalizado'} required />
            </div>
            <div className="form-group-atm">
              <label htmlFor="budget-endDate">Hasta</label>
              <input type="date" id="budget-endDate" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={period !== 'personalizado'} required />
            </div>
          </div>
          <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetModal;