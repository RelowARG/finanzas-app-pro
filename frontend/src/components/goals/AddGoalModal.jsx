import React, { useState, useEffect } from 'react';
import goalsService from '../../services/goals.service';
import { alertService } from '../../utils/alert.service';
import './GoalModal.css';

const AddGoalModal = ({ isOpen, onClose, onGoalCreated }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [currency, setCurrency] = useState('ARS');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setCurrency('ARS');
      setTargetDate('');
      setDescription('');
      setIcon('🎯');
      setPriority('medium');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) {
      setError('El nombre y el monto objetivo son requeridos.');
      return;
    }
    if (parseFloat(targetAmount) <= 0) {
      setError('El monto objetivo debe ser mayor a cero.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const goalData = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0.00,
      currency,
      targetDate: targetDate || null,
      description: description.trim(),
      icon: icon.trim() || '🎯',
      status: 'active',
      priority,
    };

    try {
      const newGoal = await goalsService.createGoal(goalData);
      alertService.showSuccessToast('Meta Creada', `¡La meta "${newGoal.name}" ha sido creada!`);
      if (onGoalCreated) {
        onGoalCreated(newGoal);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-atm">
      <div className="modal-content-atm goal-modal-content">
        <div className="modal-header-atm">
          <h3>Crear Nueva Meta</h3>
          <button onClick={onClose} className="close-modal-button-atm">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="transaction-form-atm goal-form">
          {error && <p className="error-message small-error-atm">{error}</p>}
          <div className="form-group-atm">
            <label htmlFor="goal-name">Nombre de la Meta (*)</label>
            <input type="text" id="goal-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="goal-targetAmount">Monto Objetivo (*)</label>
              <input type="number" id="goal-targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} step="0.01" min="0.01" required />
            </div>
            <div className="form-group-atm">
              <label htmlFor="goal-currentAmount">Monto Actual</label>
              <input type="number" id="goal-currentAmount" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} step="0.01" min="0" />
            </div>
            <div className="form-group-atm">
              <label htmlFor="goal-currency">Moneda</label>
              <select id="goal-currency" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="form-group-atm">
            <label htmlFor="goal-description">Descripción (Opcional)</label>
            <textarea id="goal-description" value={description} onChange={e => setDescription(e.target.value)} rows="2"></textarea>
          </div>
          <div className="form-row-atm">
            <div className="form-group-atm">
              <label htmlFor="goal-targetDate">Fecha Límite</label>
              <input type="date" id="goal-targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
            <div className="form-group-atm">
              <label htmlFor="goal-priority">Prioridad</label>
              <select id="goal-priority" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div className="form-group-atm">
              <label htmlFor="goal-icon">Ícono (Emoji)</label>
              <input type="text" id="goal-icon" value={icon} onChange={e => setIcon(e.target.value)} maxLength="2" style={{ textAlign: 'center', fontSize: '1.2rem' }}/>
            </div>
          </div>
          <div className="modal-actions-atm">
            <button type="button" onClick={onClose} className="button button-secondary" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;