// Ruta: frontend/src/pages/AccountsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Link ya no es necesario para el botón de agregar si se maneja con modal global
// import { Link, useLocation } from 'react-router-dom'; 
import accountService from '../services/accounts.service'; 
import AccountItem from '../components/accounts/AccountItem'; 
// PayCreditCardModal también se manejará globalmente si se desea, o se mantiene aquí por ahora
// import PayCreditCardModal from '../components/accounts/PayCreditCardModal'; 
// AddAccountModal ya no se importa ni renderiza aquí directamente
import { useModals, MODAL_TYPES } from '../contexts/ModalContext'; // *** NUEVO IMPORT ***
import './AccountsPage.css'; 

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para PayCreditCardModal (se pueden mover a ModalContext si se quiere globalizar)
  // const [showPayModal, setShowPayModal] = useState(false); // Comentado o eliminado si se globaliza
  // const [selectedCardToPay, setSelectedCardToPay] = useState(null); // Comentado o eliminado si se globaliza
  const [payingAccountsList, setPayingAccountsList] = useState([]);

  // showAddAccountModal ya no es necesario aquí
  // const [showAddAccountModal, setShowAddAccountModal] = useState(false); 

  const { openModal, closeModal, modalType, modalProps } = useModals(); // *** USAR EL CONTEXTO ***

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // const location = useLocation(); // Ya no es necesario para abrir el modal de agregar

  // useEffect para abrir el modal si venía del state de location (ya no es necesario con Context)
  // useEffect(() => {
  //   if (location.state?.openAddAccountModal) {
  //     openModal(MODAL_TYPES.ADD_ACCOUNT); // Usa el contexto para abrir
  //     window.history.replaceState({}, document.title) 
  //   }
  // }, [location.state, openModal]);


  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedAccounts = await accountService.getAllAccounts();

      let filteredAccounts = fetchedAccounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.bankName && account.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (sortBy !== 'default') {
        filteredAccounts.sort((a, b) => {
          if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
          if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
          
          const balanceA = parseFloat(a.balance) || 0;
          const balanceB = parseFloat(b.balance) || 0;

          if (sortBy === 'balanceAsc') return balanceA - balanceB;
          if (sortBy === 'balanceDesc') return balanceB - balanceA;
          return 0;
        });
      }

      setAccounts(filteredAccounts);
      setPayingAccountsList(fetchedAccounts.filter(acc => acc.type !== 'tarjeta_credito'));

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las cuentas.');
      setAccounts([]);
      setPayingAccountsList([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esto eliminará todos los movimientos asociados y no se puede deshacer.')) {
      try {
        setLoading(true);
        await accountService.deleteAccount(accountId);
        fetchAccounts(); 
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar la cuenta.');
        setLoading(false);
      }
    }
  };

  const handleOpenPayModal = (card) => {
    //setSelectedCardToPay(card);
    //setShowPayModal(true);
    openModal(MODAL_TYPES.PAY_CREDIT_CARD, { 
        creditCardAccount: card, 
        payingAccounts: payingAccountsList, 
        onPaymentSuccess: handlePaymentSuccess // Pasar el callback
    });
  };

  const handlePaymentSuccess = () => {
    //setShowPayModal(false);
    //setSelectedCardToPay(null);
    closeModal();
    fetchAccounts(); 
  };
  
  const handleAccountCreated = (newAccount) => {
    fetchAccounts(); 
    // El modal de agregar cuenta se cierra desde su propio componente o desde el ModalContext
  };


  return (
    <div className="page-container accounts-page">
      <div className="accounts-page-header">
        <h1>Cuentas</h1>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="accounts-content-wrapper">
        <aside className="accounts-filter-sidebar">
          {/* *** BOTÓN AHORA ABRE EL MODAL MEDIANTE CONTEXTO *** */}
          <button 
            onClick={() => openModal(MODAL_TYPES.ADD_ACCOUNT, { onAccountCreated: handleAccountCreated })} 
            className="button button-primary add-account-button"
          >
            + Agregar Cuenta
          </button>

          <div className="filter-group">
            <label htmlFor="search-accounts" className="filter-label">Buscar</label>
            <input
              type="text"
              id="search-accounts"
              placeholder="Nombre, tipo, banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="sort-accounts" className="filter-label">Ordenar por</label>
            <select
              id="sort-accounts"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="default">Default</option>
              <option value="nameAsc">Nombre (A-Z)</option>
              <option value="nameDesc">Nombre (Z-A)</option>
              <option value="balanceDesc">Saldo (Mayor a Menor)</option>
              <option value="balanceAsc">Saldo (Menor a Mayor)</option>
            </select>
          </div>
        </aside>

        <main className="accounts-list-main">
          {loading ? (
            <p className="loading-text">Cargando cuentas...</p>
          ) : accounts.length === 0 ? (
            <p className="no-data-message">No tienes cuentas registradas. ¡Agrega una para empezar!</p>
          ) : (
            <div className="accounts-list">
              {accounts.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  // Las acciones como onPayStatement (si es tarjeta) se manejarán en AccountDetailsPage
                  // Si el item en sí mismo debe poder abrir el modal de pago, pasa handleOpenPayModal
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* AddAccountModal se renderizará globalmente en Layout.jsx o App.jsx */}
      {/* PayCreditCardModal se puede renderizar aquí o globalmente también */}
      {/* Si PayCreditCardModal se mantiene local a AccountsPage:
        modalType === MODAL_TYPES.PAY_CREDIT_CARD && (
          <PayCreditCardModal
            isOpen={true} // El modal context ya maneja la visibilidad
            onClose={closeModal}
            {...modalProps} // Pasa las props desde el contexto (creditCardAccount, etc.)
          />
        )
      */}
    </div>
  );
};

export default AccountsPage;