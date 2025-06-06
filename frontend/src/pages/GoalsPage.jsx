import React, { useState, useEffect, useCallback } from 'react';
import goalsService from '../services/goals.service.js';
import accountService from '../services/accounts.service.js';
import GoalItem from '../components/goals/GoalItem.jsx';
import { alertService } from '../utils/alert.service.js';
import { useModals, MODAL_TYPES } from '../contexts/ModalContext.jsx';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); 
  const { openModal } = useModals();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (filterStatus) filters.statusFilter = filterStatus;

      const [goalsData, accountsData] = await Promise.all([
        goalsService.getAllGoals(filters),
        accountService.getAllAccounts()
      ]);
      
      setGoals(goalsData || []);
      setAccounts(accountsData || []);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar datos.');
      setGoals([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteGoal = async (goalId) => {
    const result = await alertService.showConfirmationDialog({
      title: 'Confirmar Eliminación',
      text: '¿Estás seguro de que quieres eliminar esta meta? Esta acción no se puede deshacer.',
      confirmButtonText: 'Sí, eliminar',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true); 
        await goalsService.deleteGoal(goalId);
        alertService.showSuccessToast('Meta Eliminada', 'La meta ha sido eliminada correctamente.');
        fetchData(); 
      } catch (err) {
        const deleteError = err.response?.data?.message || err.message || 'Error al eliminar la meta.';
        setError(deleteError);
        alertService.showErrorAlert('Error al Eliminar', deleteError);
        setLoading(false);
      }
    }
  };
  
  const handleAddProgress = (goal) => {
    openModal(MODAL_TYPES.ADD_GOAL_PROGRESS, {
      goal,
      accounts,
      onProgressAdded: handleGoalModified
    });
  };

  const handleGoalModified = () => {
    fetchData();
  };
  
  const handleOpenEditModal = (goal) => {
    openModal(MODAL_TYPES.EDIT_GOAL, {
      goalData: goal,
      onGoalUpdated: handleGoalModified
    });
  };

  if (loading && goals.length === 0) {
    return (
      <div className="page-container goals-page">
        <div className="goals-page-header">
          <h1>Mis Metas</h1>
        </div>
        <p className="loading-text">Cargando metas...</p>
      </div>
    );
  }

  return (
    <div className="page-container goals-page">
      <div className="goals-page-header">
        <h1>Mis Metas</h1>
        <button 
          onClick={() => openModal(MODAL_TYPES.ADD_GOAL, { onGoalCreated: handleGoalModified })} 
          className="button button-primary"
        >
          <span className="icon-add">➕</span> Nueva Meta
        </button>
      </div>

      <div className="filter-controls">
        <label htmlFor="statusFilter">Filtrar por estado: </label>
        <select
          id="statusFilter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Todas</option>
          <option value="active">Activas</option>
          <option value="completed">Completadas</option>
          <option value="paused">Pausadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {error && <p className="error-message" style={{ marginBottom: '15px' }}>{error}</p>}

      {loading ? (
        <p className="loading-text">Cargando metas...</p>
      ) : goals.length > 0 ? (
        <div className="goals-grid">
          {goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onEdit={handleOpenEditModal}
              onAddProgress={handleAddProgress}
            />
          ))}
        </div>
      ) : (
        <div className="no-data-message">
            <div className="no-data-icon">🏆</div>
            <p>Aún no has creado ninguna meta {filterStatus ? `con el estado "${filterStatus}"` : ''}.</p>
            <p className="no-data-subtitle">¡Empieza a planificar tus objetivos!</p>
            <button 
                onClick={() => openModal(MODAL_TYPES.ADD_GOAL, { onGoalCreated: handleGoalModified })} 
                className="button button-secondary" style={{marginTop: '10px'}}
            >
              Crear mi primera meta
            </button>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;