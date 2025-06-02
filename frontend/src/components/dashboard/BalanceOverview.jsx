// Ruta: src/components/dashboard/BalanceOverview.jsx
import React from 'react';
import WidgetLoader from './WidgetLoader';
import WidgetInfoIcon from './WidgetInfoIcon';
import './DashboardComponents.css'; // Asegúrate que los estilos del widget-header-container estén aquí

const formatCurrency = (amount, currency) => {
  const value = Number(amount) || 0;
  const symbol = currency === 'USD' ? 'U$S' : '$';
  return `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BalanceOverview = ({ summary, loading, error, widgetDescription }) => {
  const widgetTitle = "Resumen de Balance";

  if (loading) {
    return (
      <div className="dashboard-widget balance-overview-widget">
        {/* Contenedor del encabezado del widget */}
        <div className="widget-header-container">
          <h3>{widgetTitle}</h3>
          <WidgetInfoIcon description={widgetDescription} />
        </div>
        <div className="dashboard-widget-content">
          <WidgetLoader message="Cargando balance..." />
        </div>
      </div>
    );
  }
  
  if (error || !summary || !summary.balances) {
    return (
        <div className="dashboard-widget balance-overview-widget">
            <div className="widget-header-container">
              <h3>{widgetTitle}</h3>
              <WidgetInfoIcon description={widgetDescription} />
            </div>
            <div className="dashboard-widget-content">
              <p className="no-data-widget">
                {error ? (typeof error === 'string' ? error : 'Error al cargar balance.') : 'No hay datos de balance. ¡Agrega una cuenta!'}
              </p>
            </div>
        </div>
    );
  }

  const { balances, totalBalanceARSConverted, conversionRateUsed, rateMonthYear } = summary;
  const noBalancesAvailable = balances.ARS === null && balances.USD === null && totalBalanceARSConverted === null;

  if (noBalancesAvailable) {
     return (
        <div className="dashboard-widget balance-overview-widget">
            <div className="widget-header-container">
              <h3>{widgetTitle}</h3>
              <WidgetInfoIcon description={widgetDescription} />
            </div>
            <div className="dashboard-widget-content">
              <p className="no-data-widget">Saldos no disponibles para el resumen.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="dashboard-widget balance-overview-widget">
      {/* Contenedor del encabezado del widget */}
      <div className="widget-header-container">
        <h3>{widgetTitle}</h3>
        <WidgetInfoIcon description={widgetDescription} />
      </div>
      
      <div className="dashboard-widget-content">
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
          {totalBalanceARSConverted !== null && (
            <div className="balance-currency-item consolidated-total">
              <span>Saldo Total Consolidado (ARS Aprox.):</span>
              <strong className={totalBalanceARSConverted >= 0 ? 'text-positive' : 'text-negative'}>
                {formatCurrency(totalBalanceARSConverted, 'ARS')}
              </strong>
            </div>
          )}
        </div>
        {(conversionRateUsed || (balances.USD !== null && !conversionRateUsed)) && (
          <p className="balance-overview-note">
            {conversionRateUsed && rateMonthYear && (
              `Conversión USD a ARS usando tasa de ${rateMonthYear}: ${parseFloat(conversionRateUsed).toFixed(2)}. `
            )}
            {balances.USD !== null && !conversionRateUsed && (
              `El saldo en USD no se pudo incluir en el total consolidado ARS por falta de tasa de cambio para el mes actual.`
            )}
            Este es el saldo de tus cuentas marcadas para incluir en el resumen.
          </p>
        )}
        {balances.USD === null && totalBalanceARSConverted !== null && (
           <p className="balance-overview-note">
              Este es el saldo de tus cuentas marcadas para incluir en el resumen.
          </p>
        )}
      </div>
    </div>
  );
};

export default BalanceOverview;