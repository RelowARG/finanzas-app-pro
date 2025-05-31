// Ruta: finanzas-app-pro/frontend/src/pages/InvestmentsPage.jsx
// ACTUALIZA ESTE ARCHIVO
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import investmentsService from '../services/investments.service';
import InvestmentCard from '../components/investments/InvestmentCard';
import InvestmentSummary from '../components/investments/InvestmentSummary';
import './InvestmentsPage.css';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await investmentsService.getAllInvestments();
      setInvestments(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las inversiones.');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleRefreshClick = () => {
    fetchInvestments(); 
  };

  const handleDeleteInvestment = async (investmentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta inversión? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true); // O un estado de carga específico para la eliminación
        setError('');
        await investmentsService.deleteInvestment(investmentId);
        // Mostrar mensaje de éxito (ej: con un toast/notificación)
        fetchInvestments(); // Volver a cargar la lista de inversiones
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar la inversión.');
        console.error("Error deleting investment:", err.response?.data || err);
        setLoading(false); 
      }
    }
  };

  if (loading && investments.length === 0) { 
    return (
      <div className="page-container investments-page">
        <div className="investments-page-header">
          <h1>Mis Inversiones</h1>
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
          <button onClick={handleRefreshClick} className="button button-secondary" disabled={loading} style={{marginRight: '10px'}}>
            {loading ? 'Actualizando...' : 'Refrescar Datos'}
          </button>
          <Link to="/investments/add" className="button button-primary">
            <span className="icon-add">➕</span> Registrar Inversión
          </Link>
        </div>
      </div>
      {lastUpdated && !loading && (
        <p className="last-updated-notice">
          Datos cargados a las: {lastUpdated.toLocaleTimeString('es-AR')}
        </p>
      )}

      {error && <p className="error-message">{error}</p>}

      <InvestmentSummary investments={investments} />

      {investments.length > 0 ? (
        <div className="investments-grid">
          {investments.map(investment => (
            <InvestmentCard 
              key={investment.id} 
              investment={investment} 
              onDeleteInvestment={handleDeleteInvestment} // Pasar la función
            />
          ))}
        </div>
      ) : (
        !loading && !error && <p className="no-investments-message">Aún no has registrado ninguna inversión.</p>
      )}
    </div>
  );
};

export default InvestmentsPage;