// Ruta: finanzas-app-pro/frontend/src/components/dashboard/BalanceOverview.jsx
import React from 'react';
import './DashboardComponents.css'; // Asegúrate que este CSS exista y tenga los estilos necesarios

// Función para formatear moneda (debería ser consistente en toda la app)
const formatCurrency = (amount, currency) => {
  const value = Number(amount) || 0;
  const symbol = currency === 'USD' ? 'U$S' : '$';
  // Para el total consolidado, siempre será ARS, pero mantenemos el parámetro por flexibilidad
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BalanceOverview = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="dashboard-widget balance-overview-widget">
        <h3>Resumen de Balance</h3>
        <p className="loading-text-widget">Cargando...</p>
      </div>
    );
  }
  
  // Verifica si summary o summary.balances es null/undefined antes de acceder a sus propiedades
  if (!summary || !summary.balances) {
    return (
        <div className="dashboard-widget balance-overview-widget">
            <h3>Resumen de Balance</h3>
            <p className="no-data-widget">No hay datos de balance de cuentas disponibles. ¡Agrega tu primera cuenta!</p>
        </div>
    );
  }

  const { balances, totalBalanceARSConverted, conversionRateUsed, rateMonthYear } = summary;

  // Verifica si no hay saldos en ninguna moneda
  const noBalancesAvailable = balances.ARS === null && balances.USD === null && totalBalanceARSConverted === null;

  if (noBalancesAvailable) {
     return (
        <div className="dashboard-widget balance-overview-widget">
            <h3>Resumen de Balance</h3>
            <p className="no-data-widget">No hay saldos disponibles en las cuentas configuradas para el resumen.</p>
        </div>
    );
  }


  return (
    <div className="dashboard-widget balance-overview-widget">
      <h3>Resumen de Balance</h3>
      
      <div className="balance-total-multi-currency">
        {balances.ARS !== null && (
          <div className="balance-currency-item">
            <span>Saldo Total (ARS):</span>
            <strong className={balances.ARS >= 0 ? 'text-positive' : 'text-negative'}>
              {formatCurrency(balances.ARS, 'ARS')}
            </strong>
          </div>
        )}
        {balances.USD !== null && (
          <div className="balance-currency-item">
            <span>Saldo Total (USD):</span>
            <strong className={balances.USD >= 0 ? 'text-positive' : 'text-negative'}>
              {formatCurrency(balances.USD, 'USD')}
            </strong>
          </div>
        )}

        {/* Mostrar el total consolidado si está disponible */}
        {totalBalanceARSConverted !== null && (
          <div className="balance-currency-item consolidated-total">
            <span>Saldo Total Consolidado (ARS Aprox.):</span>
            <strong className={totalBalanceARSConverted >= 0 ? 'text-positive' : 'text-negative'}>
              {formatCurrency(totalBalanceARSConverted, 'ARS')}
            </strong>
          </div>
        )}
      </div>
      
      <p className="balance-overview-note">
        Este es el saldo de tus cuentas marcadas para incluir en el resumen.
        {conversionRateUsed && rateMonthYear && (
          ` Conversión USD a ARS usando tasa de ${rateMonthYear}: ${parseFloat(conversionRateUsed).toFixed(2)}.`
        )}
        {balances.USD !== null && !conversionRateUsed && totalBalanceARSConverted !== null && (
          ` El saldo en USD no se incluyó en el total consolidado ARS por falta de tasa de cambio para el mes actual.`
        )}
         {balances.USD !== null && !conversionRateUsed && totalBalanceARSConverted === null && balances.ARS === null && ( // Caso donde solo hay USD y no hay tasa
          ` No se pudo calcular un total consolidado en ARS por falta de tasa de cambio para el mes actual.`
        )}
      </p>
    </div>
  );
};

export default BalanceOverview;
