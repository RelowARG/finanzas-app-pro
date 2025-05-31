// Ruta: finanzas-app-pro/backend/api/accounts/accounts.routes.js
// ACTUALIZA ESTE ARCHIVO
const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const { protect } = require('../../middleware/authMiddleware'); // <--- Importar middleware de protección

// Aplicar el middleware 'protect' a todas las rutas de cuentas
router.use(protect);

// @desc    Obtener todas las cuentas del usuario o crear una nueva
// @route   GET /api/accounts
// @route   POST /api/accounts
// @access  Private
router.route('/')
  .get(accountsController.getAccounts)
  .post(accountsController.createAccount);

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
