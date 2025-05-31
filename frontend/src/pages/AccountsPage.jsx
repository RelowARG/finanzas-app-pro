// Ruta: finanzas-app-pro/frontend/src/pages/AccountsPage.jsx
// REEMPLAZA EL CONTENIDO DE ESTE ARCHIVO
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importar useNavigate
import accountService from '../services/accounts.service';
import AccountItem from '../components/accounts/AccountItem'; // Importar el nuevo componente
import './AccountsPage.css'; // Crearemos este archivo CSS

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook para la navegación

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      const data = await accountService.getAllAccounts();
      // Ordenar cuentas, por ejemplo, por fecha de creación o nombre
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAccounts(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las cuentas. Intenta de nuevo.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // La lógica para crear cuenta se moverá a AddAccountPage o un modal
  // Por ahora, el botón solo navegará

  if (loading) {
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
        <ul className="accounts-grid"> {/* Cambiado a grid para mejor layout */}
          {accounts.map(account => (
            <AccountItem key={account.id} account={account} />
          ))}
        </ul>
      ) : (
        !error && <p className="no-accounts-message">No tienes cuentas registradas. ¡Comienza agregando una!</p>
      )}
    </div>
  );
};

export default AccountsPage;
