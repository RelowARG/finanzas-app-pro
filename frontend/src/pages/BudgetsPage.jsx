// Ruta: finanzas-app-pro/frontend/src/pages/BudgetsPage.jsx
// ACTUALIZA ESTE ARCHIVO
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import budgetsService from '../services/budgets.service';
import BudgetItem from '../components/budgets/BudgetItem';
import './BudgetsPage.css';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await budgetsService.getAllBudgetsWithSpent();
      setBudgets(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los presupuestos.');
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
        setError('');
        await budgetsService.deleteBudget(budgetId);
        fetchBudgets(); // Recargar la lista
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar el presupuesto.');
        console.error("Error deleting budget:", err.response?.data || err);
        setLoading(false);
      }
    }
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
        <Link to="/budgets/add" className="button button-primary">
          <span className="icon-add">➕</span> Nuevo Presupuesto
        </Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {budgets.length > 0 ? (
        <div className="budgets-grid">
          {budgets.map(budget => (
            <BudgetItem 
              key={budget.id} 
              budget={budget} 
              onDeleteBudget={handleDeleteBudget} // Pasar la función
            />
          ))}
        </div>
      ) : (
        !loading && !error && (
          <div className="no-budgets-message">
            <p>Aún no has creado ningún presupuesto para el período seleccionado.</p>
            <Link to="/budgets/add" className="button button-secondary" style={{marginTop: '10px'}}>
              Crear mi primer presupuesto
            </Link>
          </div>
        )
      )}
    </div>
  );
};

export default BudgetsPage;