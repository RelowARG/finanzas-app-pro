// Ruta: finanzas-app-pro/frontend/src/pages/RecurringTransactionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import recurringTransactionsService from '../services/recurringTransactions.service';
import RecurringTransactionItem from '../components/recurring/RecurringTransactionItem'; //
import { alertService } from '../utils/alert.service'; //
import './RecurringTransactionsPage.css'; //

const RecurringTransactionsPage = () => {
  const [recurringTxs, setRecurringTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filter, setFilter] = useState('all'); 

  const fetchRecurringTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let params = {};
      if (filter === 'active') params.isActive = true;
      if (filter === 'inactive') params.isActive = false;
      
      // Asumiendo que el servicio ahora devuelve un objeto con una propiedad 'items'
      // o directamente el array si no hay paginación en este endpoint.
      // Ajustar según la estructura real de la respuesta del backend para este endpoint.
      const responseData = await recurringTransactionsService.getAllRecurring(params);
      setRecurringTxs(responseData.items || responseData || []); // Manejar ambas estructuras
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los movimientos recurrentes.';
      setError(errorMessage);
      alertService.showErrorAlert('Error de Carga', errorMessage); //
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const handleDelete = async (id) => {
    const result = await alertService.showConfirmationDialog({ //
        title: 'Confirmar Eliminación',
        text: '¿Estás seguro de que quieres eliminar este movimiento recurrente? Esta acción no se puede deshacer.',
        confirmButtonText: 'Sí, eliminar',
    });
    if (result.isConfirmed) {
        try {
            setLoading(true);
            await recurringTransactionsService.remove(id);
            alertService.showSuccessToast('Eliminado', 'Movimiento recurrente eliminado exitosamente.'); //
            fetchRecurringTransactions(); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar.';
            setError(errorMessage);
            alertService.showErrorAlert('Error al Eliminar', errorMessage); //
            setLoading(false); // Asegurarse de que loading se ponga en false en caso de error
        }
    }
  };

  const handleToggleActive = async (id, newActiveState) => {
    try {
        setLoading(true); // Indicar carga mientras se actualiza
        await recurringTransactionsService.update(id, { isActive: newActiveState });
        alertService.showSuccessToast('Actualizado', `Movimiento recurrente ${newActiveState ? 'activado' : 'desactivado'}.`); //
        fetchRecurringTransactions(); // Recargar para mostrar el estado actualizado
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || `Error al ${newActiveState ? 'activar' : 'desactivar'}.`;
        setError(errorMessage);
        alertService.showErrorAlert('Error al Actualizar', errorMessage); //
        setLoading(false); // Asegurarse de que loading se ponga en false en caso de error
    }
  };

  const handleProcessNow = async (id) => {
    const result = await alertService.showConfirmationDialog({ //
        title: 'Confirmar Registro Manual',
        text: '¿Estás seguro de que quieres registrar este movimiento ahora? Se creará una nueva transacción y se actualizará la próxima fecha de ejecución.',
        confirmButtonText: 'Sí, registrar ahora'
    });
    if (result.isConfirmed) {
        try {
            setLoading(true);
            const response = await recurringTransactionsService.processManually(id);
            
            // *** CORRECCIÓN AQUÍ: Usar showSuccessToast ***
            alertService.showSuccessToast( //
                'Registrado Manualmente', 
                `Movimiento "${response.createdTransaction.description}" registrado. Próxima ejecución: ${new Date(response.updatedRecurringTransaction.nextRunDate + 'T00:00:00Z').toLocaleDateString('es-AR')}.`
            );
            fetchRecurringTransactions(); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al registrar manualmente.';
            setError(errorMessage);
            alertService.showErrorAlert('Error al Registrar', errorMessage); //
            setLoading(false); // Asegurarse de que loading se ponga en false en caso de error
        }
    }
  };

  return (
    <div className="page-container recurring-transactions-page">
      <div className="page-header">
        <h1>Movimientos Recurrentes</h1>
        <Link to="/settings/recurring-transactions/add" className="button button-primary">
          <span className="icon-add">➕</span> Nuevo Recurrente
        </Link>
      </div>

      {error && <p className="error-message main-error">{error}</p>}

      <div className="filter-controls">
        <span>Mostrar: </span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {loading && <p className="loading-text">Cargando movimientos recurrentes...</p>}

      {!loading && recurringTxs.length === 0 && !error && (
        <p className="no-items-message">No tienes movimientos recurrentes configurados {filter !== 'all' ? `con el filtro "${filter}"` : ''}.</p>
      )}

      {!loading && recurringTxs.length > 0 && (
        <div className="recurring-list">
          {recurringTxs.map(tx => (
            <RecurringTransactionItem 
              key={tx.id} 
              transaction={tx} 
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onProcessNow={handleProcessNow}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionsPage;