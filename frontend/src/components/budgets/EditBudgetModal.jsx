// Ruta: finanzas-app-pro/frontend/src/components/budgets/EditBudgetModal.jsx
import React, { useState, useEffect } from 'react';
import budgetsService from '../../services/budgets.service.js';
import categoriesService from '../../services/categories.service.js';
import '../transactions/AddTransactionModal.css'; // Reutilizamos estilos

const EditBudgetModal = ({ isOpen, onClose, onBudgetUpdated, budgetData }) => {
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
    if (isOpen && budgetData) {
      setCategoryId(budgetData.categoryId || '');
      setAmount(budgetData.amount?.toString() || '');
      setCurrency(budgetData.currency || 'ARS');
      setPeriod(budgetData.period || 'mensual');
      setStartDate(budgetData.startDate?.split('T')[0] || '');
      setEndDate(budgetData.endDate?.split('T')[0] || '');
      setError('');
      setIsSubmitting(false);

      categoriesService.getCategoriesByType('egreso')
        .then(data => setAvailableCategories(data || []))
        .catch(err => setError("No se pudieron cargar las categorías."));
    }
  }, [isOpen, budgetData]);

  // Lógica para auto-ajustar fechas si cambia el período
  useEffect(() => {
    if (period !== 'personalizado' && isOpen) {
      // ... (misma lógica de ajuste de fechas que en AddBudgetModal) ...
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
      const updatedData = { categoryId, amount: parseFloat(amount), currency, period, startDate, endDate };
      const updatedBudget = await budgetsService.updateBudget(budgetData.id, updatedData);
      onBudgetUpdated(updatedBudget);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm">
        <div className="modal-header-atm">
          <h3>Editar Presupuesto</h3>
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;