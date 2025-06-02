// Ruta: finanzas-app-pro/backend/api/accounts/accounts.routes.js
// ACTUALIZA ESTE ARCHIVO
const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const { protect } = require('../../middleware/authMiddleware'); 

// Aplicar el middleware 'protect' a todas las rutas de cuentas
router.use(protect);

// @desc    Obtener todas las cuentas del usuario o crear una nueva
// @route   GET /api/accounts
// @route   POST /api/accounts
// @access  Private
router.route('/')
  .get(accountsController.getAccounts)
  .post(accountsController.createAccount);

// *** NUEVA RUTA PARA PAGAR RESUMEN DE TARJETA ***
// @desc    Pagar resumen de tarjeta de crédito
// @route   POST /api/accounts/:cardAccountId/pay
// @access  Private
// Debe ir ANTES de la ruta genérica /:id para que no interprete 'pay' como un ID.
router.post('/:cardAccountId/pay', accountsController.payCreditCardStatement);

// @desc    Obtener, actualizar o eliminar una cuenta específica por ID
// @route   GET /api/accounts/:id
// @route   PUT /api/accounts/:id
// @route   DELETE /api/accounts/:id
// @access  Private
router.route('/:id')
  .get(accountsController.getAccountById)
  .put(accountsController.updateAccount)
  .delete(accountsController.deleteAccount);

module.exports = router;
