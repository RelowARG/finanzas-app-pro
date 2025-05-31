// Ruta: finanzas-app-pro/backend/api/investments/investments.routes.js
// ACTUALIZA ESTE ARCHIVO
const express = require('express');
const router = express.Router();
const investmentsController = require('./investments.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(investmentsController.createInvestment)
  .get(investmentsController.getInvestments);

// Nueva ruta para actualizar cotizaciones
router.post('/update-quotes', investmentsController.updateInvestmentQuotes); // <--- NUEVA RUTA

router.route('/:id')
  .get(investmentsController.getInvestmentById)
  .put(investmentsController.updateInvestment)
  .delete(investmentsController.deleteInvestment);

module.exports = router;
