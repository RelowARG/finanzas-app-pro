// Ruta: finanzas-app-pro/frontend/src/pages/BudgetsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import budgetsService from '../services/budgets.service.js';
import BudgetItem from '../components/budgets/BudgetItem.jsx';
import { useModals, MODAL_TYPES } from '../contexts/ModalContext.jsx';
import './BudgetsPage.css';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { openModal } = useModals();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await budgetsService.getAllBudgetsWithSpent();
      setBudgets(data || []);
    } catch (err) { // <<<--- AQUÍ ESTABA EL ERROR, FALTABA LA LLAVE DE APERTURA
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los presupuestos.';
      setError(errorMessage);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      try {
        setLoading(true);
        await budgetsService.deleteBudget(budgetId);
        fetchBudgets();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar el presupuesto.');
        setLoading(false);
      }
    }
  };
  
  const handleBudgetModified = () => {
    fetchBudgets();
  };

  const handleOpenEditModal = (budget) => {
    openModal(MODAL_TYPES.EDIT_BUDGET, {
      budgetData: budget,
      onBudgetUpdated: handleBudgetModified
    });
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="page-container budgets-page">
        <div className="budgets-page-header">
          <h1>Mis Presupuestos</h1>
        </div>
        <p className="loading-text">Cargando presupuestos...</p>
      </div>
    );
  }

  return (
    <div className="page-container budgets-page">
      <div className="budgets-page-header">
        <h1>Mis Presupuestos</h1>
        <button 
          onClick={() => openModal(MODAL_TYPES.ADD_BUDGET, { onBudgetCreated: handleBudgetModified })} 
          className="button button-primary"
        >
          <span className="icon-add">➕</span> Nuevo Presupuesto
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {budgets.length > 0 ? (
        <div className="budgets-grid">
          {budgets.map(budget => (
            <BudgetItem 
              key={budget.id} 
              budget={budget} 
              onDeleteBudget={handleDeleteBudget}
              onEditBudget={handleOpenEditModal}
            />
          ))}
        </div>
      ) : (
        !loading && !error && (
          <div className="no-budgets-message">
            <div className="no-data-icon">🎯</div>
            <p>Aún no has creado ningún presupuesto.</p>
            <p className="no-data-subtitle">Define límites para tus gastos y toma el control.</p>
            <button 
                onClick={() => openModal(MODAL_TYPES.ADD_BUDGET, { onBudgetCreated: handleBudgetModified })} 
                className="button button-secondary" style={{marginTop: '10px'}}
            >
              Crear mi primer presupuesto
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default BudgetsPage;