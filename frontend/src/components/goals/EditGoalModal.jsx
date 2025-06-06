import React, { useState, useEffect } from 'react';
import goalsService from '../../services/goals.service.js';
import { alertService } from '../../utils/alert.service.js';
import './GoalModal.css';

const EditGoalModal = ({ isOpen, onClose, onGoalUpdated, goalData }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && goalData) {
      setName(goalData.name || '');
      setTargetAmount(goalData.targetAmount?.toString() || '');
      setCurrentAmount(goalData.currentAmount?.toString() || '0');
      setCurrency(goalData.currency || 'ARS');
      setTargetDate(goalData.targetDate?.split('T')[0] || '');
      setDescription(goalData.description || '');
      setIcon(goalData.icon || '🎯');
      setStatus(goalData.status || 'active');
      setPriority(goalData.priority || 'medium');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, goalData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) {
      setError('Nombre y monto objetivo son requeridos.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const updatedData = { name: name.trim(), targetAmount: parseFloat(targetAmount), currentAmount: parseFloat(currentAmount), currency, targetDate: targetDate || null, description, icon, status, priority };
      const updatedGoal = await goalsService.updateGoal(goalData.id, updatedData);
      alertService.showSuccessToast('Meta Actualizada');
      if (onGoalUpdated) {
        onGoalUpdated(updatedGoal);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm goal-modal-content">
        <div className="modal-header-atm">
          <h3>Editar Meta</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm goal-form">
          {error && <p className="error-message small-error-atm">{error}</p>}
          
          <div className="form-group-atm">
            <label htmlFor="edit-goal-name">Nombre de la Meta (*)</label>
            <input type="text" id="edit-goal-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="edit-goal-targetAmount">Monto Objetivo (*)</label>
              <input type="number" id="edit-goal-targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} step="0.01" min="0.01" required />
            </div>
            <div className="form-group-atm">
              <label htmlFor="edit-goal-currentAmount">Monto Actual</label>
              <input type="number" id="edit-goal-currentAmount" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} step="0.01" min="0" />
            </div>
            <div className="form-group-atm">
                <label htmlFor="edit-goal-currency">Moneda</label>
                <select id="edit-goal-currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                </select>
            </div>
          </div>
          <div className="form-group-atm">
            <label htmlFor="edit-goal-description">Descripción</label>
            <textarea id="edit-goal-description" value={description} onChange={e => setDescription(e.target.value)} rows="2"></textarea>
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="edit-goal-targetDate">Fecha Límite</label>
              <input type="date" id="edit-goal-targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
            <div className="form-group-atm">
              <label htmlFor="edit-goal-priority">Prioridad</label>
              <select id="edit-goal-priority" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div className="form-group-atm">
              <label htmlFor="edit-goal-status">Estado</label>
              <select id="edit-goal-status" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
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

export default EditGoalModal;