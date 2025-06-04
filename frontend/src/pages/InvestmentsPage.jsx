// Ruta: finanzas-app-pro/frontend/src/pages/InvestmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import investmentsService from '../services/investments.service'; //
import InvestmentCard from '../components/investments/InvestmentCard'; //
import InvestmentSummary from '../components/investments/InvestmentSummary'; //
import { alertService } from '../utils/alert.service'; //
import './InvestmentsPage.css'; //

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true); // Para la carga inicial de la página
  const [isUpdatingQuotes, setIsUpdatingQuotes] = useState(false); // Para el proceso de actualización de cotizaciones
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInvestmentsAndQuotes = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoadingPage(true);
    }
    setIsUpdatingQuotes(true); // Indicar que estamos actualizando cotizaciones
    setError('');

    try {
      // 1. Primero, intentar actualizar las cotizaciones en el backend
      // El backend ahora usa Yahoo Finance y no simula si falla
      console.log('[InvestmentsPage] Disparando actualización de cotizaciones en el backend...');
      await investmentsService.triggerUpdateQuotes(); //
      console.log('[InvestmentsPage] Actualización de cotizaciones del backend completada (o intentada).');
      
      // 2. Luego, obtener todas las inversiones (que ahora deberían tener precios más recientes)
      console.log('[InvestmentsPage] Obteniendo lista actualizada de inversiones...');
      const data = await investmentsService.getAllInvestments(); //
      setInvestments(data || []);
      setLastUpdated(new Date());
      console.log('[InvestmentsPage] Inversiones cargadas/actualizadas.');

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar o actualizar las inversiones.';
      console.error('[InvestmentsPage] Error:', errorMessage, err);
      setError(errorMessage);
      // No reseteamos investments aquí para que el usuario pueda ver los datos viejos si el refresh falla
    } finally {
      if (isInitialLoad) {
        setLoadingPage(false);
      }
      setIsUpdatingQuotes(false); // Terminar el indicador de actualización de cotizaciones
    }
  }, []); 

  useEffect(() => {
    fetchInvestmentsAndQuotes(true); // Llamar en la carga inicial
  }, [fetchInvestmentsAndQuotes]);

  const handleManualRefresh = () => {
    fetchInvestmentsAndQuotes(false); // No mostrar el loader de página completa para refresh manual
  };

  const handleDeleteInvestment = async (investmentId) => {
    const result = await alertService.showConfirmationDialog({
        title: 'Confirmar Eliminación',
        text: '¿Estás seguro de que quieres eliminar esta inversión? Esta acción no se puede deshacer.',
        confirmButtonText: 'Sí, eliminar',
        icon: 'warning',
    });
    
    if (result.isConfirmed) {
      try {
        // No setLoadingPage(true) para que la página no se quede en blanco
        setIsUpdatingQuotes(true); // Indicar actividad
        setError('');
        await investmentsService.deleteInvestment(investmentId); //
        alertService.showSuccessToast('Eliminada', 'Inversión eliminada correctamente.'); //
        await fetchInvestmentsAndQuotes(false); // Volver a cargar todo después de eliminar
      } catch (err) {
        const deleteError = err.response?.data?.message || err.message || 'Error al eliminar la inversión.';
        setError(deleteError);
        alertService.showErrorAlert('Error al Eliminar', deleteError); //
      } finally {
        setIsUpdatingQuotes(false);
      }
    }
  };

  // Mensaje de estado para el botón de refrescar y para el usuario
  let statusMessage = "";
  if (loadingPage) {
    statusMessage = "Cargando inversiones y cotizaciones...";
  } else if (isUpdatingQuotes) {
    statusMessage = "Actualizando cotizaciones...";
  }


  if (loadingPage && investments.length === 0) { 
    return (
      <div className="page-container investments-page"> {/* */}
        <div className="investments-page-header"> {/* */}
          <h1>Mis Inversiones</h1>
        </div>
        <p className="loading-text">{statusMessage}</p> {/* */}
      </div>
    );
  }

  return (
    <div className="page-container investments-page"> {/* */}
      <div className="investments-page-header"> {/* */}
        <h1>Mis Inversiones</h1>
        <div className="header-actions"> {/* */}
          <button 
            onClick={handleManualRefresh} 
            className="button button-secondary" 
            disabled={isUpdatingQuotes || loadingPage} 
            style={{marginRight: '10px'}}
          >
            {isUpdatingQuotes ? 'Actualizando...' : (loadingPage ? 'Cargando...' : 'Refrescar Cotizaciones')}
          </button>
          <Link to="/investments/add" className={`button button-primary ${isUpdatingQuotes || loadingPage ? 'disabled-link' : ''}`} aria-disabled={isUpdatingQuotes || loadingPage}>
            <span className="icon-add">➕</span> Registrar Inversión
          </Link>
        </div>
      </div>
      {lastUpdated && !loadingPage && (
        <p className="last-updated-notice"> {/* */}
          Cotizaciones actualizadas por última vez a las: {lastUpdated.toLocaleTimeString('es-AR')}
        </p>
      )}
      {/* Mostrar mensaje de actualización si solo está actualizando cotizaciones y no es la carga inicial */}
      {isUpdatingQuotes && !loadingPage && <p className="loading-text" style={{fontSize: '0.9rem', fontStyle: 'italic'}}>{statusMessage}</p>}


      {error && <p className="error-message" style={{textAlign: 'center', marginBottom: '15px'}}>{error}</p>}

      <InvestmentSummary investments={investments} /> {/* */}

      {investments.length > 0 ? (
        <div className="investments-grid"> {/* */}
          {investments.map(investment => (
            <InvestmentCard //
              key={investment.id} 
              investment={investment} 
              onDeleteInvestment={handleDeleteInvestment}
            />
          ))}
        </div>
      ) : (
        !loadingPage && !isUpdatingQuotes && !error && <p className="no-investments-message">Aún no has registrado ninguna inversión.</p> /* */
      )}
    </div>
  );
};

export default InvestmentsPage;