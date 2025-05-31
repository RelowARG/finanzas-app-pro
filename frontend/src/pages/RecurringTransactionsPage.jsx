// Ruta: finanzas-app-pro/frontend/src/pages/RecurringTransactionsPage.jsx
// ARCHIVO NUEVO
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import recurringTransactionsService from '../services/recurringTransactions.service';
// Crearemos RecurringTransactionItem más adelante
// import RecurringTransactionItem from '../components/recurring/RecurringTransactionItem';
import './RecurringTransactionsPage.css'; // Crearemos este CSS

const RecurringTransactionsPage = () => {
  const [recurringTxs, setRecurringTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecurringTxs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recurringTransactionsService.getRecurringTransactions();
      setRecurringTxs(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los movimientos recurrentes.');
      setRecurringTxs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringTxs();
  }, [fetchRecurringTxs]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta definición de movimiento recurrente?')) {
        try {
            setLoading(true);
            await recurringTransactionsService.deleteRecurringTransaction(id);
            fetchRecurringTxs(); // Recargar lista
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar.');
            setLoading(false);
        }
    }
  };


  if (loading) {
    return (
      <div className="page-container recurring-tx-page">
        <div className="page-header"><h1>Movimientos Recurrentes</h1></div>
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="page-container recurring-tx-page">
      <div className="page-header">
        <h1>Movimientos Recurrentes</h1>
        <Link to="/settings/recurring-transactions/add" className="button button-primary">
          <span className="icon-add">➕</span> Definir Nuevo
        </Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {recurringTxs.length > 0 ? (
        <div className="recurring-tx-list">
          {recurringTxs.map(rtx => (
            // Usaremos un placeholder aquí hasta crear RecurringTransactionItem.jsx
            <div key={rtx.id} className="recurring-tx-item-placeholder">
              <div className="info">
                <span className="icon">{rtx.category?.icon || (rtx.type === 'ingreso' ? '💰' : '💸')}</span>
                <span className="desc">{rtx.description}</span>
                <span className={`amount ${rtx.type}`}>{rtx.type === 'ingreso' ? '+' : '-'}${rtx.amount} {rtx.currency}</span>
              </div>
              <div className="details">
                <span>Cuenta: {rtx.account?.name || 'N/A'}</span>
                <span>Categoría: {rtx.category?.name || 'N/A'}</span>
                <span>Frecuencia: {rtx.frequency}</span>
                <span>Próx. Ejec.: {new Date(rtx.nextRunDate).toLocaleDateString('es-AR')}</span>
                <span>Estado: {rtx.isActive ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="actions">
                <Link to={`/settings/recurring-transactions/edit/${rtx.id}`} className="button button-small button-edit">Editar</Link>
                <button onClick={() => handleDelete(rtx.id)} className="button button-small button-delete">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && <p className="no-data-message">No has definido movimientos recurrentes.</p>
      )}
    </div>
  );
};

export default RecurringTransactionsPage;
