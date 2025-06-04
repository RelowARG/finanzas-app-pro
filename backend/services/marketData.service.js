// Ruta: finanzas-app-pro/backend/services/marketData.service.js
const yahooFinance = require('yahoo-finance2').default;

async function getQuoteFromYahoo(ticker, investmentObject) {
  let symbolToQuery = ticker.toUpperCase().trim();
  const investmentType = investmentObject.type;
  // Moneda original de la inversión tal como la guardó el usuario
  const userInvestmentCurrency = (investmentObject.currency && typeof investmentObject.currency === 'string') 
                                 ? investmentObject.currency.toUpperCase() 
                                 : 'ARS'; // Default a ARS si no está definida en el objeto de inversión

  if (investmentType === 'acciones') {
    // Si es una acción argentina que no tiene '.BA' y el usuario la tiene en ARS
    if (!symbolToQuery.includes('.') && userInvestmentCurrency === 'ARS') {
      symbolToQuery = `${symbolToQuery}.BA`;
    }
    // Si el usuario guardó "PAM" con moneda USD (ADR), se buscará "PAM".
    // Si guardó "PAMP.BA" con moneda ARS, se buscará "PAMP.BA".
  } else if (investmentType === 'cedears') {
    // Para CEDEARs, Yahoo Finance usa el ticker original del mercado extranjero (ej. AAPL)
    symbolToQuery = symbolToQuery.replace(/\.(BA|BCBA)$/i, '');
  } else if (investmentType === 'criptomonedas') {
    if (!symbolToQuery.includes('-')) { 
        symbolToQuery = `${symbolToQuery}-${userInvestmentCurrency}`;
    }
    // Si el par ya está completo (ej. BTC-USD), se usa tal cual.
  }

  console.log(`[MarketDataService-Yahoo] Solicitando cotización para (ticker ajustado): ${symbolToQuery}`);
  try {
    const result = await yahooFinance.quote(symbolToQuery);

    if (result && result.regularMarketPrice !== undefined && result.regularMarketPrice !== null) {
      const price = parseFloat(result.regularMarketPrice);
      // Usar la moneda que devuelve Yahoo Finance para esa cotización.
      const quoteCurrencyFromYahoo = result.currency ? result.currency.toUpperCase() : null;
      
      // Si Yahoo no devuelve moneda, intentar inferir basado en el símbolo consultado.
      let finalCurrency;
      if (quoteCurrencyFromYahoo) {
        finalCurrency = quoteCurrencyFromYahoo;
      } else if (symbolToQuery.endsWith('.BA')) {
        finalCurrency = 'ARS';
      } else if (investmentType === 'cedears' || (investmentType === 'acciones' && !symbolToQuery.endsWith('.BA'))) {
        finalCurrency = 'USD'; // Asumir USD para ADRs o CEDEARs si Yahoo no lo especifica
      } else if (investmentType === 'criptomonedas' && symbolToQuery.includes('-')) {
        finalCurrency = symbolToQuery.split('-')[1]; // Tomar la contraparte del par
      } else {
        finalCurrency = 'USD'; // Fallback general
      }
      
      if (!isNaN(price)) {
        console.log(`[MarketDataService-Yahoo] Precio para ${symbolToQuery}: ${price} ${finalCurrency}`);
        return { price, currency: finalCurrency };
      }
    }
    console.warn(`[MarketDataService-Yahoo] No se pudo obtener un precio válido para ${symbolToQuery} de Yahoo. Respuesta parcial:`, result ? {price: result.regularMarketPrice, currency: result.currency, name: result.shortName || result.longName} : "Sin respuesta o ticker no encontrado");
    return null;
  } catch (error) {
    console.error(`[MarketDataService-Yahoo] Error obteniendo cotización para ${symbolToQuery} desde Yahoo Finance: ${error.message}.`);
    if (error.name === 'FailedYahooValidationError' || error.message.includes("Couldn't find asset")) {
      console.error(`[MarketDataService-Yahoo] Ticker '${symbolToQuery}' no encontrado o inválido en Yahoo Finance.`);
    }
    return null;
  }
}

const fetchQuotesForTickers = async (investmentsToUpdate) => {
  const updatedQuotes = {};
  const promises = [];

  for (const investment of investmentsToUpdate) {
    if ((investment.type === 'acciones' || investment.type === 'cedears' || investment.type === 'criptomonedas') && investment.ticker) {
      promises.push(
        getQuoteFromYahoo(investment.ticker, investment)
          .then(priceData => {
            if (priceData) {
              updatedQuotes[investment.ticker] = { price: priceData.price, currency: priceData.currency };
            } else {
              console.warn(`[MarketDataService] No se obtuvo precio real de Yahoo para ${investment.ticker}. No se actualizará el precio.`);
            }
          })
          .catch(err => {
            console.error(`[MarketDataService] Error al procesar la promesa de cotización para ${investment.ticker}:`, err.message);
          })
      );
    }
  }

  try {
    await Promise.all(promises);
  } catch (overallError) {
    console.error("[MarketDataService] Error durante la ejecución de Promise.all para obtener cotizaciones:", overallError);
  }
  
  console.log("[MarketDataService] Cotizaciones finales obtenidas (Solo Yahoo Finance):", updatedQuotes);
  return updatedQuotes;
};
    
const getSimulatedFixedTermRates = async (currency = 'ARS') => {
    await new Promise(resolve => setTimeout(resolve, 200)); 
    if (currency === 'ARS') {
        return { tna30days: parseFloat((Math.random() * (35 - 25) + 25).toFixed(2)) };
    }
    return { tna30days: parseFloat((Math.random() * (4 - 2) + 2).toFixed(2)) };
};

const searchSymbols = async (keywords) => {
  if (!keywords || keywords.trim().length < 1) { 
    return [];
  }
  console.log(`[MarketDataService-Yahoo] Buscando símbolos para keywords: "${keywords}"`);
  try {
    // Opciones para la búsqueda: solo queremos 'quotes'
    const queryOptions = {
      quotesCount: 10, // Número de resultados de tickers
      newsCount: 0,    // No necesitamos noticias
      // Las siguientes opciones pueden ayudar a evitar errores de "Invalid options"
      // si la librería las pasa por defecto con valores que causan problemas.
      // Al ponerlas explícitamente en false, controlamos mejor.
      enableNavLinks: false,
      enableCb: false,
      enableEnhancedTrivialQuery: false,
      // listsCount: 0, // Si el error persistiera con listsCount, se podría probar esto.
    };
    const results = await yahooFinance.search(keywords, queryOptions); 
    
    if (results && results.quotes && results.quotes.length > 0) {
      return results.quotes.map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.name || q.symbol, 
        type: q.quoteType,      
        exchange: q.exchange,   
      }));
    }
    console.warn(`[MarketDataService-Yahoo] Búsqueda para "${keywords}" no produjo resultados de 'quotes'. Respuesta:`, JSON.stringify(results).substring(0,300));
    return [];
  } catch (error) {
    console.error(`[MarketDataService-Yahoo] Error buscando símbolos para "${keywords}":`, error.message);
    if (error.message.includes("Validation called with invalid options")) {
        console.error("[MarketDataService-Yahoo] El error de 'Invalid options' persistió. Revisa las opciones de búsqueda de yahoo-finance2 o la versión de la librería.");
    }
    return []; 
  }
};

module.exports = {
  fetchQuotesForTickers,
  getSimulatedFixedTermRates,
  searchSymbols, 
};