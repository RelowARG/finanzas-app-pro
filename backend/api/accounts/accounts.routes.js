// Ruta: backend/api/accounts/accounts.routes.js
//console.log('DEBUG: accounts.routes.js started loading');
const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const { getAccountTrendController } = require('./accountTrend.controller'); 
const { protect } = require('../../middleware/authMiddleware');

//console.log('DEBUG: accountTrendController (from import) in routes:', typeof getAccountTrendController);

router.use(protect); // Todas las rutas requieren autenticación

router.route('/')
  .post(accountsController.createAccount)
  .get(accountsController.getAllAccounts);

router.route('/:id')
  .get(accountsController.getAccountById)
  .put(accountsController.updateAccount)
  .delete(accountsController.deleteAccount);

// Ruta para la tendencia de saldo de una cuenta específica
router.get('/:accountId/trend', getAccountTrendController); 

// *** NUEVA RUTA PARA PAGAR TARJETA DE CRÉDITO ***
router.post('/:accountId/pay', accountsController.payCreditCard); 

module.exports = router;
//console.log('DEBUG: accounts.routes.js finished loading');