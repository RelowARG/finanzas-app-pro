// Ruta: src/components/dashboard/RecentTransactions.jsx
import React, { useState, useEffect } from 'react';
import transactionService from '../../services/transactions.service';
import DashboardTransactionItem from './DashboardTransactionItem'; // Importar el nuevo item
import './DashboardComponents.css'; 

const RecentTransactions = ({ loading: propLoading }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecent = async () => {
      if (propLoading) return; 
      setLoading(true);
      setError('');
      try {
        const data = await transactionService.getAllTransactions({ page: 1, limit: 5 }); // Obtener 5 recientes
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Error fetching recent transactions for dashboard:", err);
        setError('No se pudieron cargar los últimos movimientos.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (propLoading === undefined || !propLoading) {
        fetchRecent();
    } else if (propLoading === false) { 
        fetchRecent();
    }
    
  }, [propLoading]); 

  if (loading) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Registros</h3> {/* Cambiado el título a "Últimos Registros" */}
        <p className="loading-text-widget">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Registros</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Registros</h3>
        <p className="no-data-widget">No hay transacciones recientes.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-widget recent-transactions-widget">
      <h3>Últimos Registros</h3>
      <ul className="transactions-list"> {/* Esta clase ahora tiene estilos en DashboardComponents.css */}
        {transactions.map(tx => (
          <DashboardTransactionItem key={tx.id} transaction={tx} /> // Usar el nuevo componente
        ))}
      </ul>
    </div>
  );
};

export default RecentTransactions;