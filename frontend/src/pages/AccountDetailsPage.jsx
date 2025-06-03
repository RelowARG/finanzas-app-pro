// Ruta: frontend/src/pages/AccountDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import accountService from '../services/accounts.service';
import transactionService from '../services/transactions.service';
import accountTrendService from '../services/accountTrend.service'; 
import PayCreditCardModal from '../components/accounts/PayCreditCardModal';
import EditAccountModal from '../components/accounts/EditAccountModal'; // *** NUEVO IMPORT ***
import { formatCurrency } from '../utils/formatters';
import AccountTrendChart from '../components/accounts/AccountTrendChart'; 
import { useModals, MODAL_TYPES } from '../contexts/ModalContext'; // Para PayCreditCardModal si se globaliza

import './EditAccountPage.css'; 

const AccountDetailsPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('balance'); 
  
  // const [showPayModal, setShowPayModal] = useState(false); // Se manejará por ModalContext
  const [showEditModal, setShowEditModal] = useState(false); // Estado para el modal de edición

  const { openModal, closeModal, modalType, modalProps } = useModals(); // Usar contexto para Pay Modal


  const [accountTransactions, setAccountTransactions] = useState([]);
  const [balanceTrendData, setBalanceTrendData] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const [trendError, setTrendError] = useState('');
  const [allUserAccounts, setAllUserAccounts] = useState([]); 

  const getAccountIcon = (type) => { /* ... (sin cambios) ... */ 
      switch (type) {
        case 'efectivo': return '💵';
        case 'bancaria': return '🏦';
        case 'tarjeta_credito': return '💳';
        case 'inversion': return '📈';
        case 'digital_wallet': return '📱';
        default: return '💰';
      }
  };
  const getAccountSubtitle = (accountData) => { /* ... (sin cambios) ... */ 
    if (!accountData) return '';
    if (accountData.type === 'tarjeta_credito') {
      return 'Tarjeta de Crédito';
    }
    if (accountData.bankName) {
      return accountData.bankName;
    }
    return accountData.type.charAt(0).toUpperCase() + accountData.type.slice(1);
  };

  const fetchAccountDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fetchedAccount, fetchedAllAccounts] = await Promise.all([
        accountService.getAccountById(accountId),
        accountService.getAllAccounts() 
      ]);
      setAccount(fetchedAccount);
      setAllUserAccounts(fetchedAllAccounts.filter(acc => acc.type !== 'tarjeta_credito')); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar los detalles de la cuenta.');
      setAccount(null);
      setAllUserAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const fetchAccountTransactions = useCallback(async () => { /* ... (sin cambios) ... */ 
    setLoadingTransactions(true);
    setTransactionsError('');
    try {
      const data = await transactionService.getAllTransactions({
        accountId: accountId,
        limit: 15,
        sortBy: 'date',
        sortOrder: 'DESC'
      });
      setAccountTransactions(data.transactions || []);
    } catch (err) {
      setTransactionsError(err.response?.data?.message || err.message || 'Error al cargar los movimientos de la cuenta.');
      setAccountTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [accountId]);

  const fetchAccountBalanceTrend = useCallback(async () => { /* ... (sin cambios) ... */ 
    if (!account) return; // Asegurarse que account está cargado
    setLoadingTrend(true);
    setTrendError('');
    try {
      const data = await accountTrendService.getAccountTrendData(accountId, {
        months: 6,
        currency: account?.currency // Usar la moneda de la cuenta actual
      });
      setBalanceTrendData(data);
    } catch (err) {
      setTrendError(err.response?.data?.message || err.message || 'Error al cargar la tendencia de saldo.');
      setBalanceTrendData(null);
    } finally {
      setLoadingTrend(false);
    }
  }, [accountId, account]); // Añadir account como dependencia

  useEffect(() => {
    fetchAccountDetails();
  }, [fetchAccountDetails]);

  useEffect(() => {
    if (account) {
      if (activeTab === 'balance') {
        fetchAccountBalanceTrend();
      } else if (activeTab === 'transactions') {
        fetchAccountTransactions();
      }
    }
  }, [activeTab, account, fetchAccountBalanceTrend, fetchAccountTransactions]);

  const handleDeleteAccount = async () => { /* ... (sin cambios) ... */ 
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esto eliminará todos los movimientos asociados y no se puede deshacer.')) {
      try {
        setLoading(true);
        await accountService.deleteAccount(accountId);
        navigate('/accounts');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar la cuenta.');
        setLoading(false);
      }
    }
  };

  const handleOpenPayModal = () => {
    if (account) {
      openModal(MODAL_TYPES.PAY_CREDIT_CARD, { 
          creditCardAccount: account, 
          payingAccounts: allUserAccounts, 
          onPaymentSuccess: handlePaymentSuccess 
      });
    }
  };

  const handlePaymentSuccess = () => {
    closeModal();
    fetchAccountDetails(); 
    if (activeTab === 'transactions') fetchAccountTransactions();
    if (activeTab === 'balance') fetchAccountBalanceTrend();
  };

  // *** NUEVA FUNCIÓN PARA MANEJAR ACTUALIZACIÓN DESDE EL MODAL DE EDICIÓN ***
  const handleAccountUpdatedFromModal = (updatedAccount) => {
    setAccount(updatedAccount); // Actualizar la cuenta localmente
    // Opcional: Refrescar más datos si es necesario
    if (activeTab === 'balance') fetchAccountBalanceTrend(); // Si el color o algo afecta la tendencia
  };


  if (loading) {
    return <div className="page-container account-detail-page"><p className="loading-text">Cargando detalles de la cuenta...</p></div>;
  }
  if (error) {
    return <div className="page-container account-detail-page"><p className="error-message">{error}</p></div>;
  }
  if (!account) {
    return <div className="page-container account-detail-page"><p className="no-data-message">Cuenta no encontrada.</p></div>;
  }
  
  return (
    <div className="page-container account-detail-page">
      <div className="account-detail-header">
        <Link to="/accounts" className="back-button">
          &lt;
        </Link>
        <h2>Detalles de Cuenta</h2>
        <div className="account-detail-actions">
          {/* *** BOTÓN EDITAR AHORA ABRE EL MODAL *** */}
          <button onClick={() => setShowEditModal(true)} className="button button-outline button-action-small">
            Editar
          </button>
          {account.type === 'tarjeta_credito' && ( 
            <button onClick={handleOpenPayModal} className="button button-primary button-action-small">
              Pagar Resumen
            </button>
          )}
          <button onClick={handleDeleteAccount} className="button button-danger button-action-small">
            Eliminar
          </button>
        </div>
      </div>

      <div className="account-summary-section">
        {/* ... (resto del summary section sin cambios) ... */}
        <div className="account-summary-icon-wrapper" style={{backgroundColor: account.color || 'rgba(var(--primary-rgb), 0.1)'}}>
          <span className="account-summary-icon" style={{color: account.color ? '#fff' : 'var(--primary-color)'}}>{getAccountIcon(account.type)}</span>
        </div>
        <div className="account-summary-info">
          <span className="account-summary-name">{account.name}</span>
          <span className="account-summary-type">{getAccountSubtitle(account)}</span>
        </div>
      </div>

      <div className="account-detail-tabs">
        {/* ... (tabs sin cambios) ... */}
        <button
          className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          Saldo
        </button>
        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Registros
        </button>
      </div>

      <div className="account-tab-content">
        {/* ... (contenido de pestañas sin cambios, excepto el TrendChart que recibe account.currency) ... */}
        {activeTab === 'balance' && (
          <div className="balance-tab-content">
            <div className="balance-overview-card">
              <div className="balance-item">
                <span className="balance-label">Saldo Actual</span>
                <strong className="balance-value">{formatCurrency(account.balance, account.currency)}</strong>
              </div>
              {account.type === 'tarjeta_credito' && account.statementBalance !== null && (
                <div className="balance-item" style={{marginTop: '10px'}}>
                    <span className="balance-label">Saldo del Resumen a Pagar</span>
                    <strong className="balance-value" style={{color: 'var(--danger-color)'}}>{formatCurrency(account.statementBalance, account.currency)}</strong>
                </div>
              )}
            </div>
            <div className="balance-trend-card">
              <h3 className="balance-trend-title">Tendencia del Saldo</h3> 
              <AccountTrendChart
                chartData={balanceTrendData}
                loading={loadingTrend}
                error={trendError}
                accountCurrency={account.currency} // Pasar la moneda de la cuenta
                summaryData={balanceTrendData?.summary} 
              />
            </div>
          </div>
        )}
        {activeTab === 'transactions' && (
          // ... (contenido de transacciones sin cambios)
           <div className="transactions-tab-content">
            <h3>Últimos Movimientos de la Cuenta</h3>
            {loadingTransactions ? (
              <p className="loading-text">Cargando movimientos...</p>
            ) : transactionsError ? (
              <p className="error-message">{transactionsError}</p>
            ) : accountTransactions.length > 0 ? (
              <ul className="account-transactions-list">
                {accountTransactions.map(tx => (
                  <li key={tx.id} className="account-transaction-item">
                    <span className="tx-icon">{tx.icon || getAccountIcon(tx.type)}</span>
                    <div className="tx-details">
                      <span className="tx-description">{tx.description}</span>
                      <span className="tx-category">{tx.category?.name || 'Sin Categoría'}</span>
                    </div>
                    <span className={`tx-amount ${parseFloat(tx.amount) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <span className="tx-date">{new Date(tx.date  + 'T00:00:00Z').toLocaleDateString('es-AR')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data-message">No hay movimientos registrados para esta cuenta.</p>
            )}
          </div>
        )}
      </div>

      {/* Renderizar el EditAccountModal */}
      {showEditModal && account && (
        <EditAccountModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onAccountUpdated={handleAccountUpdatedFromModal}
          accountData={account}
        />
      )}

      {/* Renderizar PayCreditCardModal si está activo en el contexto */}
      {modalType === MODAL_TYPES.PAY_CREDIT_CARD && (
          <PayCreditCardModal
            isOpen={true}
            onClose={closeModal}
            {...modalProps}
          />
      )}
    </div>
  );
};

export default AccountDetailsPage;