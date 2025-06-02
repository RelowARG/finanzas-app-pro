// finanzas-app-pro/frontend/src/pages/GoalsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import goalsService from '../services/goals.service';
import GoalItem from '../components/goals/GoalItem'; // *** IMPORTAR EL COMPONENTE REAL ***
import { alertService } from '../utils/alert.service'; //
import './GoalsPage.css'; //

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); 

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (filterStatus) filters.statusFilter = filterStatus;
      const data = await goalsService.getAllGoals(filters);
      setGoals(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las metas.');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDeleteGoal = async (goalId) => {
    const result = await alertService.showConfirmationDialog({ //
      title: 'Confirmar Eliminación',
      text: '¿Estás seguro de que quieres eliminar esta meta? Esta acción no se puede deshacer.',
      confirmButtonText: 'Sí, eliminar',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true); 
        await goalsService.deleteGoal(goalId);
        alertService.showSuccessToast('Meta Eliminada', 'La meta ha sido eliminada correctamente.'); //
        fetchGoals(); 
      } catch (err) {
        const deleteError = err.response?.data?.message || err.message || 'Error al eliminar la meta.';
        setError(deleteError);
        alertService.showErrorAlert('Error al Eliminar', deleteError); //
        setLoading(false);
      }
    }
  };
  
  // Placeholder para la función de añadir progreso (se implementará en el futuro si es necesario)
  const handleAddProgress = (goalId) => {
    console.log("Añadir progreso a la meta ID:", goalId);
    // Aquí iría la lógica para abrir un modal o redirigir a una página para añadir progreso
    alertService.showInfoAlert('Próximamente', 'Funcionalidad para añadir progreso a metas estará disponible pronto.');
  };


  return (
    <div className="page-container goals-page"> {/* */}
      <div className="goals-page-header"> {/* */}
        <h1>Mis Metas</h1>
        <Link to="/goals/add" className="button button-primary">
          <span className="icon-add">➕</span> Nueva Meta
        </Link>
      </div>

      <div className="filter-controls" style={{ marginBottom: '20px' }}> {/* */}
        <label htmlFor="statusFilter" style={{marginRight:'10px'}}>Filtrar por estado: </label>
        <select
          id="statusFilter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select" /* */
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
        <div className="goals-list"> {/* */}
          {goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onAddProgress={handleAddProgress} // Pasar la función de añadir progreso
            />
          ))}
        </div>
      ) : (
        <p className="no-data-message">
          Aún no has creado ninguna meta {filterStatus ? `con el estado "${filterStatus}"` : ''}. ¡Empieza a planificar tus objetivos!
        </p>
      )}
    </div>
  );
};

export default GoalsPage;