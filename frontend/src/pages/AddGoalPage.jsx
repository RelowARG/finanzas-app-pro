// finanzas-app-pro/frontend/src/pages/AddGoalPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import goalsService from '../services/goals.service';
import { alertService } from '../utils/alert.service'; //
// import './GoalForm.css'; // // Asumiendo que lo creaste

const AddGoalPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [currency, setCurrency] = useState('ARS'); // *** NUEVO ESTADO currency ***
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currencyOptions = [
    { value: 'ARS', label: 'ARS (Pesos Argentinos)' },
    { value: 'USD', label: 'USD (Dólares Estadounidenses)' },
  ];
  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
  ];
  const statusOptions = [
    { value: 'active', label: 'Activa' },
    { value: 'paused', label: 'Pausada' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones existentes...
    if (!name.trim() || !targetAmount) {
      setError('El nombre y el monto objetivo son requeridos.');
      return;
    }
    if (parseFloat(targetAmount) <= 0) {
      setError('El monto objetivo debe ser mayor a cero.');
      return;
    }
    // ...más validaciones

    setError('');
    setLoading(true);

    const goalData = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0.00,
      currency: currency, // *** ENVIAR currency ***
      targetDate: targetDate || null,
      description: description.trim(),
      icon: icon.trim() || '🎯',
      status,
      priority,
    };

    try {
      await goalsService.createGoal(goalData);
      alertService.showSuccessToast('Meta Creada', `¡La meta "${goalData.name}" ha sido creada!`); //
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear la meta.');
      console.error("Error creating goal:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container goal-form-page"> {/* */}
      <div className="form-container" style={{ maxWidth: '700px' }}>
        <h2>Crear Nueva Meta</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="name">Nombre de la Meta (*):</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-grid-thirds"> {/* Cambiado a tercios para target, current y currency */}
            <div className="form-group">
              <label htmlFor="targetAmount">Monto Objetivo (*):</label>
              <input type="number" id="targetAmount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} step="0.01" min="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="currentAmount">Monto Actual:</label>
              <input type="number" id="currentAmount" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} step="0.01" min="0" />
            </div>
            {/* *** NUEVO SELECTOR DE CURRENCY *** */}
            <div className="form-group">
              <label htmlFor="currency">Moneda (*):</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
                {currencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-grid-thirds">
             <div className="form-group">
              <label htmlFor="targetDate">Fecha Límite:</label>
              <input type="date" id="targetDate" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
             <div className="form-group">
                <label htmlFor="priority">Prioridad:</label>
                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {priorityOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="status">Estado Inicial:</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3"></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="icon">Ícono (Emoji):</label>
            <input type="text" id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength="2" style={{ width: '80px', textAlign: 'center', fontSize: '1.5rem' }} />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Guardando...' : 'Crear Meta'}
            </button>
            <button type="button" onClick={() => navigate('/goals')} className="button-secondary" disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalPage;