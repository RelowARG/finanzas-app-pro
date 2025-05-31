// Ruta: finanzas-app-pro/backend/services/marketData.service.js
// REVERTIDO A ALPHA VANTAGE
const axios = require('axios');
// dotenv se carga en server.js, pero si este archivo se usara independientemente, sería bueno tenerlo.
// require('dotenv').config({ path: '../.env' }); 

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Helper para simular fluctuación de precios si la API falla o para tipos no cubiertos
const simulatePriceFluctuation = (currentPrice, basePurchasePrice) => {
  const numCurrentPrice = parseFloat(currentPrice);
  const numBasePurchasePrice = parseFloat(basePurchasePrice);

  if (isNaN(numCurrentPrice) || isNaN(numBasePurchasePrice) || numBasePurchasePrice === 0) {
    return numCurrentPrice || 0;
  }
  const percentageChange = (Math.random() * 0.08) - 0.045;
  let newPrice = numCurrentPrice * (1 + percentageChange);
  newPrice = Math.max(numBasePurchasePrice * 0.7, newPrice);
  newPrice = Math.min(numBasePurchasePrice * 3.0, newPrice);
  const originalDecimals = (numCurrentPrice.toString().split('.')[1] || '').length;
  return parseFloat(newPrice.toFixed(Math.max(2, originalDecimals)));
};

const fetchQuotesForTickers = async (investmentsToUpdate) => {
  if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'TU_API_KEY_DE_ALPHA_VANTAGE') {
    console.warn('[MarketDataService-AlphaVantage] API Key de Alpha Vantage no configurada o es la de ejemplo. Usando simulación de precios para cotizaciones.');
    const simulatedQuotes = {};
    for (const investment of investmentsToUpdate) {
        if ((investment.type === 'acciones' || investment.type === 'criptomonedas') && (investment.ticker || investment.name)) {
            const identifier = investment.ticker || investment.name; // Usar ticker si está, sino nombre
            simulatedQuotes[identifier] = {
                price: simulatePriceFluctuation(investment.currentPrice || investment.purchasePrice, investment.purchasePrice),
                currency: investment.currency, // Asumir la moneda de la inversión
            };
        }
    }
    return simulatedQuotes;
  }

  const updatedQuotes = {};
  // Alpha Vantage tiene un límite de frecuencia de llamadas (ej. 5 por minuto para el plan gratuito)
  // Procesaremos las solicitudes secuencialmente con un retraso.
  const requests = [];

  for (const investment of investmentsToUpdate) {
    let symbol;
    let params = { apikey: ALPHA_VANTAGE_API_KEY };
    let isCrypto = false;

    if (investment.type === 'acciones' && investment.ticker) {
      symbol = investment.ticker;
      params.function = 'GLOBAL_QUOTE';
      params.symbol = symbol;
    } else if (investment.type === 'criptomonedas' && investment.ticker) {
      // Alpha Vantage usa el ticker de la cripto (ej. BTC) y la moneda fiat (ej. USD)
      const cryptoTickerParts = investment.ticker.split('-'); // Ej. BTC-USD
      if (cryptoTickerParts.length === 2) {
        symbol = cryptoTickerParts[0]; // Ej: BTC
        params.function = 'CURRENCY_EXCHANGE_RATE';
        params.from_currency = symbol;
        params.to_currency = cryptoTickerParts[1] || investment.currency || 'USD'; // Ej: USD
        isCrypto = true;
      } else {
        console.warn(`[MarketDataService-AlphaVantage] Ticker de criptomoneda no válido para Alpha Vantage: ${investment.ticker}. Debe ser FORMATO-MONEDA (ej. BTC-USD).`);
        continue;
      }
    } else {
      console.log(`[MarketDataService-AlphaVantage] Omitiendo cotización para ${investment.name} (tipo: ${investment.type}, ticker: ${investment.ticker || 'N/A'})`);
      continue;
    }

    requests.push(
      () => axios.get(ALPHA_VANTAGE_BASE_URL, { params })
        .then(response => {
          const data = response.data;
          let price;

          if (data && data.Note) { // Nota sobre límite de API
            console.warn(`[MarketDataService-AlphaVantage] Nota de Alpha Vantage para ${symbol}: ${data.Note}`);
            // No se puede obtener precio, se podría simular o devolver error.
            return; // Salir de este then, no se actualiza el precio.
          }

          if (isCrypto) {
            if (data && data['Realtime Currency Exchange Rate']) {
              price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
            }
          } else { // Acciones
            if (data && data['Global Quote']) {
              price = parseFloat(data['Global Quote']['05. price']);
            }
          }

          if (price !== undefined && !isNaN(price)) {
            updatedQuotes[symbol] = { price: price, currency: params.to_currency || investment.currency }; // Usar la moneda a la que se convirtió o la de la inversión
            console.log(`[MarketDataService-AlphaVantage] Cotización obtenida para ${symbol}: ${price} ${updatedQuotes[symbol].currency}`);
          } else {
            console.warn(`[MarketDataService-AlphaVantage] No se pudo obtener el precio para ${symbol} de Alpha Vantage. Respuesta:`, data);
          }
        })
        .catch(error => {
          console.error(`[MarketDataService-AlphaVantage] Error obteniendo cotización para ${symbol}:`, error.response?.data || error.message);
        })
    );
  }

  // Ejecutar solicitudes secuencialmente con retraso para evitar límite de API
  for (let i = 0; i < requests.length; i++) {
    await requests[i]();
    if (i < requests.length - 1) {
      // Esperar aprox. 12-15 segundos entre llamadas para el plan gratuito (5 llamadas/min)
      await new Promise(resolve => setTimeout(resolve, 15000)); 
    }
  }
  return updatedQuotes;
};

const searchSymbols = async (keywords) => {
  if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'TU_API_KEY_DE_ALPHA_VANTAGE') {
    console.warn('[MarketDataService-AlphaVantage] API Key de Alpha Vantage no configurada o es la de ejemplo. Búsqueda de símbolos no disponible.');
    return [];
  }
  if (!keywords || keywords.trim().length < 1) { // Alpha Vantage puede buscar con 1 caracter
    return [];
  }

  console.log(`[MarketDataService-AlphaVantage] Buscando símbolos para keywords: "${keywords}"`);
  try {
    const params = {
      function: 'SYMBOL_SEARCH',
      keywords: keywords,
      apikey: ALPHA_VANTAGE_API_KEY
    };
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, { params });
    const data = response.data;

    if (data && data.Note) {
        console.warn(`[MarketDataService-AlphaVantage] Nota de Alpha Vantage (búsqueda): ${data.Note}`);
        // Si es nota de límite, devolver array vacío.
        return []; 
    }

    if (data && data.bestMatches && Array.isArray(data.bestMatches)) {
      return data.bestMatches.map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'], // Ej: Equity, ETF, Mutual Fund
        region: match['4. region'],
        currency: match['8. currency']
      }));
    } else {
      console.warn('[MarketDataService-AlphaVantage] No se encontraron coincidencias o formato de respuesta inesperado para:', keywords, data);
      return [];
    }
  } catch (error) {
    console.error(`[MarketDataService-AlphaVantage] Error buscando símbolos para "${keywords}":`, error.response?.data || error.message);
    return []; 
  }
};

// Mantener simulación de tasas de plazo fijo si se usa en otras partes
const getSimulatedFixedTermRates = async (currency = 'ARS') => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simular delay
    if (currency === 'ARS') {
        return { tna30days: parseFloat((Math.random() * (35 - 25) + 25).toFixed(2)) };
    }
    return { tna30days: parseFloat((Math.random() * (4 - 2) + 2).toFixed(2)) };
};

module.exports = {
  fetchQuotesForTickers,
  searchSymbols,
  getSimulatedFixedTermRates,
};
