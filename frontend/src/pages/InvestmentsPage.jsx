// Ruta: finanzas-app-pro/frontend/src/pages/InvestmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import investmentsService from '../services/investments.service';
import InvestmentCard from '../components/investments/InvestmentCard';
import InvestmentSummary from '../components/investments/InvestmentSummary';
import { alertService } from '../utils/alert.service';
import './InvestmentsPage.css';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true); // Para la carga inicial de la página
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null); // Hora de la última carga de datos locales
  const [isUpdatingQuotes, setIsUpdatingQuotes] = useState(false); // Para el spinner del botón de actualizar cotizaciones

  const fetchInvestments = useCallback(async (showPageLoader = false) => {
    if (showPageLoader) {
      setLoading(true); // Mostrar loader de página completa solo si se indica
    }
    setError('');
    try {
      const data = await investmentsService.getAllInvestments();
      setInvestments(data || []);
      setLastUpdated(new Date()); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las inversiones.');
      setInvestments([]);
    } finally {
      if (showPageLoader) {
        setLoading(false);
      }
    }
  }, []); 

  useEffect(() => {
    fetchInvestments(true); // Mostrar loader de página en la carga inicial
  }, [fetchInvestments]);

  const handleRefreshQuotes = async () => { // Cambiado el nombre de la función
    setIsUpdatingQuotes(true); 
    setError('');
    try {
      const updateResult = await investmentsService.triggerUpdateQuotes();
      alertService.showSuccessToast('Cotizaciones Actualizadas', updateResult.message || 'Los precios de mercado han sido actualizados.');
      // Después de actualizar cotizaciones en el backend, volvemos a pedir las inversiones
      await fetchInvestments(false); // No mostrar loader de página completa para este refresh
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar las cotizaciones desde el mercado.';
      setError(errorMessage); // Mostrar error en la página
      alertService.showErrorAlert('Error de Actualización', errorMessage);
    } finally {
      setIsUpdatingQuotes(false); 
    }
  };

  const handleDeleteInvestment = async (investmentId) => {
    const result = await alertService.showConfirmationDialog({
        title: 'Confirmar Eliminación',
        text: '¿Estás seguro de que quieres eliminar esta inversión? Esta acción no se puede deshacer.',
        confirmButtonText: 'Sí, eliminar',
        icon: 'warning', // Puedes usar 'error' o 'warning'
    });

    if (result.isConfirmed) {
        try {
            setIsUpdatingQuotes(true); // Usar el mismo estado para indicar actividad
            setError('');
            await investmentsService.deleteInvestment(investmentId);
            alertService.showSuccessToast('Eliminada', 'Inversión eliminada correctamente.');
            await fetchInvestments(false); 
        } catch (err) {
            const deleteError = err.response?.data?.message || err.message || 'Error al eliminar la inversión.';
            setError(deleteError);
            alertService.showErrorAlert('Error al Eliminar', deleteError);
        } finally {
            setIsUpdatingQuotes(false);
        }
    }
  };

  if (loading) { // Mostrar loader de página completa solo durante la carga inicial
    return (
      <div className="page-container investments-page">
        <div className="investments-page-header">
          <h1>Mis Inversiones</h1>
          {/* No mostrar botones de acción mientras carga inicialmente */}
        </div>
        <p className="loading-text">Cargando inversiones...</p>
      </div>
    );
  }

  return (
    <div className="page-container investments-page">
      <div className="investments-page-header">
        <h1>Mis Inversiones</h1>
        <div className="header-actions">
          <button 
            onClick={handleRefreshQuotes} 
            className="button button-secondary" 
            disabled={isUpdatingQuotes} 
            style={{marginRight: '10px'}}
          >
            {isUpdatingQuotes ? 'Actualizando Cotizaciones...' : 'Refrescar Cotizaciones'}
          </button>
          <Link to="/investments/add" className={`button button-primary ${isUpdatingQuotes ? 'disabled-link' : ''}`} aria-disabled={isUpdatingQuotes}>
            <span className="icon-add">➕</span> Registrar Inversión
          </Link>
        </div>
      </div>
      {lastUpdated && (
        <p className="last-updated-notice">
          Datos locales cargados a las: {lastUpdated.toLocaleTimeString('es-AR')}
        </p>
      )}

      {error && <p className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>{error}</p>}

      <InvestmentSummary investments={investments} />

      {investments.length > 0 ? (
        <div className="investments-grid">
          {investments.map(investment => (
            <InvestmentCard 
              key={investment.id} 
              investment={investment} 
              onDeleteInvestment={handleDeleteInvestment}
            />
          ))}
        </div>
      ) : (
        !isUpdatingQuotes && !error && <p className="no-investments-message">Aún no has registrado ninguna inversión.</p>
      )}
    </div>
  );
};

export default InvestmentsPage;