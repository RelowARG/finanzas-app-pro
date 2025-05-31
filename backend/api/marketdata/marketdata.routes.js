// Ruta: finanzas-app-pro/backend/api/marketdata/marketdata.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const marketDataController = require('./marketdata.controller');
const { protect } = require('../../middleware/authMiddleware'); // Proteger el endpoint

router.use(protect); // Todas las rutas de datos de mercado serán protegidas

// @desc    Buscar símbolos/tickers
// @route   GET /api/marketdata/search-symbol
router.get('/search-symbol', marketDataController.searchSymbol);

module.exports = router;
