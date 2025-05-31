// Ruta: finanzas-app-pro/frontend/src/pages/TransactionsPage.jsx
// ACTUALIZA ESTE ARCHIVO
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transactionService from '../services/transactions.service';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFilter from '../components/transactions/TransactionFilter';
import './TransactionsPage.css'; // Asegúrate de que este archivo exista

const ITEMS_PER_PAGE = 15; // O el límite que prefieras

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [activeFilters, setActiveFilters] = useState({
    type: '', 
    accountId: '', 
    categoryId: '', 
    dateFrom: '', 
    dateTo: '', 
    searchTerm: '',
  });

  const fetchTransactions = useCallback(async (filters, page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await transactionService.getAllTransactions({ ...filters, page, limit: ITEMS_PER_PAGE });
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
      setTotalTransactions(data.totalTransactions || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los movimientos.');
      setTransactions([]);
      setTotalPages(0);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(activeFilters, currentPage);
  }, [fetchTransactions, activeFilters, currentPage]);

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
    // fetchTransactions(newFilters, 1); // Se disparará por el useEffect de activeFilters o currentPage
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // fetchTransactions(activeFilters, newPage); // Se disparará por el useEffect de currentPage
    }
  };
  
  // Calcular totales (se mantiene en el frontend, pero ahora sobre los datos paginados/filtrados)
  const totals = React.useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'ingreso') acc.ingresos += parseFloat(tx.amount);
      if (tx.type === 'egreso') acc.egresos += parseFloat(tx.amount); // amount ya es negativo
      return acc;
    }, { ingresos: 0, egresos: 0 });
  }, [transactions]);

  return (
    <div className="page-container transactions-page">
      <div className="transactions-page-header">
        <h1>Movimientos</h1>
        <Link to="/transactions/add" className="button button-primary">
          <span className="icon-add">➕</span> Nuevo Movimiento
        </Link>
      </div>

      {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}

      <TransactionFilter 
        onFilterChange={handleFilterChange} 
        initialFilters={activeFilters} 
      />

      {/* Solo mostrar resumen si hay transacciones y no hay error */}
      {!loading && !error && transactions.length > 0 && (
        <div className="transactions-summary">
          <span>Ingresos (pág.): <span className="amount-positive">${totals.ingresos.toFixed(2)}</span></span>
          <span>Egresos (pág.): <span className="amount-negative">${Math.abs(totals.egresos).toFixed(2)}</span></span>
          <span>Neto (pág.): <span className={ (totals.ingresos + totals.egresos) >= 0 ? "amount-positive" : "amount-negative"}>
              ${(totals.ingresos + totals.egresos).toFixed(2)}
            </span>
          </span>
        </div>
      )}
      
      {loading ? (
        <p className="loading-text">Cargando movimientos...</p>
      ) : (
        <TransactionList transactions={transactions} />
      )}

      {!loading && totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="button button-secondary"
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages} (Total: {totalTransactions} mov.)</span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="button button-secondary"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;