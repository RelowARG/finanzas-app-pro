// Ruta: finanzas-app-pro/frontend/src/pages/RecurringTransactionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Link ya no es necesario para agregar
import recurringTransactionsService from '../services/recurringTransactions.service';
import RecurringTransactionItem from '../components/recurring/RecurringTransactionItem';
import { alertService } from '../utils/alert.service';
import { useModals, MODAL_TYPES } from '../contexts/ModalContext';
import './RecurringTransactionsPage.css';

const RecurringTransactionsPage = () => {
  const [recurringTxs, setRecurringTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); 

  const { openModal } = useModals();

  const fetchRecurringTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let params = {};
      if (filter === 'active') params.isActive = true;
      if (filter === 'inactive') params.isActive = false;
      
      const responseData = await recurringTransactionsService.getAllRecurring(params);
      setRecurringTxs(responseData.items || responseData || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los movimientos recurrentes.';
      setError(errorMessage);
      // alertService.showErrorAlert('Error de Carga', errorMessage); // Ya se muestra el error en la página
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const handleDelete = async (id) => { /* ... (sin cambios significativos, solo asegurar que setLoading(false) esté en el catch) ... */ 
    const result = await alertService.showConfirmationDialog({
        title: 'Confirmar Eliminación',
        text: '¿Estás seguro de que quieres eliminar este movimiento recurrente? Esta acción no se puede deshacer.',
        confirmButtonText: 'Sí, eliminar',
    });
    if (result.isConfirmed) {
        try {
            setLoading(true);
            await recurringTransactionsService.remove(id);
            alertService.showSuccessToast('Eliminado', 'Movimiento recurrente eliminado exitosamente.');
            fetchRecurringTransactions(); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar.';
            setError(errorMessage); 
            alertService.showErrorAlert('Error al Eliminar', errorMessage);
            setLoading(false); // Asegurar que loading se quite
        }
    }
  };

  const handleToggleActive = async (id, newActiveState) => { /* ... (sin cambios significativos, solo asegurar que setLoading(false) esté en el catch) ... */
    try {
        setLoading(true); 
        await recurringTransactionsService.update(id, { isActive: newActiveState });
        alertService.showSuccessToast('Actualizado', `Movimiento recurrente ${newActiveState ? 'activado' : 'desactivado'}.`);
        fetchRecurringTransactions(); 
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || `Error al ${newActiveState ? 'activar' : 'desactivar'}.`;
        setError(errorMessage);
        alertService.showErrorAlert('Error al Actualizar', errorMessage);
        setLoading(false); // Asegurar que loading se quite
    }
  };

  const handleProcessNow = async (id) => { /* ... (sin cambios significativos, solo asegurar que setLoading(false) esté en el catch) ... */
    const result = await alertService.showConfirmationDialog({
        title: 'Confirmar Registro Manual',
        text: '¿Estás seguro de que quieres registrar este movimiento ahora? Se creará una nueva transacción y se actualizará la próxima fecha de ejecución.',
        confirmButtonText: 'Sí, registrar ahora'
    });
    if (result.isConfirmed) {
        try {
            setLoading(true);
            const response = await recurringTransactionsService.processManually(id);
            alertService.showSuccessToast(
                'Registrado Manualmente', 
                `Movimiento "${response.createdTransaction.description}" registrado. Próxima ejecución: ${new Date(response.updatedRecurringTransaction.nextRunDate + 'T00:00:00Z').toLocaleDateString('es-AR')}.`
            );
            fetchRecurringTransactions(); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al registrar manualmente.';
            setError(errorMessage);
            alertService.showErrorAlert('Error al Registrar', errorMessage);
            setLoading(false); // Asegurar que loading se quite
        }
    }
  };
  
  const handleRecurringTransactionModified = () => { // Para crear y actualizar
    fetchRecurringTransactions(); 
  };

  // *** NUEVA FUNCIÓN PARA ABRIR EL MODAL DE EDICIÓN ***
  const handleOpenEditModal = (transactionToEdit) => {
    openModal(MODAL_TYPES.EDIT_RECURRING_TRANSACTION, {
      recurringTransactionData: transactionToEdit,
      onRecurringTransactionUpdated: handleRecurringTransactionModified
    });
  };

  if (loading && recurringTxs.length === 0) {
    return <div className="page-container recurring-transactions-page-loading"><p className="loading-text">Cargando movimientos recurrentes...</p></div>;
  }

  return (
    <div className="page-container recurring-transactions-page">
      <div className="page-header" style={{ display: 'none' }}>
        <h1>Movimientos Recurrentes</h1>
      </div>

      <div className="recurring-actions-bar">
        <button 
          onClick={() => openModal(MODAL_TYPES.ADD_RECURRING_TRANSACTION, { 
            onRecurringTransactionCreated: handleRecurringTransactionModified
          })} 
          className="button button-primary-action-bar"
        >
          <span className="icon-add">➕</span> Nuevo Recurrente
        </button>
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

      {loading && <p className="loading-text" style={{padding:'10px 0'}}>Actualizando lista...</p>} 

      {!loading && recurringTxs.length === 0 && !error && (
        <p className="no-data-message">No tienes movimientos recurrentes configurados {filter !== 'all' ? `con el filtro "${filter}"` : ''}.</p>
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
              onEdit={handleOpenEditModal} // *** PASAR LA NUEVA FUNCIÓN ***
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionsPage;