// finanzas-app-pro/frontend/src/pages/EditGoalPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import goalsService from '../services/goals.service';
import { alertService } from '../utils/alert.service'; //
// import './GoalForm.css'; //

const EditGoalPage = () => {
  const navigate = useNavigate();
  const { goalId } = useParams();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState('ARS'); // *** NUEVO ESTADO currency ***
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');

  const [originalGoal, setOriginalGoal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  const populateForm = useCallback((goalData) => {
    setOriginalGoal(goalData);
    setName(goalData.name || '');
    setTargetAmount(goalData.targetAmount ? goalData.targetAmount.toString() : '');
    setCurrentAmount(goalData.currentAmount ? goalData.currentAmount.toString() : '0');
    setCurrency(goalData.currency || 'ARS'); // *** CARGAR currency ***
    setTargetDate(goalData.targetDate ? goalData.targetDate.split('T')[0] : '');
    setDescription(goalData.description || '');
    setIcon(goalData.icon || '🎯');
    setStatus(goalData.status || 'active');
    setPriority(goalData.priority || 'medium');
  }, []);

  useEffect(() => {
    // ... (código de fetchGoalData existente)
    const fetchGoalData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await goalsService.getGoalById(goalId);
        if (data) {
          populateForm(data);
        } else {
          setError('Meta no encontrada.');
          navigate('/goals'); 
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al cargar la meta.');
        console.error("Error fetching goal for edit:", err);
      } finally {
        setLoading(false);
      }
    };
    if (goalId) {
      fetchGoalData();
    }
  }, [goalId, navigate, populateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones existentes...
    setError('');
    setIsSubmitting(true);

    const goalDataToUpdate = {
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
      await goalsService.updateGoal(goalId, goalDataToUpdate);
      alertService.showSuccessToast('Meta Actualizada', `La meta "${goalDataToUpdate.name}" ha sido actualizada.`); //
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la meta.');
      console.error("Error updating goal:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="page-container"><p className="loading-text">Cargando datos de la meta...</p></div>;
  }
  if (error && !originalGoal) {
     return <div className="page-container"><p className="error-message">{error}</p> <Link to="/goals" className="button">Volver a Metas</Link> </div>;
  }

  return (
    <div className="page-container goal-form-page"> {/* */}
      <div className="form-container" style={{ maxWidth: '700px' }}>
        <h2>Editar Meta: {originalGoal?.name || ''}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="name">Nombre de la Meta (*):</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-grid-thirds"> {/* Cambiado a tercios */}
            <div className="form-group">
              <label htmlFor="targetAmount">Monto Objetivo (*):</label>
              <input type="number" id="targetAmount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} step="0.01" min="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="currentAmount">Monto Actual:</label>
              <input type="number" id="currentAmount" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} step="0.01" min="0" />
            </div>
            {/* *** SELECTOR DE CURRENCY *** */}
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
                <label htmlFor="status">Estado:</label>
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
            <button type="submit" disabled={isSubmitting || loading} className="button-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => navigate('/goals')} className="button-secondary" disabled={isSubmitting || loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalPage;