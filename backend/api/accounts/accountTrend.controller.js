// Ruta: backend/api/accounts/accountTrend.controller.js
console.log('DEBUG: accountTrend.controller.js started loading');
const accountTrendService = require('../../services/accountTrend.service');
console.log('DEBUG: accountTrendService loaded in controller:', typeof accountTrendService.getAccountBalanceTrend);


const getAccountTrendController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.accountId; // Obtener el ID de la cuenta de los parámetros de la URL
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const targetCurrency = req.query.currency || 'ARS';

    const trendData = await accountTrendService.getAccountBalanceTrend(userId, accountId, months, targetCurrency);
    res.json(trendData);
  } catch (error) {
    console.error('[AccountTrendController] Error in getAccountTrendController:', error);
    next(error);
  }
};

module.exports = {
  getAccountTrendController,
};
console.log('DEBUG: accountTrend.controller.js finished loading and exporting getAccountTrendController');

