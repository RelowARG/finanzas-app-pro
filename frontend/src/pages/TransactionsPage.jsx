// Ruta: finanzas-app-pro/frontend/src/pages/TransactionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transactionService from '../services/transactions.service'; // [cite: finanzas-app-pro/frontend/src/services/transactions.service.js]
import TransactionList from '../components/transactions/TransactionList'; // [cite: finanzas-app-pro/frontend/src/components/transactions/TransactionList.jsx]
import TransactionFilter from '../components/transactions/TransactionFilter'; // [cite: finanzas-app-pro/frontend/src/components/transactions/TransactionFilter.jsx]
import './TransactionsPage.css'; // [cite: finanzas-app-pro/frontend/src/pages/TransactionsPage.css]

const ITEMS_PER_PAGE = 15; 

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
      const data = await transactionService.getAllTransactions({ ...filters, page, limit: ITEMS_PER_PAGE }); // [cite: finanzas-app-pro/frontend/src/services/transactions.service.js]
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
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer y afectará el saldo de la cuenta asociada.')) {
      try {
        setLoading(true); 
        setError('');
        await transactionService.deleteTransaction(transactionId); // [cite: finanzas-app-pro/frontend/src/services/transactions.service.js]
        fetchTransactions(activeFilters, currentPage); 
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar el movimiento.');
        setLoading(false); 
      }
    }
  };
  
  const totals = React.useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const amount = parseFloat(tx.amount) || 0;
      if (tx.type === 'ingreso') acc.ingresos += amount;
      if (tx.type === 'egreso') acc.egresos += amount; 
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
        <TransactionList 
            transactions={transactions} 
            onDeleteTransaction={handleDeleteTransaction} 
        />
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