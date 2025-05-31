// Ruta: finanzas-app-pro/backend/api/marketdata/marketdata.controller.js
// REVISAR - No se necesitan cambios si la firma del servicio se mantiene y la respuesta se adapta
const marketDataService = require('../../services/marketData.service');

// @desc    Buscar símbolos/tickers
// @route   GET /api/marketdata/search-symbol?keywords=MSFT
// @access  Private
const searchSymbol = async (req, res, next) => {
  const { keywords } = req.query;

  if (!keywords) {
    return res.status(400).json({ message: 'El parámetro "keywords" es requerido.' });
  }

  try {
    // La función marketDataService.searchSymbols ahora usa Yahoo Finance
    const results = await marketDataService.searchSymbols(keywords);
    res.status(200).json(results);
  } catch (error) {
    console.error(`[MarketDataController] Error en searchSymbol para "${keywords}":`, error.message);
    next(error); 
  }
};

module.exports = {
  searchSymbol,
};