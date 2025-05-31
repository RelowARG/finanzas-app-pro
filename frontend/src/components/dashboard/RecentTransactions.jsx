// Ruta: finanzas-app-pro/frontend/src/components/dashboard/RecentTransactions.jsx
// ACTUALIZA ESTE ARCHIVO
import React, { useState, useEffect } from 'react'; // Importar useState y useEffect
import transactionService from '../../services/transactions.service'; // Importar el servicio real
import './DashboardComponents.css'; // Asumiendo que este CSS ya existe y es relevante

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${value < 0 ? '-' : ''}${symbol} ${Math.abs(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    // year: 'numeric', // Podríamos omitir el año para ahorrar espacio en el dashboard
  });
};

const RecentTransactions = ({ loading: propLoading }) => { // Recibir prop de carga si DashboardPage la maneja
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecent = async () => {
      if (propLoading) return; // Si la página principal ya está cargando, esperar
      setLoading(true);
      setError('');
      try {
        // Usar getAllTransactions con límite y ordenado por fecha (el backend ya lo hace por defecto)
        const data = await transactionService.getAllTransactions({ page: 1, limit: 5 });
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Error fetching recent transactions for dashboard:", err);
        setError('No se pudieron cargar los últimos movimientos.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    // Solo llamar si propLoading es false, o si no se pasa propLoading
    if (propLoading === undefined || !propLoading) {
        fetchRecent();
    } else if (propLoading === false) { // Si DashboardPage terminó su carga principal
        fetchRecent();
    }
    
  }, [propLoading]); // Depender de propLoading si se pasa

  if (loading) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Movimientos</h3>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Movimientos</h3>
        <p className="error-message" style={{textAlign: 'center'}}>{error}</p>
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="dashboard-widget recent-transactions-widget">
        <h3>Últimos Movimientos</h3>
        <p>No hay transacciones recientes.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-widget recent-transactions-widget">
      <h3>Últimos Movimientos</h3>
      <ul className="transactions-list">
        {transactions.map(tx => (
          <li key={tx.id} className={`transaction-item ${tx.type}`}>
            <span className="transaction-icon">{tx.icon || tx.category?.icon || (tx.type === 'ingreso' ? '🟢' : '🔴')}</span>
            <div className="transaction-info">
              <span className="transaction-description">{tx.description}</span>
              <span className="transaction-category">{tx.category?.name || 'Sin Categoría'}</span>
            </div>
            <div className="transaction-details">
              <span className={`transaction-amount ${tx.type === 'ingreso' ? 'text-positive' : 'text-negative'}`}>
                {formatCurrency(tx.amount, tx.currency)}
              </span>
              <span className="transaction-date">{formatDate(tx.date)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentTransactions;