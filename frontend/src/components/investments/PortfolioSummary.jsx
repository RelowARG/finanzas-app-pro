// Ruta: finanzas-app-pro/frontend/src/components/investments/PortfolioSummary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import exchangeRatesService from '../../services/exchangeRates.service'; //
import { formatCurrency } from '../../utils/formatters'; //
import './PortfolioSummary.css'; //

// Ya no recibe allUserAccounts
const PortfolioSummary = ({ investments }) => { 
  const [displayCurrency, setDisplayCurrency] = useState('ARS');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState('');
  
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalInitialValue: 0,
    totalCurrentValue: 0,
    totalProfitLoss: 0,
    totalRendimiento: 0,
    numberOfInvestments: 0,
  });

  // La lógica de cashBalances se elimina

  const fetchExchangeRate = useCallback(async () => {
    setLoadingRate(true);
    setRateError('');
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const rateData = await exchangeRatesService.getRate({ year: currentYear, month: currentMonth, fromCurrency: 'USD', toCurrency: 'ARS' }); //
      if (rateData && rateData.rate) {
        setExchangeRate(parseFloat(rateData.rate));
      } else {
        setExchangeRate(null);
      }
    } catch (err) {
      setExchangeRate(null);
      setRateError(err.message || 'Error al obtener la tasa de cambio.');
    } finally {
      setLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    if (!investments || investments.length === 0) {
      setPortfolioMetrics({ totalInitialValue: 0, totalCurrentValue: 0, totalProfitLoss: 0, totalRendimiento: 0, numberOfInvestments: 0 });
      // Ya no necesitamos limpiar el error de tasa aquí si no hay inversiones, se maneja en el render.
      return;
    }

    let aggInitial = 0;
    let aggCurrent = 0;
    let conversionIssueNotifiedThisCalculation = false; // Renombrado para claridad
    let tempRateErrorCalc = ''; // Renombrado para claridad

    investments.forEach(inv => {
      const initialValueBase = parseFloat(inv.initialInvestment) || parseFloat(inv.amountInvested) || 0;
      let currentValueBase = parseFloat(inv.currentValue) || 0;
      const quantityNum = parseFloat(inv.quantity) || 0;
      const purchasePriceNum = parseFloat(inv.purchasePrice) || 0;
      const currentPriceNum = parseFloat(inv.currentPrice) || 0;

      let itemInitial = initialValueBase;
      if ((inv.type === 'acciones' || inv.type === 'cedears' || inv.type === 'criptomonedas') && quantityNum > 0 && purchasePriceNum > 0 && initialValueBase === 0) {
        itemInitial = quantityNum * purchasePriceNum;
      }
      
      let itemCurrent = currentValueBase;
      if ((inv.type === 'acciones' || inv.type === 'cedears' || inv.type === 'criptomonedas') && quantityNum > 0 && currentPriceNum > 0 && currentValueBase === 0) {
        itemCurrent = quantityNum * currentPriceNum;
      }
      
      if (displayCurrency === 'ARS') {
        if (inv.currency === 'USD') {
          if (exchangeRate) {
            itemInitial *= exchangeRate;
            itemCurrent *= exchangeRate;
          } else { 
            if (!conversionIssueNotifiedThisCalculation) tempRateErrorCalc = 'Falta tasa USD->ARS para consolidar. Valores en USD no incluidos.';
            conversionIssueNotifiedThisCalculation = true; 
            return; 
          }
        }
      } else if (displayCurrency === 'USD') {
        if (inv.currency === 'ARS') {
          if (exchangeRate && exchangeRate !== 0) {
            itemInitial /= exchangeRate;
            itemCurrent /= exchangeRate;
          } else { 
            if (!conversionIssueNotifiedThisCalculation) tempRateErrorCalc = 'Falta tasa ARS->USD para consolidar. Valores en ARS no incluidos.';
            conversionIssueNotifiedThisCalculation = true; 
            return; 
          }
        }
      }
      aggInitial += itemInitial;
      aggCurrent += itemCurrent;
    });
    
    // Actualizar rateError solo si hubo un problema en esta iteración específica de cálculo
    if (conversionIssueNotifiedThisCalculation) {
        setRateError(tempRateErrorCalc);
    } else if (!loadingRate) { // Si no estamos cargando la tasa y no hubo problemas de conversión, limpiar error de tasa
        setRateError('');
    }


    const profitLoss = aggCurrent - aggInitial;
    const rendimiento = aggInitial !== 0 ? (profitLoss / aggInitial) * 100 : 0;

    setPortfolioMetrics({
      totalInitialValue: aggInitial,
      totalCurrentValue: aggCurrent,
      totalProfitLoss: profitLoss,
      totalRendimiento: rendimiento,
      numberOfInvestments: investments.length,
    });

  }, [investments, displayCurrency, exchangeRate, loadingRate]); // Quitar rateError de las dependencias para evitar bucles

  const handleCurrencyToggle = (newCurrency) => {
    setRateError(''); // Limpiar al cambiar, el useEffect de cálculo lo seteará si es necesario
    setDisplayCurrency(newCurrency);
    if (!exchangeRate && newCurrency !== 'ARS') { // Si no hay tasa y se cambia a USD
        fetchExchangeRate(); 
    }
  };
  
  const { totalCurrentValue, totalInitialValue, totalProfitLoss, totalRendimiento } = portfolioMetrics;
  const profitClass = totalProfitLoss >= 0 ? 'profit-positive' : 'profit-negative';
  const arrowIcon = totalProfitLoss >= 0 ? '▲' : '▼';

  // Ya no hay 'numberOfInvestments' aquí porque se muestra en el header de la sección de instrumentos
  // if (!investments || investments.length === 0) {
  //   return null; // O un mensaje más sutil, ya que la página principal maneja el "no hay inversiones"
  // }

  return (
    <div className="portfolio-summary-main-widget white-theme"> {/* Añadir clase para tema blanco */}
      <div className="portfolio-header">
        <div className="portfolio-total-value">
          <span className="value-label">Portafolio Total en {displayCurrency}</span>
          <span className="value-amount">{formatCurrency(totalCurrentValue, displayCurrency)}</span>
        </div>
        <div className="currency-toggle-main">
          <button onClick={() => handleCurrencyToggle('ARS')} className={displayCurrency === 'ARS' ? 'active' : ''} disabled={loadingRate}>
            ARS
          </button>
          <button 
            onClick={() => handleCurrencyToggle('USD')} 
            className={displayCurrency === 'USD' ? 'active' : ''} 
            disabled={loadingRate || !exchangeRate}
            title={!exchangeRate ? "Se requiere tasa USD->ARS para ver en USD" : ""}
          >
            USD
          </button>
        </div>
      </div>
      
      {(loadingRate || rateError) && (
        <div className="portfolio-messages">
            {loadingRate && <p className="loading-text-small">Cargando tasa...</p>}
            {rateError && <p className="error-message-small">{rateError}</p>}
        </div>
      )}

      <div className="portfolio-performance">
        <span className={`performance-value ${profitClass}`}>
          {arrowIcon} {formatCurrency(totalProfitLoss, displayCurrency)} ({totalRendimiento.toFixed(2)}%) 
        </span>
        <span className="performance-label">Rendimiento Histórico</span>
      </div>

      <div className="portfolio-chart-placeholder-main">
        <p>(Gráfico de Evolución del Portafolio - Próximamente)</p>
         <small>Se requieren datos históricos para un gráfico preciso.</small>
      </div>

      {/* Sección "Dinero Disponible" eliminada */}
    </div>
  );
};

export default PortfolioSummary;