// Ruta: frontend/src/pages/AccountsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import accountService from '../services/accounts.service'; 
import AccountItem from '../components/accounts/AccountItem'; // Asegúrate de que esta ruta sea correcta
import PayCreditCardModal from '../components/accounts/PayCreditCardModal'; // Asegúrate de que esta ruta sea correcta
import { formatCurrency } from '../utils/formatters'; // Asegúrate de que esta ruta sea correcta
import './AccountsPage.css'; // Asegúrate de que esta ruta sea correcta

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState(null);

  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'nameAsc', 'nameDesc', 'balanceAsc', 'balanceDesc'

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedAccounts = await accountService.getAllAccounts();

      // Aplicar búsqueda en el frontend (más simple para searchTerm)
      let filteredAccounts = fetchedAccounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.bankName && account.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Aplicar ordenamiento en el frontend
      if (sortBy !== 'default') {
        filteredAccounts.sort((a, b) => {
          if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
          if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
          
          const balanceA = parseFloat(a.balance) || 0;
          const balanceB = parseFloat(b.balance) || 0;

          // Convertir a una moneda común para ordenar por balance si es necesario
          // Por simplicidad, ordenamos por el valor numérico directo.
          // Una implementación más robusta convertiría a una moneda base antes de ordenar.
          if (sortBy === 'balanceAsc') return balanceA - balanceB;
          if (sortBy === 'balanceDesc') return balanceB - balanceA;
          return 0;
        });
      }

      setAccounts(filteredAccounts);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar las cuentas.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy]); // Dependencias para useCallback

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]); // Se ejecuta cuando fetchAccounts cambia (debido a searchTerm o sortBy)

  // Las funciones handleDeleteAccount y handlePayCreditCard ya no se pasan directamente a AccountItem
  // Si necesitas estas funcionalidades, deberías implementarlas en la página de edición de la cuenta
  // o a través de un menú contextual en el AccountItem si el diseño lo permite.
  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esto eliminará todos los movimientos asociados y no se puede deshacer.')) {
      try {
        setLoading(true);
        await accountService.deleteAccount(accountId);
        fetchAccounts(); // Recargar la lista de cuentas
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar la cuenta.');
        setLoading(false);
      }
    }
  };

  const handlePayCreditCard = (card) => {
    setSelectedCreditCard(card);
    setShowPayModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    setSelectedCreditCard(null);
    fetchAccounts(); // Recargar cuentas para reflejar el pago
  };

  const handlePaymentCancel = () => {
    setShowPayModal(false);
    setSelectedCreditCard(null);
  };

  const totalBalanceARS = accounts.reduce((sum, account) => {
    if (account.currency === 'ARS') {
      return sum + (parseFloat(account.balance) || 0);
    }
    return sum;
  }, 0);

  const totalBalanceUSD = accounts.reduce((sum, account) => {
    if (account.currency === 'USD') {
      return sum + (parseFloat(account.balance) || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="page-container accounts-page">
      <div className="accounts-page-header">
        <h1>Cuentas</h1>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="accounts-content-wrapper">
        {/* Sidebar de filtros y acciones */}
        <aside className="accounts-filter-sidebar">
          <Link to="/accounts/add" className="button button-primary add-account-button">
            + Agregar
          </Link>

          <div className="filter-group">
            <label htmlFor="search-accounts" className="filter-label">Q Buscar</label>
            <input
              type="text"
              id="search-accounts"
              placeholder="Buscar por nombre o tipo..."
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

        {/* Contenido principal: lista de cuentas */}
        <main className="accounts-list-main">
          {loading ? (
            <p className="loading-text">Cargando cuentas...</p>
          ) : accounts.length === 0 ? (
            <p className="no-data-message">No tienes cuentas registradas. ¡Agrega una para empezar!</p>
          ) : (
            <div className="accounts-list"> {/* Cambiado de accounts-grid a accounts-list */}
              {accounts.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  // onDelete={handleDeleteAccount} // Ya no se pasa directamente
                  // onPayCreditCard={handlePayCreditCard} // Ya no se pasa directamente
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showPayModal && selectedCreditCard && (
        <PayCreditCardModal
          creditCard={selectedCreditCard}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default AccountsPage;