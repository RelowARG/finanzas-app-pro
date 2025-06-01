// Ruta: finanzas-app-pro/frontend/src/pages/AccountsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import accountService from '../services/accounts.service'; // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
import AccountItem from '../components/accounts/AccountItem'; // [cite: finanzas-app-pro/frontend/src/components/accounts/AccountItem.jsx]
import PayCreditCardModal from '../components/accounts/PayCreditCardModal'; // Importar el nuevo modal
import './AccountsPage.css'; // [cite: finanzas-app-pro/frontend/src/pages/AccountsPage.css]

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCardToPay, setSelectedCardToPay] = useState(null);
  const [payingAccountsList, setPayingAccountsList] = useState([]); // Cuentas para pagar

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); 
      const data = await accountService.getAllAccounts(); // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAccounts(data);

      // Preparar lista de cuentas que pueden pagar (no tarjetas de crédito)
      setPayingAccountsList(data.filter(acc => acc.type !== 'tarjeta_credito'));

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las cuentas. Intenta de nuevo.');
      setAccounts([]);
      setPayingAccountsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esta acción no se puede deshacer y podría afectar movimientos asociados.')) {
      try {
        setLoading(true);
        await accountService.deleteAccount(accountId); // [cite: finanzas-app-pro/frontend/src/services/accounts.service.js]
        fetchAccounts(); // Recargar
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la cuenta.');
        console.error("Error deleting account:", err);
        setLoading(false);
      }
    }
  };

  const handleOpenPayModal = (cardAccount) => {
    setSelectedCardToPay(cardAccount);
    setShowPayModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    setSelectedCardToPay(null);
    fetchAccounts(); // Recargar cuentas para ver saldos actualizados
    // Podrías mostrar un mensaje de éxito aquí
  };


  if (loading && accounts.length === 0) {
    return (
      <div className="page-container accounts-page">
        <div className="accounts-page-header">
          <h1>Mis Cuentas</h1>
        </div>
        <p className="loading-text">Cargando cuentas...</p>
      </div>
    );
  }

  return (
    <div className="page-container accounts-page">
      <div className="accounts-page-header">
        <h1>Mis Cuentas</h1>
        <Link to="/accounts/add" className="button button-primary">
          <span className="icon-add">➕</span> Agregar Cuenta
        </Link>
      </div>

      {error && <p className="error-message">{error}</p>}

      {accounts.length > 0 ? (
        <ul className="accounts-grid"> 
          {accounts.map(account => (
            <AccountItem 
              key={account.id} 
              account={account} 
              onDeleteAccount={handleDeleteAccount}
              onPayStatement={account.type === 'tarjeta_credito' ? handleOpenPayModal : null} // Pasar solo si es tarjeta
            />
          ))}
        </ul>
      ) : (
        !loading && !error && <p className="no-accounts-message">No tienes cuentas registradas. ¡Comienza agregando una!</p>
      )}

      {showPayModal && selectedCardToPay && (
        <PayCreditCardModal
          isOpen={showPayModal}
          onClose={() => { setShowPayModal(false); setSelectedCardToPay(null); }}
          creditCardAccount={selectedCardToPay}
          payingAccounts={payingAccountsList}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default AccountsPage;
