// Ruta: finanzas-app-pro/backend/api/accounts/accounts.controller.js
const db = require('../../models'); 
const Account = db.Account;
// const User = db.User; // No es necesario aquí si solo operamos con req.user.id

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
    includeInDashboardSummary // NUEVO CAMPO
  } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ message: 'El nombre y el tipo de cuenta son requeridos.' });
  }

  try {
    const newAccount = await Account.create({
      name,
      type,
      balance: parseFloat(balance) || 0.00,
      currency: currency || 'ARS',
      icon,
      bankName,
      accountNumberLast4,
      creditLimit: creditLimit ? parseFloat(creditLimit) : null,
      includeInDashboardSummary: includeInDashboardSummary !== undefined ? includeInDashboardSummary : true, // Valor por defecto si no se envía
      userId: req.user.id 
    });
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
    includeInDashboardSummary // NUEVO CAMPO
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
    // El tipo de cuenta generalmente no se edita una vez creada, pero si se permite:
    // account.type = type !== undefined ? type : account.type; 
    account.balance = balance !== undefined ? parseFloat(balance) : account.balance;
    account.currency = currency !== undefined ? currency : account.currency;
    account.icon = icon !== undefined ? icon : account.icon; 
    account.bankName = bankName !== undefined ? bankName : account.bankName;
    account.accountNumberLast4 = accountNumberLast4 !== undefined ? accountNumberLast4 : account.accountNumberLast4;
    account.creditLimit = creditLimit !== undefined ? (creditLimit ? parseFloat(creditLimit) : null) : account.creditLimit;
    account.includeInDashboardSummary = includeInDashboardSummary !== undefined ? includeInDashboardSummary : account.includeInDashboardSummary;


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
    
    // Antes de eliminar, verificar si hay transacciones asociadas.
    const transactionsExist = await db.Transaction.findOne({ where: { accountId: req.params.id, userId: req.user.id }});
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

module.exports = {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
};
