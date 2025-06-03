// Ruta: frontend/src/components/accounts/AccountItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters'; // Importar función de formato
import './AccountItem.css'; // Asegúrate de que esta ruta sea correcta

const AccountItem = ({ account }) => { // Eliminado onDelete y onPayCreditCard de las props
  // Determinar el ícono de la cuenta
  const getAccountIcon = (type) => {
    switch (type) {
      case 'efectivo': return '💵';
      case 'bancaria': return '🏦';
      case 'tarjeta_credito': return '💳';
      case 'inversion': return '📈';
      case 'billetera_virtual': return '📱';
      default: return '💰';
    }
  };

  // Determinar el subtítulo de la cuenta (tipo o banco)
  const getAccountSubtitle = (account) => {
    if (account.type === 'tarjeta_credito') {
      return 'Tarjeta de Crédito';
    }
    if (account.bankName) {
      return account.bankName;
    }
    // Capitalizar el tipo si no hay un nombre de banco
    return account.type.charAt(0).toUpperCase() + account.type.slice(1);
  };

  return (
    // La tarjeta entera es un enlace a la página de edición
    <Link to={`/accounts/edit/${account.id}`} className="account-item-card">
      <div className="account-card-icon-wrapper">
        <span className="account-card-icon">{getAccountIcon(account.type)}</span>
      </div>
      
      <div className="account-card-details">
        <span className="account-card-name">{account.name}</span>
        <span className="account-card-subtitle">{getAccountSubtitle(account)}</span>
      </div>

      <div className="account-card-balance-wrapper">
        <span className="account-card-balance">{formatCurrency(account.balance, account.currency)}</span>
      </div>

      {/* Los botones de acción (Editar/Eliminar/Pagar Resumen) no se muestran aquí en la vista principal
          para coincidir con la referencia. Se espera que la edición se haga al hacer clic en la tarjeta,
          y otras acciones podrían estar en la página de edición o en un menú contextual si se desea. */}
    </Link>
  );
};

export default AccountItem;