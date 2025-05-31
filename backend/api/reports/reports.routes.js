// Ruta: finanzas-app-pro/backend/api/reports/reports.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { protect } = require('../../middleware/authMiddleware');

// Aplicar middleware de protección a todas las rutas de informes
router.use(protect);

// @desc    Obtener informe de gastos por categoría
// @route   GET /api/reports/expenses-by-category
// @access  Private
router.get('/expenses-by-category', reportsController.getExpensesByCategoryReport);

// @desc    Obtener informe de ingresos vs. egresos
// @route   GET /api/reports/income-vs-expenses
// @access  Private
router.get('/income-vs-expenses', reportsController.getIncomeVsExpensesReport);

// Aquí podríamos añadir más rutas para otros informes en el futuro
// ej: router.get('/net-worth-evolution', reportsController.getNetWorthEvolutionReport);

module.exports = router;
