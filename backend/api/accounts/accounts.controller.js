// Ruta: finanzas-app-pro/backend/api/accounts/accounts.controller.js
const db = require('../../models'); //
const Account = db.Account; //
const Transaction = db.Transaction; // Para la nueva funcionalidad de pago

// @desc    Obtener todas las cuentas del usuario autenticado
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.findAll({
      where: { userId: req.user.id }, 
      order: [['name', 'ASC']] 
    });
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error en getAccounts:', error);
    next(error);
  }
};

// @desc    Crear una nueva cuenta para el usuario autenticado
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  const { 
    name, type, balance, currency, icon, 
    bankName, accountNumberLast4, creditLimit,
    includeInDashboardSummary,
    statementBalance, statementCloseDate, statementDueDate // Nuevos campos
  } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ message: 'El nombre y el tipo de cuenta son requeridos.' });
  }

  try {
    const newAccountData = {
      name,
      type,
      balance: parseFloat(balance) || 0.00,
      currency: currency || 'ARS',
      icon,
      bankName,
      accountNumberLast4,
      creditLimit: creditLimit ? parseFloat(creditLimit) : null,
      includeInDashboardSummary: includeInDashboardSummary !== undefined ? includeInDashboardSummary : true,
      userId: req.user.id 
    };

    if (type === 'tarjeta_credito') {
      newAccountData.statementBalance = statementBalance ? parseFloat(statementBalance) : null;
      newAccountData.statementCloseDate = statementCloseDate || null;
      newAccountData.statementDueDate = statementDueDate || null;
    }

    const newAccount = await Account.create(newAccountData);
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error en createAccount:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener una cuenta específica por ID del usuario autenticado
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
    }
  } catch (error) {
    console.error('Error en getAccountById:', error);
    next(error);
  }
};

// @desc    Actualizar una cuenta del usuario autenticado
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  const { 
    name, type, balance, currency, icon, 
    bankName, accountNumberLast4, creditLimit,
    includeInDashboardSummary,
    statementBalance, statementCloseDate, statementDueDate // Nuevos campos
  } = req.body;
  try {
    const account = await Account.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario para actualizar.' });
    }

    account.name = name !== undefined ? name : account.name;
    // El tipo de cuenta generalmente no se edita, pero si se permite:
    // account.type = type !== undefined ? type : account.type; 
    account.balance = balance !== undefined ? parseFloat(balance) : account.balance;
    account.currency = currency !== undefined ? currency : account.currency;
    account.icon = icon !== undefined ? icon : account.icon; 
    account.bankName = bankName !== undefined ? bankName : account.bankName;
    account.accountNumberLast4 = accountNumberLast4 !== undefined ? accountNumberLast4 : account.accountNumberLast4;
    account.creditLimit = creditLimit !== undefined ? (creditLimit ? parseFloat(creditLimit) : null) : account.creditLimit;
    account.includeInDashboardSummary = includeInDashboardSummary !== undefined ? includeInDashboardSummary : account.includeInDashboardSummary;

    if (account.type === 'tarjeta_credito') {
      account.statementBalance = statementBalance !== undefined ? (statementBalance ? parseFloat(statementBalance) : null) : account.statementBalance;
      account.statementCloseDate = statementCloseDate !== undefined ? statementCloseDate : account.statementCloseDate;
      account.statementDueDate = statementDueDate !== undefined ? statementDueDate : account.statementDueDate;
    } else { // Si cambia de tipo o no es tarjeta, limpiar estos campos
        if (type !== undefined && type !== 'tarjeta_credito') {
            account.statementBalance = null;
            account.statementCloseDate = null;
            account.statementDueDate = null;
        }
    }

    await account.save();
    res.status(200).json(account);
  } catch (error) {
    console.error('Error en updateAccount:', error);
     if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una cuenta del usuario autenticado
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario para eliminar.' });
    }
    
    const transactionsExist = await db.Transaction.findOne({ where: { accountId: req.params.id, userId: req.user.id }}); //
    if (transactionsExist) {
        return res.status(400).json({ message: 'No se puede eliminar la cuenta porque tiene movimientos asociados. Por favor, reasigna o elimina los movimientos primero.' });
    }

    await account.destroy();
    res.status(200).json({ message: 'Cuenta eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteAccount:', error);
    next(error);
  }
};

// @desc    Pagar resumen de tarjeta de crédito
// @route   POST /api/accounts/:cardAccountId/pay
// @access  Private
const payCreditCardStatement = async (req, res, next) => {
  const { cardAccountId } = req.params;
  const { payingAccountId, paymentAmount, paymentDate, notes } = req.body;
  const userId = req.user.id;

  if (!payingAccountId || !paymentAmount || !paymentDate) {
    return res.status(400).json({ message: 'La cuenta pagadora, el monto y la fecha del pago son requeridos.' });
  }

  const amountToPay = parseFloat(paymentAmount);
  if (amountToPay <= 0) {
    return res.status(400).json({ message: 'El monto a pagar debe ser mayor a cero.' });
  }

  const t = await db.sequelize.transaction();
  try {
    const creditCardAccount = await Account.findOne({ where: { id: cardAccountId, userId, type: 'tarjeta_credito' }, transaction: t });
    const payingAccount = await Account.findOne({ where: { id: payingAccountId, userId }, transaction: t });

    if (!creditCardAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Tarjeta de crédito no encontrada o no válida.' });
    }
    if (!payingAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta pagadora no encontrada o no válida.' });
    }
    if (payingAccount.id === creditCardAccount.id) {
      await t.rollback();
      return res.status(400).json({ message: 'La cuenta pagadora no puede ser la misma tarjeta de crédito.' });
    }

    // Opcional: Verificar saldo de la cuenta pagadora (considerando su moneda)
    // if (payingAccount.currency === 'ARS' && parseFloat(payingAccount.balance) < amountToPay) {
    //   // ... (manejar conversión si la tarjeta es USD y pago ARS o viceversa)
    // }


    // 1. Crear transacción de egreso en la cuenta pagadora
    const categoryPayment = await db.Category.findOrCreate({ //
        where: { name: 'Pago de Tarjetas', type: 'egreso', userId: null }, // Categoría global o personalizada
        defaults: { name: 'Pago de Tarjetas', type: 'egreso', icon: '💳', userId: null}
    });
    const categoryIdForPayment = categoryPayment[0].id;

    await Transaction.create({ //
      description: `Pago Tarjeta ${creditCardAccount.name}`,
      amount: -Math.abs(amountToPay), // Egreso siempre negativo
      currency: payingAccount.currency, // Moneda de la cuenta pagadora
      date: paymentDate,
      type: 'egreso',
      notes: notes || `Pago desde ${payingAccount.name}`,
      icon: categoryPayment[0].icon,
      userId,
      accountId: payingAccount.id,
      categoryId: categoryIdForPayment,
    }, { transaction: t });

    // 2. Actualizar saldo de la cuenta pagadora
    payingAccount.balance = parseFloat(payingAccount.balance) - Math.abs(amountToPay);
    await payingAccount.save({ transaction: t });

    // 3. Crear transacción de "ingreso" (compensación) en la tarjeta de crédito
    // Asumimos que el pago se hace en la misma moneda que la tarjeta o que el monto ya está convertido
    await Transaction.create({ //
      description: `Pago Recibido desde ${payingAccount.name}`,
      amount: Math.abs(amountToPay), // Ingreso siempre positivo
      currency: creditCardAccount.currency, // Moneda de la tarjeta
      date: paymentDate,
      type: 'ingreso', 
      notes: notes || `Pago a Tarjeta ${creditCardAccount.name}`,
      icon: categoryPayment[0].icon,
      userId,
      accountId: creditCardAccount.id,
      categoryId: categoryIdForPayment,
    }, { transaction: t });
    
    // 4. Actualizar saldo de la tarjeta de crédito
    creditCardAccount.balance = parseFloat(creditCardAccount.balance) + Math.abs(amountToPay);
    
    // Opcional: Limpiar/actualizar campos del resumen de la tarjeta
    // creditCardAccount.statementBalance = Math.max(0, (parseFloat(creditCardAccount.statementBalance) || 0) - Math.abs(amountToPay));
    // Si se paga completo el statementBalance, podrías limpiarlo o marcarlo.
    // Por ahora, el usuario puede actualizarlo manualmente.

    await creditCardAccount.save({ transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Pago de tarjeta registrado exitosamente.', payingAccount, creditCardAccount });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Error en payCreditCardStatement:', error);
    next(error);
  }
};


module.exports = {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
  payCreditCardStatement, // Exportar la nueva función
};