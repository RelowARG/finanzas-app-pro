// Ruta: finanzas-app-pro/backend/api/investments/investments.controller.js
// REVISADO Y AJUSTADO PARA CONSISTENCIA
const db = require('../../models');
const Investment = db.Investment;
const { Op } = require('sequelize');
const marketDataService = require('../../services/marketData.service'); // Asegurar que esté importado

// @desc    Crear una nueva inversión
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res, next) => {
  const {
    name, type, entity, currency, initialInvestment, currentValue, purchaseDate,
    icon, notes, startDate, endDate, interestRate, quantity, purchasePrice,
    currentPrice, ticker, amountInvested,
    autoRenew, renewWithInterest
  } = req.body;
  const userId = req.user.id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nombre y tipo son requeridos para la inversión.' });
  }

  let finalInitialInvestment = 0;
  if (initialInvestment !== undefined) {
    finalInitialInvestment = parseFloat(initialInvestment) || 0;
  } else if ((type === 'acciones' || type === 'criptomonedas') && quantity && purchasePrice) {
    finalInitialInvestment = (parseFloat(quantity) || 0) * (parseFloat(purchasePrice) || 0);
  } else if (amountInvested !== undefined) { // Para FCI, Obligaciones, Otro
    finalInitialInvestment = parseFloat(amountInvested) || 0;
  }
  
  let finalCurrentValue;
  if (currentValue !== undefined) {
    finalCurrentValue = parseFloat(currentValue);
  } else if ((type === 'acciones' || type === 'criptomonedas') && currentPrice !== undefined && quantity !== undefined) {
    finalCurrentValue = (parseFloat(quantity) || 0) * (parseFloat(currentPrice) || 0);
  } else {
    finalCurrentValue = finalInitialInvestment; // Por defecto, el valor actual es el inicial
  }
  
  // El precio actual por unidad solo aplica a acciones/cripto
  let finalCurrentPriceForNew = (type === 'acciones' || type === 'criptomonedas') 
                                ? (currentPrice !== undefined ? parseFloat(currentPrice) : (purchasePrice !== undefined ? parseFloat(purchasePrice) : null) )
                                : null;

  try {
    const newInvestment = await Investment.create({
      name, type, entity,
      currency: currency || 'ARS',
      initialInvestment: finalInitialInvestment,
      currentValue: finalCurrentValue,
      purchaseDate: purchaseDate || null, // Permitir nulo si no aplica (ej. PF que usa startDate)
      icon, notes,
      startDate: type === 'plazo_fijo' ? startDate : null,
      endDate: type === 'plazo_fijo' ? endDate : null,
      interestRate: (type === 'plazo_fijo' || type === 'fci') && interestRate ? parseFloat(interestRate) : null,
      autoRenew: type === 'plazo_fijo' ? (autoRenew || false) : false,
      renewWithInterest: type === 'plazo_fijo' ? (renewWithInterest || false) : false,
      quantity: (type === 'acciones' || type === 'criptomonedas') && quantity ? parseFloat(quantity) : null,
      purchasePrice: (type === 'acciones' || type === 'criptomonedas') && purchasePrice ? parseFloat(purchasePrice) : null,
      currentPrice: finalCurrentPriceForNew,
      ticker: (type === 'acciones' || type === 'criptomonedas') ? (ticker ? ticker.toUpperCase() : null) : null,
      amountInvested: (type === 'fci' || type === 'obligaciones' || type === 'otro') && amountInvested ? parseFloat(amountInvested) : null,
      userId,
    });
    res.status(201).json(newInvestment);
  } catch (error) {
    console.error('Error en createInvestment:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener todas las inversiones del usuario
// @route   GET /api/investments
// @access  Private
const getInvestments = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const investments = await Investment.findAll({
      where: { userId: userId },
      order: [['name', 'ASC']] // Ordenar por nombre
    });
    res.status(200).json(investments);
  } catch (error) {
    console.error('Error en getInvestments:', error);
    next(error);
  }
};

// @desc    Obtener una inversión específica por ID
// @route   GET /api/investments/:id
// @access  Private
const getInvestmentById = async (req, res, next) => {
  const userId = req.user.id;
  const investmentId = req.params.id;
  try {
    const investment = await Investment.findOne({
      where: { id: investmentId, userId: userId }
    });
    if (!investment) {
      return res.status(404).json({ message: 'Inversión no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json(investment);
  } catch (error) {
    console.error('Error en getInvestmentById:', error);
    next(error);
  }
};

// @desc    Actualizar una inversión
// @route   PUT /api/investments/:id
// @access  Private
const updateInvestment = async (req, res, next) => {
  const userId = req.user.id;
  const investmentId = req.params.id;
  const updateData = req.body;

  try {
    const investment = await Investment.findOne({
      where: { id: investmentId, userId: userId }
    });

    if (!investment) {
      return res.status(404).json({ message: 'Inversión no encontrada o no pertenece al usuario.' });
    }

    // Lista de campos que se pueden actualizar directamente
    const directUpdateFields = [
      'name', 'entity', 'currency', 'icon', 'notes', 'purchaseDate', 
      'startDate', 'endDate', 'ticker', 'autoRenew', 'renewWithInterest'
    ];
    directUpdateFields.forEach(field => {
      if (updateData[field] !== undefined) {
        investment[field] = updateData[field];
      }
    });
    if (updateData.ticker) investment.ticker = updateData.ticker.toUpperCase();


    // Campos numéricos que pueden ser null o un número
    const numericFields = [
      'amountInvested', 'initialInvestment', 'currentValue', 
      'interestRate', 'quantity', 'purchasePrice', 'currentPrice'
    ];
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        investment[field] = (updateData[field] === '' || updateData[field] === null) ? null : parseFloat(updateData[field]);
      }
    });
    
    // Recalcular initialInvestment para acciones/cripto si cambian cantidad o precio de compra
    if ((investment.type === 'acciones' || investment.type === 'criptomonedas') && 
        (updateData.quantity !== undefined || updateData.purchasePrice !== undefined)) {
        const q = investment.quantity !== null ? parseFloat(investment.quantity) : 0;
        const pp = investment.purchasePrice !== null ? parseFloat(investment.purchasePrice) : 0;
        investment.initialInvestment = q * pp;
    }

    // Recalcular currentValue para acciones/cripto si no se envió explícitamente y cambian cantidad o precio actual
    if ((investment.type === 'acciones' || investment.type === 'criptomonedas') &&
        updateData.currentValue === undefined && // Solo si no se está seteando currentValue directamente
        (updateData.quantity !== undefined || updateData.currentPrice !== undefined)) {
      const q = investment.quantity !== null ? parseFloat(investment.quantity) : 0;
      const cp = investment.currentPrice !== null ? parseFloat(investment.currentPrice) : (investment.purchasePrice !== null ? parseFloat(investment.purchasePrice) : 0);
      investment.currentValue = q * cp;
    }

    await investment.save();
    res.status(200).json(investment);

  } catch (error) {
    console.error('Error en updateInvestment:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una inversión
// @route   DELETE /api/investments/:id
// @access  Private
const deleteInvestment = async (req, res, next) => {
  const userId = req.user.id;
  const investmentId = req.params.id;
  try {
    const investment = await Investment.findOne({
      where: { id: investmentId, userId: userId }
    });
    if (!investment) {
      return res.status(404).json({ message: 'Inversión no encontrada o no pertenece al usuario.' });
    }
    await investment.destroy();
    res.status(200).json({ message: 'Inversión eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteInvestment:', error);
    next(error);
  }
};

// @desc    Actualizar cotizaciones de inversiones (acciones, cripto)
// @route   POST /api/investments/update-quotes
// @access  Private
const updateInvestmentQuotes = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const userInvestments = await Investment.findAll({
      where: {
        userId: userId,
        type: { [Op.in]: ['acciones', 'criptomonedas'] },
        ticker: { [Op.ne]: null, [Op.ne]: '' } // Solo los que tienen ticker
      }
    });

    if (userInvestments.length === 0) {
      return res.status(200).json({ message: 'No hay acciones o criptomonedas con ticker para actualizar cotizaciones.', updatedCount: 0 });
    }

    const investmentsToFetch = userInvestments.map(inv => ({
      id: inv.id,
      ticker: inv.ticker,
      name: inv.name, // Para logging o referencia
      currency: inv.currency,
      currentPrice: inv.currentPrice, // Para simulación si falla API
      purchasePrice: inv.purchasePrice, // Para simulación si falla API
      type: inv.type
    }));

    const quotes = await marketDataService.fetchQuotesForTickers(investmentsToFetch);
    
    let updatedCount = 0;
    const updatePromises = [];

    for (const investment of userInvestments) {
      const identifier = investment.ticker; // Yahoo usa el ticker
      const quote = quotes[identifier];

      if (quote && quote.price !== undefined && quote.price !== null) {
        const newCurrentPrice = parseFloat(quote.price);
        const quantity = parseFloat(investment.quantity);

        if (isNaN(quantity)) {
            console.warn(`[InvestmentsController] Cantidad inválida para inversión ID ${investment.id} (${investment.name}). Saltando cálculo de currentValue.`);
            continue; 
        }
        const newCurrentValue = parseFloat((quantity * newCurrentPrice).toFixed(2));

        // Solo actualizar si hay un cambio real para evitar escrituras innecesarias
        if (investment.currentPrice !== newCurrentPrice || investment.currentValue !== newCurrentValue) {
          updatePromises.push(
            investment.update({
              currentPrice: newCurrentPrice,
              currentValue: newCurrentValue,
            })
          );
          updatedCount++;
        }
      } else {
        console.warn(`[InvestmentsController] No se recibió cotización válida para ${identifier} desde el servicio marketData.`);
      }
    }

    if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
    }
    
    res.status(200).json({ message: `Cotizaciones actualizadas para ${updatedCount} inversiones vía Yahoo Finance.`, updatedCount });

  } catch (error) {
    console.error('Error en updateInvestmentQuotes:', error);
    next(error);
  }
};

module.exports = {
  createInvestment,
  getInvestments,
  getInvestmentById,
  updateInvestment,
  deleteInvestment,
  updateInvestmentQuotes,
};