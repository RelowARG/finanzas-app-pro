// Ruta: finanzas-app-pro/backend/api/budgets/budgets.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const budgetsController = require('./budgets.controller');
const { protect } = require('../../middleware/authMiddleware');

// Aplicar middleware de protección a todas las rutas de presupuestos
router.use(protect);

router.route('/')
  .post(budgetsController.createBudget)
  .get(budgetsController.getBudgets);

router.route('/:id')
  .get(budgetsController.getBudgetById)
  .put(budgetsController.updateBudget)
  .delete(budgetsController.deleteBudget);

module.exports = router;
