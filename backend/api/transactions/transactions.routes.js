// Ruta: finanzas-app-pro/backend/api/transactions/transactions.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const transactionsController = require('./transactions.controller');
const { protect } = require('../../middleware/authMiddleware');

// Aplicar middleware de protección a todas las rutas de transacciones
router.use(protect);

router.route('/')
  .post(transactionsController.createTransaction)
  .get(transactionsController.getTransactions);

router.route('/:id')
  .get(transactionsController.getTransactionById)
  .put(transactionsController.updateTransaction)
  .delete(transactionsController.deleteTransaction);

module.exports = router;
