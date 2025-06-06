import React, { useState, useEffect, useCallback } from 'react';
// *** CORRECCIÓN: Añadir useNavigate a los imports ***
import { useLocation, useNavigate } from 'react-router-dom';
import transactionService from '../services/transactions.service';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFilter from '../components/transactions/TransactionFilter';
import { formatCurrency } from '../utils/formatters';
import { useModals, MODAL_TYPES } from '../contexts/ModalContext';
import './TransactionsPage.css';

const ITEMS_PER_PAGE = 15;

const TransactionsPage = () => {
  const location = useLocation();
  // *** CORRECCIÓN: Declarar la función navigate ***
  const navigate = useNavigate();
  const { openModal } = useModals();

  const getInitialFiltersFromURL = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return {
      type: params.get('type') || '',
      accountId: params.get('accountId') || '',
      categoryId: params.get('categoryId') || '',
      dateFrom: params.get('dateFrom') || '',
      dateTo: params.get('dateTo') || '',
      searchTerm: params.get('searchTerm') || '',
    };
  }, [location.search]);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [totalIncomeFiltered, setTotalIncomeFiltered] = useState(0);
  const [totalExpensesFiltered, setTotalExpensesFiltered] = useState(0);
  const [totalNetFiltered, setTotalNetFiltered] = useState(0);

  const [activeFilters, setActiveFilters] = useState(getInitialFiltersFromURL);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'DESC' });

  const fetchTransactions = useCallback(async (filters, page, currentSortConfig) => {
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
      const data = await transactionService.getAllTransactions(paramsToFetch);
      
      setTransactions(data.transactions || []);
      setTotalPages(Number(data.totalPages) || 0); 
      setCurrentPage(Number(data.currentPage) || 1); 
      setTotalTransactions(Number(data.totalTransactions) || 0); 

      setTotalIncomeFiltered(Number(data.totalIncomeFiltered) || 0);
      setTotalExpensesFiltered(Number(data.totalExpensesFiltered) || 0);
      setTotalNetFiltered(Number(data.totalNetFiltered) || 0);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los movimientos.');
      setTransactions([]);
      setTotalPages(0);
      setCurrentPage(1); 
      setTotalIncomeFiltered(0);
      setTotalExpensesFiltered(0);
      setTotalNetFiltered(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveFilters(getInitialFiltersFromURL());
  }, [location.search, getInitialFiltersFromURL]);

  useEffect(() => {
    fetchTransactions(activeFilters, currentPage, sortConfig); 
  }, [fetchTransactions, activeFilters, currentPage, sortConfig]); 

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    // Limpiamos los parámetros vacíos para no ensuciar la URL
    for(let key of Object.keys(newFilters)) {
        if(newFilters[key]) {
            params.set(key, newFilters[key]);
        }
    }
    // La función navigate ya está declarada arriba y funcionará
    navigate(`?${params.toString()}`, { replace: true });
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
        await transactionService.deleteTransaction(transactionId);
        if (transactions.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1); 
        } else {
          fetchTransactions(activeFilters, currentPage, sortConfig); 
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar el movimiento.');
        setLoading(false); 
      }
    }
  };
  
  const handleTransactionCreatedFromModal = () => {
    fetchTransactions(activeFilters, 1, sortConfig);
  };

  const getPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; 
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= 0) return []; 

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
  
  const paginationItems = getPaginationNumbers();

  return (
    <div className="page-container transactions-page">
      <div className="transactions-page-header">
        <h1>Movimientos</h1>
        <button 
          onClick={() => openModal(MODAL_TYPES.ADD_TRANSACTION, { 
            onTransactionCreated: handleTransactionCreatedFromModal,
            initialTypeFromButton: 'egreso'
          })} 
          className="button button-primary"
        >
          <span className="icon-add">➕</span> Nuevo Movimiento
        </button>
      </div>

      {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}

      <TransactionFilter 
        onFilterChange={handleFilterChange} 
        initialFilters={activeFilters} 
      />

      {!loading && (totalIncomeFiltered > 0 || totalExpensesFiltered > 0) && (
        <div className="transactions-summary">
          <span>
            Ingresos (filtrado): 
            <strong className="amount-positive">{formatCurrency(totalIncomeFiltered, 'ARS')}</strong>
          </span>
          <span>
            Egresos (filtrado): 
            <strong className="amount-negative">{formatCurrency(totalExpensesFiltered, 'ARS')}</strong>
          </span>
          <span>
            Neto (filtrado): 
            <strong className={ totalNetFiltered >= 0 ? "amount-positive" : "amount-negative"}>
              {formatCurrency(totalNetFiltered, 'ARS')}
            </strong>
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