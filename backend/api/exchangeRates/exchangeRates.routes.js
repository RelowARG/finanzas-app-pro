// finanzas-app-pro/backend/api/exchangeRates/exchangeRates.routes.js
const express = require('express');
const router = express.Router();
const exchangeRatesController = require('./exchangeRates.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(exchangeRatesController.setExchangeRate)
  .get(exchangeRatesController.getExchangeRate); // To get a specific month's rate

router.route('/history')
  .get(exchangeRatesController.getExchangeRateHistory); // To get a list of rates

module.exports = router;
