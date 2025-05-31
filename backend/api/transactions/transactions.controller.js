// Ruta: finanzas-app-pro/backend/api/transactions/transactions.controller.js
const db = require('../../models');
const Transaction = db.Transaction;
const Account = db.Account;
const Category = db.Category;
const RecurringTransaction = db.RecurringTransaction;
const { Op } = require('sequelize');

// @desc    Crear un nuevo movimiento
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  const { 
    description, amount, currency, date, type, notes, icon, accountId, categoryId,
    isInstallment, currentInstallment, totalInstallments 
  } = req.body;
  const userId = req.user.id;

  if (!amount || !date || !type || !accountId || !categoryId) {
    return res.status(400).json({ message: 'Monto, fecha, tipo, cuenta y categoría son requeridos.' });
  }
  if (type !== 'ingreso' && type !== 'egreso') {
    return res.status(400).json({ message: 'El tipo debe ser "ingreso" o "egreso".' });
  }
  if (isInstallment && type !== 'egreso') {
    return res.status(400).json({ message: 'Las cuotas solo pueden ser de tipo "egreso".' });
  }

  const transactionAmount = parseFloat(amount); 

  const t = await db.sequelize.transaction(); 

  try {
    const account = await Account.findOne({ where: { id: accountId, userId: userId }, transaction: t });
    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario.' });
    }

    const category = await Category.findOne({
      where: {
        id: categoryId,
        type: type, 
        [Op.or]: [{ userId: null }, { userId: userId }]
      },
      transaction: t
    });
    if (!category) {
      await t.rollback();
      return res.status(404).json({ message: 'Categoría no encontrada, no válida para este tipo de movimiento, o no pertenece al usuario.' });
    }

    const newTransaction = await Transaction.create({
      description,
      amount: transactionAmount, 
      currency: currency || account.currency, 
      date, // date es YYYY-MM-DD
      type,
      notes,
      icon: icon || category.icon, 
      userId,
      accountId,
      categoryId,
      isInstallment: isInstallment || false,
      currentInstallment: (isInstallment && currentInstallment) ? parseInt(currentInstallment, 10) : null,
      totalInstallments: (isInstallment && totalInstallments) ? parseInt(totalInstallments, 10) : null,
    }, { transaction: t });

    const finalAmountForBalance = parseFloat(newTransaction.amount);
    const newBalance = parseFloat(account.balance) + finalAmountForBalance;
    await account.update({ balance: newBalance }, { transaction: t });

    await t.commit(); 

    if (newTransaction.isInstallment && 
        parseInt(newTransaction.currentInstallment, 10) === 1 && 
        parseInt(newTransaction.totalInstallments, 10) > 1) {
      
      (async () => { 
        try {
          console.log(`[InstallmentAutomation] Generando ${newTransaction.totalInstallments - 1} cuotas futuras para la transacción ID: ${newTransaction.id}`);
          const baseDateForInstallments = new Date(newTransaction.date + 'T00:00:00Z'); // Usar Z para UTC y evitar problemas de timezone al sumar meses

          for (let i = 2; i <= newTransaction.totalInstallments; i++) {
            const nextInstallmentDateObj = new Date(baseDateForInstallments);
            nextInstallmentDateObj.setUTCMonth(baseDateForInstallments.getUTCMonth() + (i - 1));
            
            if (nextInstallmentDateObj.getUTCDate() < baseDateForInstallments.getUTCDate() && baseDateForInstallments.getUTCDate() > 28) {
                 const tempCorrectMonth = new Date(Date.UTC(baseDateForInstallments.getUTCFullYear(), baseDateForInstallments.getUTCMonth() + (i - 1) + 1, 0)); 
                 nextInstallmentDateObj.setUTCDate(tempCorrectMonth.getUTCDate());
            }

            const year = nextInstallmentDateObj.getUTCFullYear();
            const month = String(nextInstallmentDateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(nextInstallmentDateObj.getUTCDate()).padStart(2, '0');
            const formattedNextRunDate = `${year}-${month}-${day}`;

            await RecurringTransaction.create({
              description: `${newTransaction.description} (Cuota ${i}/${newTransaction.totalInstallments})`,
              amount: Math.abs(parseFloat(newTransaction.amount)), 
              currency: newTransaction.currency,
              type: newTransaction.type, 
              frequency: 'mensual', 
              dayOfMonth: nextInstallmentDateObj.getUTCDate(), 
              startDate: newTransaction.date, 
              endDate: null, 
              nextRunDate: formattedNextRunDate,
              isActive: true,
              notes: `Cuota autogenerada ${i} de la compra ID: ${newTransaction.id}. ${newTransaction.notes || ''}`.trim(),
              userId: newTransaction.userId,
              accountId: newTransaction.accountId, 
              categoryId: newTransaction.categoryId, 
            });
          }
          console.log("[InstallmentAutomation] Cuotas futuras programadas como transacciones recurrentes.");
        } catch (installmentError) {
          console.error("[InstallmentAutomation] Error creando las cuotas futuras programadas:", installmentError);
        }
      })(); 
    }
    
    res.status(201).json(newTransaction);

  } catch (error) {
    if (t && !t.finished) { 
        await t.rollback();
    }
    console.error('Error en createTransaction:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('requerido') || error.message.includes('cuota')) {
        return res.status(400).json({ message: error.message, errors: error.errors?.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener todos los movimientos del usuario (con filtros)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  const userId = req.user.id;
  const { accountId, categoryId, type, dateFrom, dateTo, searchTerm, page = 1, limit = 10 } = req.query;
  
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const whereClause = { userId };

  if (accountId) whereClause.accountId = accountId;
  if (categoryId) whereClause.categoryId = categoryId;
  if (type) whereClause.type = type;
  if (searchTerm) {
    whereClause.description = { [Op.iLike]: `%${searchTerm}%` }; // Op.iLike para case-insensitive (si tu DB lo soporta, ej. PostgreSQL)
                                                              // Para MySQL, Op.like es case-insensitive por defecto en collations comunes.
  }
  
  // Usar las cadenas de fecha directamente para columnas DATEONLY
  if (dateFrom && dateTo) {
    whereClause.date = { [Op.between]: [dateFrom, dateTo] };
    console.log(`[TransactionsController] Filtering between dates (strings): ${dateFrom} and ${dateTo}`);
  } else if (dateFrom) {
    whereClause.date = { [Op.gte]: dateFrom };
    console.log(`[TransactionsController] Filtering from date (string): ${dateFrom}`);
  } else if (dateTo) {
    whereClause.date = { [Op.lte]: dateTo };
    console.log(`[TransactionsController] Filtering up to date (string): ${dateTo}`);
  }

  try {
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [ 
        { model: Account, as: 'account', attributes: ['id', 'name', 'icon'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: offset,
    });
    console.log(`[TransactionsController] Found ${count} transactions for page ${page} with limit ${limit}`);

    res.status(200).json({
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      totalTransactions: count,
      transactions: rows
    });
  } catch (error) {
    console.error('Error en getTransactions:', error);
    next(error);
  }
};

// @desc    Obtener un movimiento específico por ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  const userId = req.user.id;
  const transactionId = req.params.id;
  try {
    const transaction = await Transaction.findOne({
      where: { id: transactionId, userId: userId },
      include: [
        { model: Account, as: 'account' },
        { model: Category, as: 'category' }
      ]
    });
    if (!transaction) {
      return res.status(404).json({ message: 'Movimiento no encontrado o no pertenece al usuario.' });
    }
    const responseTransaction = transaction.toJSON();
    responseTransaction.amount = Math.abs(parseFloat(responseTransaction.amount));

    res.status(200).json(responseTransaction);
  } catch (error) {
    console.error('Error en getTransactionById:', error);
    next(error);
  }
};

// @desc    Actualizar un movimiento
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  const userId = req.user.id;
  const transactionId = req.params.id;
  const { 
    description, amount, currency, date, type, notes, icon, accountId, categoryId,
    isInstallment, currentInstallment, totalInstallments
  } = req.body;

  const t = await db.sequelize.transaction();
  try {
    const originalTransaction = await Transaction.findOne({
      where: { id: transactionId, userId: userId },
      include: [{model: Account, as: 'account'}], 
      transaction: t
    });

    if (!originalTransaction) {
      await t.rollback();
      return res.status(404).json({ message: 'Movimiento no encontrado o no pertenece al usuario.' });
    }
    
    const originalAccount = originalTransaction.account;
    const oldSignedAmount = parseFloat(originalTransaction.amount); 

    let balanceTemp = parseFloat(originalAccount.balance) - oldSignedAmount;
    
    let targetAccount = originalAccount;
    if (accountId && accountId.toString() !== originalAccount.id.toString()) { 
        await originalAccount.update({ balance: balanceTemp }, { transaction: t });
        
        targetAccount = await Account.findOne({ where: { id: accountId, userId: userId }, transaction: t });
        if (!targetAccount) {
            await t.rollback();
            return res.status(404).json({ message: 'La nueva cuenta especificada no es válida.' });
        }
        balanceTemp = parseFloat(targetAccount.balance); 
    }
    
    let targetCategory = await Category.findByPk(originalTransaction.categoryId, {transaction: t});
    if (categoryId && categoryId.toString() !== originalTransaction.categoryId.toString()) {
        targetCategory = await Category.findOne({
            where: { id: categoryId, type: type || originalTransaction.type, [Op.or]: [{ userId: null }, { userId: userId }] },
            transaction: t
        });
        if (!targetCategory) {
            await t.rollback();
            return res.status(404).json({ message: 'La nueva categoría especificada no es válida.' });
        }
    }

    const newType = type || originalTransaction.type;
    const newAmountForm = amount !== undefined ? parseFloat(amount) : Math.abs(oldSignedAmount); 
    
    originalTransaction.description = description !== undefined ? description : originalTransaction.description;
    originalTransaction.amount = newAmountForm; 
    originalTransaction.currency = currency || targetAccount.currency;
    originalTransaction.date = date || originalTransaction.date;
    originalTransaction.type = newType;
    originalTransaction.notes = notes !== undefined ? notes : originalTransaction.notes;
    originalTransaction.icon = icon !== undefined ? icon : (targetCategory ? targetCategory.icon : originalTransaction.icon);
    originalTransaction.accountId = targetAccount.id;
    originalTransaction.categoryId = targetCategory.id;

    originalTransaction.isInstallment = isInstallment !== undefined ? isInstallment : originalTransaction.isInstallment;
    if (originalTransaction.isInstallment) {
        originalTransaction.currentInstallment = (currentInstallment !== undefined && currentInstallment !== null) ? parseInt(currentInstallment, 10) : originalTransaction.currentInstallment;
        originalTransaction.totalInstallments = (totalInstallments !== undefined && totalInstallments !== null) ? parseInt(totalInstallments, 10) : originalTransaction.totalInstallments;
    } else {
        originalTransaction.currentInstallment = null;
        originalTransaction.totalInstallments = null;
    }
    
    await originalTransaction.save({ transaction: t }); 

    const finalNewSignedAmount = parseFloat(originalTransaction.amount);
    const balanceAfterUpdate = balanceTemp + finalNewSignedAmount;
    await targetAccount.update({ balance: balanceAfterUpdate }, { transaction: t });

    await t.commit();
    res.status(200).json(originalTransaction);

  } catch (error) {
     if (t && !t.finished) {
        await t.rollback();
    }
    console.error('Error en updateTransaction:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('requerido') || error.message.includes('cuota')) {
        return res.status(400).json({ message: error.message, errors: error.errors?.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar un movimiento
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  const t = await db.sequelize.transaction();
  try {
    const transactionToDelete = await Transaction.findOne({
      where: { id: transactionId, userId: userId },
      include: [{model: Account, as: 'account'}],
      transaction: t
    });

    if (!transactionToDelete) {
      await t.rollback();
      return res.status(404).json({ message: 'Movimiento no encontrado o no pertenece al usuario.' });
    }

    const account = transactionToDelete.account;
    const amountToRevert = parseFloat(transactionToDelete.amount); 
    const newBalance = parseFloat(account.balance) - amountToRevert;
    await account.update({ balance: newBalance }, { transaction: t });

    await transactionToDelete.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Movimiento eliminado exitosamente.' });

  } catch (error) {
    if (t && !t.finished) {
        await t.rollback();
    }
    console.error('Error en deleteTransaction:', error);
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};