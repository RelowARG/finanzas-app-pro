// Ruta: /frontend/src/pages/InvestmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import investmentsService from '../services/investments.service';
import InvestmentListItem from '../components/investments/InvestmentListItem';
import PortfolioSummary from '../components/investments/PortfolioSummary';
import { alertService } from '../utils/alert.service';
import { useModals, MODAL_TYPES } from '../contexts/ModalContext';
import './InvestmentsPage.css';
import InvestmentDetailModal from '../components/investments/InvestmentDetailModal'; 

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [isUpdatingQuotes, setIsUpdatingQuotes] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedInvestmentForModal, setSelectedInvestmentForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { openModal } = useModals();

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoadingPage(true);
    setIsUpdatingQuotes(true);
    setError('');
    try {
      console.log('[InvestmentsPage] Disparando actualización de cotizaciones en el backend...');
      await investmentsService.triggerUpdateQuotes();
      console.log('[InvestmentsPage] Actualización de cotizaciones del backend completada (o intentada).');
      
      const investmentsData = await investmentsService.getAllInvestments();

      setInvestments(investmentsData || []);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar datos de inversiones.';
      setError(errorMessage);
      console.error('[InvestmentsPage] Error en fetchAllData:', err);
    } finally {
      if (isInitialLoad) setLoadingPage(false);
      setIsUpdatingQuotes(false);
    }
  }, []); 

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const handleManualRefresh = () => {
    fetchAllData(false);
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
        setIsUpdatingQuotes(true); 
        setError('');
        await investmentsService.deleteInvestment(investmentId);
        alertService.showSuccessToast('Eliminada', 'Inversión eliminada correctamente.');
        await fetchAllData(false); 
      } catch (err) {
        const deleteError = err.response?.data?.message || err.message || 'Error al eliminar la inversión.';
        setError(deleteError);
        alertService.showErrorAlert('Error al Eliminar', deleteError);
      } finally {
        setIsUpdatingQuotes(false);
      }
    }
  };

  const handleInvestmentModified = () => {
    fetchAllData(false);
  };
  
  const handleOpenEditModal = (investment) => {
    openModal(MODAL_TYPES.EDIT_INVESTMENT, {
      investmentData: investment,
      onInvestmentUpdated: handleInvestmentModified
    });
  };

  const openInvestmentDetailModal = (investment) => {
    setSelectedInvestmentForModal(investment);
    setIsDetailModalOpen(true);
  };

  const closeInvestmentDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInvestmentForModal(null);
  };

  let statusMessage = "";
  if (loadingPage) statusMessage = "Cargando...";
  else if (isUpdatingQuotes) statusMessage = "Actualizando cotizaciones...";

  if (loadingPage && investments.length === 0) { 
    return ( 
        <div className="page-container investments-page">
             <div className="investments-page-header"><h1>Portafolio</h1></div>
             <p className="loading-text">{statusMessage}</p>
        </div>
    );
  }

  return (
    <div className="page-container investments-page">
      <div className="investments-page-header">
        <h1>Portafolio</h1>
        <div className="header-actions">
          <button 
            onClick={handleManualRefresh} 
            className="button button-secondary" 
            disabled={isUpdatingQuotes || loadingPage} 
            style={{marginRight: '10px'}}
          >
            {isUpdatingQuotes ? 'Actualizando...' : (loadingPage ? 'Cargando...' : 'Refrescar')}
          </button>
          <button
            onClick={() => openModal(MODAL_TYPES.ADD_INVESTMENT, { onInvestmentCreated: handleInvestmentModified })}
            className={`button button-primary ${isUpdatingQuotes || loadingPage ? 'disabled-link' : ''}`}
            disabled={isUpdatingQuotes || loadingPage}
          >
            <span className="icon-add">➕</span> Nueva Inversión
          </button>
        </div>
      </div>
      
      {isUpdatingQuotes && !loadingPage && <p className="loading-text-inline">{statusMessage}</p>}
      {error && <p className="error-message">{error}</p>}
      {lastUpdated && !loadingPage && !isUpdatingQuotes && (
        <p className="last-updated-notice">
          Datos actualizados a las: {lastUpdated.toLocaleTimeString('es-AR')}
        </p>
      )}

      {!loadingPage && (
        <PortfolioSummary investments={investments} /> 
      )}
      
      {investments.length > 0 && !loadingPage && (
        <h3 className="instruments-list-title">Mis Instrumentos ({investments.length})</h3>
      )}

      {investments.length > 0 && !loadingPage ? (
        <div className="investments-list-container"> 
          {investments.map(investment => (
            <InvestmentListItem 
              key={investment.id} 
              investment={investment} 
              onDeleteInvestment={handleDeleteInvestment}
              onItemClick={() => openInvestmentDetailModal(investment)}
              onEdit={() => handleOpenEditModal(investment)}
            />
          ))}
        </div>
      ) : (
        !loadingPage && !isUpdatingQuotes && !error && (
            <div className="no-investments-message-container"> 
                 <p className="no-investments-message">Aún no has registrado ninguna inversión.</p>
                 <button onClick={() => openModal(MODAL_TYPES.ADD_INVESTMENT, { onInvestmentCreated: handleInvestmentModified })} className="button button-secondary" style={{marginTop: '15px'}}>
                    Registrar mi primera inversión
                 </button>
            </div>
        )
      )}

      {isDetailModalOpen && selectedInvestmentForModal && (
        <InvestmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeInvestmentDetailModal}
          investment={selectedInvestmentForModal}
        />
      )}
    </div>
  );
};

export default InvestmentsPage;