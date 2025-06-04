// Ruta: finanzas-app-pro/frontend/src/pages/InvestmentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import investmentsService from '../services/investments.service';
// import accountService from '../services/accounts.service'; // Ya no se usa aquí directamente
import InvestmentListItem from '../components/investments/InvestmentListItem';
import PortfolioSummary from '../components/investments/PortfolioSummary';
import { alertService } from '../utils/alert.service';
import './InvestmentsPage.css';
import InvestmentDetailModal from '../components/investments/InvestmentDetailModal'; 

// *** RUTA DE IMPORTACIÓN CORREGIDA ***
// Antes era: import exchangeRatesService from '../../services/exchangeRates.service';
// Ahora es:
// No se necesita exchangeRatesService directamente en InvestmentsPage.jsx
// ya que PortfolioSummary.jsx lo maneja internamente.
// Si lo necesitaras por alguna otra razón, la ruta correcta sería:
// import exchangeRatesService from '../services/exchangeRates.service';


const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  // Ya no necesitamos allUserAccounts aquí si PortfolioSummary no lo recibe
  // const [allUserAccounts, setAllUserAccounts] = useState([]); 
  const [loadingPage, setLoadingPage] = useState(true);
  const [isUpdatingQuotes, setIsUpdatingQuotes] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedInvestmentForModal, setSelectedInvestmentForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoadingPage(true);
    setIsUpdatingQuotes(true);
    setError('');
    try {
      console.log('[InvestmentsPage] Disparando actualización de cotizaciones en el backend...');
      await investmentsService.triggerUpdateQuotes();
      console.log('[InvestmentsPage] Actualización de cotizaciones del backend completada (o intentada).');
      
      // Solo obtener inversiones, ya no las cuentas aquí para PortfolioSummary
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
  
  const openInvestmentDetailModal = (investment) => {
    setSelectedInvestmentForModal(investment);
    setIsDetailModalOpen(true);
  };

  const closeInvestmentDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInvestmentForModal(null);
    // Opcional: si el modal puede modificar datos que afecten la lista o el resumen, refrescar.
    // fetchAllData(false); 
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
          <Link to="/investments/add" className={`button button-primary ${isUpdatingQuotes || loadingPage ? 'disabled-link' : ''}`} aria-disabled={isUpdatingQuotes || loadingPage}>
            <span className="icon-add">➕</span> Nueva Inversión
          </Link>
        </div>
      </div>
      
      {isUpdatingQuotes && !loadingPage && <p className="loading-text-inline">{statusMessage}</p>}
      {error && <p className="error-message">{error}</p>}
      {lastUpdated && !loadingPage && !isUpdatingQuotes && (
        <p className="last-updated-notice">
          Datos actualizados a las: {lastUpdated.toLocaleTimeString('es-AR')}
        </p>
      )}

      {/* PortfolioSummary ya no necesita allUserAccounts */}
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
            />
          ))}
        </div>
      ) : (
        !loadingPage && !isUpdatingQuotes && !error && (
            <div className="no-investments-message-container"> 
                 <p className="no-investments-message">Aún no has registrado ninguna inversión.</p>
                 <Link to="/investments/add" className="button button-secondary" style={{marginTop: '15px'}}>
                    Registrar mi primera inversión
                 </Link>
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
