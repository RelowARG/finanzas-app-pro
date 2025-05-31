// Ruta: finanzas-app-pro/backend/api/debtAndLoan/debtAndLoan.routes.js
// NUEVO ARCHIVO
const express = require('express');
const router = express.Router();
const debtAndLoanController = require('./debtAndLoan.controller');
const { protect } = require('../../middleware/authMiddleware');

// Aplicar middleware de protección a todas las rutas de deudas y préstamos
router.use(protect);

router.route('/')
  .post(debtAndLoanController.createDebtAndLoan)
  .get(debtAndLoanController.getDebtsAndLoans);

router.route('/:id')
  .get(debtAndLoanController.getDebtAndLoanById)
  .put(debtAndLoanController.updateDebtAndLoan)
  .delete(debtAndLoanController.deleteDebtAndLoan);

// Ruta para registrar un pago parcial o completo a una deuda/préstamo
router.post('/:id/record-payment', debtAndLoanController.recordPayment);

module.exports = router;
