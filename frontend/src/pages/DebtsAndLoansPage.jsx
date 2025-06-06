// Ruta: finanzas-app-pro/frontend/src/pages/DebtsAndLoansPage.jsx
// NUEVO ARCHIVO
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import debtAndLoanService from '../services/debtAndLoan.service';
import DebtAndLoanItem from '../components/debtAndLoan/DebtAndLoanItem'; // Crearemos este componente
import './DebtsAndLoansPage.css'; // Crearemos este CSS

const DebtsAndLoansPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState(''); // 'debt', 'loan', o '' para todos

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (filterType) {
        filters.type = filterType;
      }
      const data = await debtAndLoanService.getAllDebtsAndLoans(filters);
      setItems(data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar los registros de deudas y préstamos.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        await debtAndLoanService.deleteDebtAndLoan(id);
        fetchItems(); // Recargar lista
      } catch (err) {
        setError(err.message || 'Error al eliminar el registro.');
        setLoading(false);
      }
    }
  };
  
  const handleRecordPaymentSuccess = () => {
    fetchItems(); // Recargar la lista para reflejar el pago y posible cambio de estado
  };


  return (
    <div className="page-container debts-loans-page">
      <div className="page-header">
        <h1>Deudas y Préstamos</h1>
        <Link to="/debts-loans/add" className="button button-primary">
          <span className="icon-add">➕</span> Nuevo Registro
        </Link>
      </div>

      <div className="filter-controls">
        <label htmlFor="typeFilter">Mostrar: </label>
        <select 
          id="typeFilter" 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos</option>
          <option value="debt">Deudas (Yo Debo)</option>
          <option value="loan">Préstamos (Me Deben)</option>
        </select>
      </div>

      {error && <p className="error-message" style={{ marginBottom: '15px' }}>{error}</p>}

      {loading ? (
        <p className="loading-text">Cargando registros...</p>
      ) : items.length > 0 ? (
        <div className="items-grid">
          {items.map(item => (
            <DebtAndLoanItem 
              key={item.id} 
              item={item} 
              onDelete={handleDelete}
              onPaymentRecorded={handleRecordPaymentSuccess} 
            />
          ))}
        </div>
      ) : (
        <p className="no-data-message">
          {filterType === 'debt' ? 'No tienes deudas registradas.' : 
           filterType === 'loan' ? 'No tienes préstamos registrados.' : 
           'No hay registros de deudas o préstamos.'}
        </p>
      )}
    </div>
  );
};

export default DebtsAndLoansPage;