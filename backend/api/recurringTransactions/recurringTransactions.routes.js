// Ruta: finanzas-app-pro/backend/api/recurringTransactions/recurringTransactions.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const recurringTransactionsController = require('./recurringTransactions.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(recurringTransactionsController.createRecurringTransaction)
  .get(recurringTransactionsController.getRecurringTransactions);

router.route('/:id')
  .get(recurringTransactionsController.getRecurringTransactionById)
  .put(recurringTransactionsController.updateRecurringTransaction)
  .delete(recurringTransactionsController.deleteRecurringTransaction);

module.exports = router;
