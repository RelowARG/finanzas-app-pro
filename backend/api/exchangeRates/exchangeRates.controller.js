// finanzas-app-pro/backend/api/exchangeRates/exchangeRates.controller.js
const db = require('../../models');
const ExchangeRate = db.ExchangeRate;
const { Op } = require('sequelize');

// @desc    Set or update an exchange rate for a specific month and year
// @route   POST /api/exchange-rates
// @access  Private
const setExchangeRate = async (req, res, next) => {
  const { year, month, rate, fromCurrency = 'USD', toCurrency = 'ARS' } = req.body;
  const userId = req.user.id;

  if (!year || !month || rate === undefined || rate === null) {
    return res.status(400).json({ message: 'Año, mes y tasa son requeridos.' });
  }
  if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
    return res.status(400).json({ message: 'Mes inválido. Debe ser entre 1 y 12.' });
  }
  if (parseFloat(rate) <= 0) {
    return res.status(400).json({ message: 'La tasa debe ser un número positivo.' });
  }

  try {
    const [exchangeRateEntry, created] = await ExchangeRate.findOrCreate({
      where: { userId, year: parseInt(year), month: parseInt(month), fromCurrency, toCurrency },
      defaults: { rate: parseFloat(rate) }
    });

    if (!created) { // If found, update it
      exchangeRateEntry.rate = parseFloat(rate);
      await exchangeRateEntry.save();
    }

    res.status(created ? 201 : 200).json(exchangeRateEntry);
  } catch (error) {
    console.error('Error en setExchangeRate:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Get exchange rate for a specific month and year
// @route   GET /api/exchange-rates?year=YYYY&month=MM[&from=USD&to=ARS]
// @access  Private
const getExchangeRate = async (req, res, next) => {
  const { year, month, from = 'USD', to = 'ARS' } = req.query;
  const userId = req.user.id;

  if (!year || !month) {
    return res.status(400).json({ message: 'Año y mes son requeridos como parámetros de consulta.' });
  }

  try {
    const rateEntry = await ExchangeRate.findOne({
      where: {
        userId,
        year: parseInt(year),
        month: parseInt(month),
        fromCurrency: from,
        toCurrency: to,
      }
    });

    if (!rateEntry) {
      // It's not an error if a rate for a specific month isn't set, return null
      return res.status(200).json(null); 
    }
    res.status(200).json(rateEntry);
  } catch (error) {
    console.error('Error en getExchangeRate:', error);
    next(error);
  }
};

// @desc    Get all exchange rates for the user (optionally filtered by year)
// @route   GET /api/exchange-rates/history?[year=YYYY&from=USD&to=ARS]
// @access  Private
const getExchangeRateHistory = async (req, res, next) => {
  const userId = req.user.id;
  const { year, from = 'USD', to = 'ARS' } = req.query;
  const whereClause = { userId, fromCurrency: from, toCurrency: to };

  if (year) {
    whereClause.year = parseInt(year);
  }

  try {
    const rates = await ExchangeRate.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
    res.status(200).json(rates);
  } catch (error) {
    console.error('Error en getExchangeRateHistory:', error);
    next(error);
  }
};

module.exports = {
  setExchangeRate,
  getExchangeRate,
  getExchangeRateHistory,
};
