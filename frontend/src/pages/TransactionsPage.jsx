// Ruta: finanzas-app-pro/frontend/src/pages/TransactionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import transactionService from '../services/transactions.service'; //
import TransactionList from '../components/transactions/TransactionList'; //
import TransactionFilter from '../components/transactions/TransactionFilter'; //
import './TransactionsPage.css'; //

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

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'DESC' });

  const fetchTransactions = useCallback(async (filters, page = 1, currentSortConfig) => {
    setLoading(true);
    setError('');
    try {
      const paramsToFetch = { 
        ...filters, 
        page, 
        limit: ITEMS_PER_PAGE,
        sortBy: currentSortConfig.key,      
        sortOrder: currentSortConfig.direction 
      };
      const data = await transactionService.getAllTransactions(paramsToFetch); //
      
      // Asegurarse de que los valores sean numéricos y tengan defaults
      setTransactions(data.transactions || []);
      setTotalPages(Number(data.totalPages) || 0); // Convertir a número y default a 0
      setCurrentPage(Number(data.currentPage) || 1); // Convertir a número y default a 1
      setTotalTransactions(Number(data.totalTransactions) || 0); // Convertir a número y default a 0

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los movimientos.');
      setTransactions([]);
      setTotalPages(0);
      setCurrentPage(1); // Resetear a 1 en caso de error
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchTransactions(activeFilters, currentPage, sortConfig); 
  }, [fetchTransactions, activeFilters, currentPage, sortConfig]); 

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setCurrentPage(1); 
  };
  
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer y afectará el saldo de la cuenta asociada.')) {
      try {
        setLoading(true); 
        setError('');
        await transactionService.deleteTransaction(transactionId); //
        if (transactions.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1); 
        } else {
          // Volver a llamar a fetchTransactions explícitamente en lugar de depender solo del cambio de estado
          // para asegurar que se recargue con los parámetros correctos.
          fetchTransactions(activeFilters, currentPage, sortConfig); 
        }
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

  const getPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; 
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= 0) return []; // Si no hay páginas, no mostrar nada

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= halfPagesToShow + 1) {
        for (let i = 1; i <= maxPagesToShow - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } 
      else if (currentPage >= totalPages - halfPagesToShow) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } 
      else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - (halfPagesToShow - 1) ; i <= currentPage + (halfPagesToShow - 1); i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };
  
  // Generar los números de página una sola vez por render
  const paginationItems = getPaginationNumbers();

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
            onSort={handleSort}         
            sortConfig={sortConfig}     
        />
      )}
      
      {/* Renderizado de Paginación */}
      {!loading && totalPages > 0 && (
        <>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              className="pagination-arrow"
              aria-label="Página anterior"
            >
              &lt;
            </button>

            {paginationItems.map((page, index) => 
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={currentPage === page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              )
            )}

            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="pagination-arrow"
              aria-label="Página siguiente"
            >
              &gt;
            </button>
          </div>
          <p className="pagination-info">
              Página {currentPage} de {totalPages} (Total: {totalTransactions} mov.)
          </p>
        </>
      )}
    </div>
  );
};

export default TransactionsPage;