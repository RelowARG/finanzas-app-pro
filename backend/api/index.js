// Ruta: finanzas-app-pro/backend/api/index.js
const express = require('express');
const router = express.Router();

// Importar rutas de los módulos
const authRoutes = require('./auth/auth.routes');
const accountRoutes = require('./accounts/accounts.routes');
const categoryRoutes = require('./categories/categories.routes');
const transactionRoutes = require('./transactions/transactions.routes');
const investmentRoutes = require('./investments/investments.routes');
const budgetRoutes = require('./budgets/budgets.routes');
const recurringTransactionRoutes = require('./recurringTransactions/recurringTransactions.routes');
const reportRoutes = require('./reports/reports.routes');
const marketDataRoutes = require('./marketdata/marketdata.routes');
const debtAndLoanRoutes = require('./debtAndLoan/debtAndLoan.routes');
const exchangeRateRoutes = require('./exchangeRates/exchangeRates.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');
const adminRoutes = require('./admin/admin.routes');
const permissionRoutes = require('./permissions/permissions.routes'); // *** NUEVO ***


// Montar rutas de los módulos
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/investments', investmentRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring-transactions', recurringTransactionRoutes);
router.use('/reports', reportRoutes);
router.use('/marketdata', marketDataRoutes);
router.use('/debts-loans', debtAndLoanRoutes);
router.use('/exchange-rates', exchangeRateRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes); 
// Montar las rutas de configuración de permisos bajo /admin/config/permissions para mayor seguridad y organización
router.use('/admin/config/permissions', permissionRoutes); // *** NUEVO ***


router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente! Modularizado! 🎉' });
});

module.exports = router;