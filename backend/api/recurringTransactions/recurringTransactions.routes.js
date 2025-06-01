// Ruta: finanzas-app-pro/backend/api/recurringTransactions/recurringTransactions.routes.js
const express = require('express');
const router = express.Router();
const recurringTransactionsController = require('./recurringTransactions.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect); // Proteger todas las rutas de transacciones recurrentes

router.route('/')
  .post(recurringTransactionsController.createRecurringTransaction)
  .get(recurringTransactionsController.getRecurringTransactions);

router.route('/:id')
  .get(recurringTransactionsController.getRecurringTransactionById)
  .put(recurringTransactionsController.updateRecurringTransaction)
  .delete(recurringTransactionsController.deleteRecurringTransaction);

// *** NUEVA RUTA ***
router.post('/:id/process', recurringTransactionsController.processRecurringTransactionManually);

module.exports = router;