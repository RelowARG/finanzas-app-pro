// Ruta: src/components/dashboard/AccountSummaryCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardComponents.css'; // [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css]

const formatCurrencyForCard = (amount, currency = 'ARS') => {
  const symbol = currency === 'USD' ? 'U$S' : '$';
  const value = Number(amount) || 0;
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Añadimos onCustomizeClick como prop
const AccountSummaryCard = ({ account, bgColorClass, icon, onCustomizeClick }) => {
  // Si no hay datos de cuenta, se renderiza como una tarjeta para añadir cuenta y personalizar
  if (!account) {
    return (
      <div className="account-summary-card add-account-card-container"> {/* Contenedor actualizado */}
        <Link to="/accounts/add" className="add-account-card-link">
          <div className="add-account-icon">➕</div>
          <div>Añadir cuenta</div>
        </Link>
        {/* Botón para personalizar, solo se muestra en este placeholder */}
        {onCustomizeClick && (
            <button 
                onClick={onCustomizeClick} 
                className="button button-small button-customize-placeholder" // Clase para el botón
                title="Seleccionar cuentas para el resumen"
            >
                ⚙️ Personalizar Resumen
            </button>
        )}
      </div>
    );
  }

  return (
    <div className={`account-summary-card ${bgColorClass || ''}`}> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <div className="account-card-icon">{icon || account.icon || '🏦'}</div> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
      <div className="account-card-main-info"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <div className="account-card-name">{account.name}</div> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
        <div className="account-card-balance"> {/* [cite: finanzas-app-pro/frontend/src/components/dashboard/DashboardComponents.css] */}
          {formatCurrencyForCard(account.balance, account.currency)}
        </div>
      </div>
    </div>
  );
};

export default AccountSummaryCard;
