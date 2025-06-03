// Ruta: finanzas-app-pro/backend/api/accounts/accounts.controller.js
const db = require('../../models');
const Account = db.Account;
const Category = db.Category;
const Transaction = db.Transaction;
const RecurringTransaction = db.RecurringTransaction;
const { Op, literal } = require('sequelize');

// @desc    Crear una nueva cuenta
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  // *** ACTUALIZADO: Añadir 'color' y asegurar 'includeInDashboardSummary' se maneja ***
  const { name, type, balance, currency, icon, color, bankName, accountNumberLast4, creditLimit, includeInDashboardSummary, statementBalance, statementCloseDate, statementDueDate } = req.body;
  const userId = req.user.id;

  if (!name || !type || balance === undefined || balance === null || !currency) {
    return res.status(400).json({ message: 'Nombre, tipo, balance y moneda son requeridos.' });
  }

  try {
    const newAccount = await Account.create({
      name,
      type,
      balance: parseFloat(balance),
      currency,
      icon,
      color, // *** AÑADIDO ***
      bankName,
      accountNumberLast4,
      creditLimit: type === 'tarjeta_credito' ? parseFloat(creditLimit) : null,
      // includeInDashboardSummary viene del modal como el opuesto de "excludeFromStatistics"
      includeInDashboardSummary: includeInDashboardSummary !== undefined ? includeInDashboardSummary : true,
      statementBalance: type === 'tarjeta_credito' ? parseFloat(statementBalance || 0) : null,
      statementCloseDate: type === 'tarjeta_credito' ? statementCloseDate : null,
      statementDueDate: type === 'tarjeta_credito' ? statementDueDate : null,
      userId,
    });
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error en createAccount:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener todas las cuentas del usuario
// @route   GET /api/accounts
// @access  Private
const getAllAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error en getAllAccounts:', error);
    next(error);
  }
};

// @desc    Obtener una cuenta por ID
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json(account);
  } catch (error) {
    console.error('Error en getAccountById:', error);
    next(error);
  }
};

// @desc    Actualizar una cuenta
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  // *** ACTUALIZADO: Añadir 'color' y asegurar 'includeInDashboardSummary' se maneja ***
  const { name, type, balance, currency, icon, color, bankName, accountNumberLast4, creditLimit, includeInDashboardSummary, statementBalance, statementCloseDate, statementDueDate } = req.body;
  const userId = req.user.id;

  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: userId }
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
    }

    const hasTransactions = await db.Transaction.count({ where: { accountId: account.id } });
    if (hasTransactions > 0 && account.type !== type) { // El tipo no debería cambiar si hay transacciones
        return res.status(400).json({ message: 'No se puede cambiar el tipo de una cuenta con movimientos existentes.' });
    }

    if (!name || !type || balance === undefined || balance === null || !currency) {
        return res.status(400).json({ message: 'Nombre, tipo, balance y moneda son requeridos.' });
    }

    account.name = name;
    // account.type = type; // Generalmente el tipo no se edita después de la creación, o si se edita, requiere cuidado.
                         // Lo mantenemos por si el modal de edición lo permite, pero el modal de creación es el foco.
    account.balance = parseFloat(balance); // En el formulario de EDICIÓN de cuenta, SÍ se envía el balance.
    account.currency = currency;
    account.icon = icon;
    account.color = color; // *** AÑADIDO ***
    account.bankName = bankName;
    account.accountNumberLast4 = accountNumberLast4;
    account.includeInDashboardSummary = includeInDashboardSummary !== undefined ? includeInDashboardSummary : account.includeInDashboardSummary;
    account.creditLimit = account.type === 'tarjeta_credito' ? parseFloat(creditLimit || 0) : null; // Usar account.type (el original)
    account.statementBalance = account.type === 'tarjeta_credito' ? parseFloat(statementBalance || 0) : null;
    account.statementCloseDate = account.type === 'tarjeta_credito' ? statementCloseDate : null;
    account.statementDueDate = account.type === 'tarjeta_credito' ? statementDueDate : null;

    await account.save();
    res.status(200).json(account);

  } catch (error) {
    console.error('Error en updateAccount:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una cuenta
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
    }

    const transactionCount = await db.Transaction.count({
      where: { accountId: account.id }
    });
    if (transactionCount > 0) {
      return res.status(400).json({ message: 'No se puede eliminar la cuenta porque tiene movimientos asociados. Elimina o reasigna los movimientos primero.' });
    }
    
    const recurringTransactionCount = await db.RecurringTransaction.count({
        where: { accountId: account.id }
    });
    if (recurringTransactionCount > 0) {
        return res.status(400).json({ message: 'No se puede eliminar la cuenta porque tiene movimientos recurrentes asociados. Elimina o desactiva los movimientos recurrentes primero.' });
    }

    await account.destroy();
    res.status(200).json({ message: 'Cuenta eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteAccount:', error);
    next(error);
  }
};

// @desc    Pagar el resumen de una tarjeta de crédito
// @route   POST /api/accounts/:accountId/pay
// @access  Private
const payCreditCard = async (req, res, next) => {
  const { accountId: creditCardAccountId } = req.params;
  const { payingAccountId, paymentAmount, paymentDate, notes } = req.body;
  const userId = req.user.id;

  if (!payingAccountId || !paymentAmount || !paymentDate) {
    return res.status(400).json({ message: 'Cuenta pagadora, monto y fecha son requeridos.' });
  }
  if (parseFloat(paymentAmount) <= 0) {
    return res.status(400).json({ message: 'El monto del pago debe ser positivo.' });
  }

  const t = await db.sequelize.transaction();

  try {
    const creditCardAccount = await Account.findOne({
      where: { id: creditCardAccountId, userId, type: 'tarjeta_credito' },
      transaction: t
    });
    if (!creditCardAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Tarjeta de crédito no encontrada o no pertenece al usuario.' });
    }

    const payingAccount = await Account.findOne({
      where: { id: payingAccountId, userId },
      transaction: t
    });
    if (!payingAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta pagadora no encontrada o no pertenece al usuario.' });
    }
    if (payingAccount.id.toString() === creditCardAccount.id.toString()) {
        await t.rollback();
        return res.status(400).json({ message: 'La cuenta pagadora no puede ser la misma tarjeta de crédito.' });
    }

    const numericPaymentAmount = parseFloat(paymentAmount);

    let paymentCategory = await Category.findOne({ 
        where: { name: 'Pago de Tarjetas', type: 'egreso', [Op.or]: [{ userId: null }, { userId }] },
        transaction: t
    });
    if (!paymentCategory) {
        paymentCategory = await Category.findOne({ where: { name: 'Transferencias Salientes', type: 'egreso', [Op.or]: [{ userId: null }, { userId }] }, transaction: t}) 
                       || await Category.findOne({ where: { name: 'Otros Egresos', type: 'egreso', [Op.or]: [{ userId: null }, { userId }] }, transaction: t});
        if (!paymentCategory) {
            const categories = await Category.findAll({where: {type: 'egreso', [Op.or]: [{ userId: null }, { userId }]}, limit: 1, transaction: t});
            if (categories.length > 0) paymentCategory = categories[0];
            else {
                await t.rollback();
                return res.status(500).json({ message: 'No se encontró una categoría de egreso adecuada para el pago.' });
            }
        }
    }
    
    const egresoTransaction = await Transaction.create({
      description: `Pago Tarjeta ${creditCardAccount.name}${notes ? ` (${notes})` : ''}`,
      amount: -numericPaymentAmount,
      currency: payingAccount.currency,
      date: paymentDate,
      type: 'egreso', 
      accountId: payingAccount.id,
      categoryId: paymentCategory.id,
      userId,
    }, { transaction: t });

    payingAccount.balance = parseFloat(payingAccount.balance) - numericPaymentAmount;
    await payingAccount.save({ transaction: t });

     let creditCardPaymentCategory = await Category.findOne({ 
        where: { name: 'Pago de Tarjetas', type: 'ingreso', [Op.or]: [{ userId: null }, { userId }] },
        transaction: t
    });
     if (!creditCardPaymentCategory) {
        creditCardPaymentCategory = await Category.findOne({ where: { name: 'Transferencias Entrantes', type: 'ingreso', [Op.or]: [{ userId: null }, { userId }] }, transaction: t})
                                || await Category.findOne({ where: { name: 'Otros Ingresos', type: 'ingreso', [Op.or]: [{ userId: null }, { userId }] }, transaction: t});
         if (!creditCardPaymentCategory) {
            const categories = await Category.findAll({where: {type: 'ingreso', [Op.or]: [{ userId: null }, { userId }]}, limit: 1, transaction: t});
            if (categories.length > 0) creditCardPaymentCategory = categories[0];
            else {
                await t.rollback();
                return res.status(500).json({ message: 'No se encontró una categoría de ingreso adecuada para el crédito en la tarjeta.' });
            }
        }
    }

    const ingresoTransaction = await Transaction.create({
      description: `Pago Tarjeta desde ${payingAccount.name}${notes ? ` (${notes})` : ''}`,
      amount: numericPaymentAmount, 
      currency: creditCardAccount.currency,
      date: paymentDate,
      type: 'ingreso', 
      accountId: creditCardAccount.id,
      categoryId: creditCardPaymentCategory.id, 
      userId,
    }, { transaction: t });

    creditCardAccount.balance = parseFloat(creditCardAccount.balance) + numericPaymentAmount;
    
    if (creditCardAccount.statementBalance !== null && creditCardAccount.statementBalance !== undefined) {
      const currentStatement = Math.abs(parseFloat(creditCardAccount.statementBalance));
      if (numericPaymentAmount >= currentStatement) {
        creditCardAccount.statementBalance = 0; 
      } else {
        creditCardAccount.statementBalance = currentStatement - numericPaymentAmount;
      }
    }
    await creditCardAccount.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      message: 'Pago de tarjeta registrado exitosamente.',
      payingAccount: payingAccount.toJSON(),
      creditCardAccount: creditCardAccount.toJSON(),
      transactions: [egresoTransaction.toJSON(), ingresoTransaction.toJSON()]
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('[PayCreditCardController] Error:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: error.message, errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};


module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  payCreditCard,
};