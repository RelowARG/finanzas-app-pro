// Ruta: finanzas-app-pro/backend/api/transactions/transactions.controller.js
const db = require('../../models');
const Transaction = db.Transaction;
const Account = db.Account;
const Category = db.Category;
const RecurringTransaction = db.RecurringTransaction;
const { Op, literal } = require('sequelize');

// @desc    Crear un nuevo movimiento
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  const {
    description, amount, currency, date, type, notes, icon, accountId, categoryId,
    relatedAccountId,
    isInstallment, currentInstallment, totalInstallments
  } = req.body;
  const userId = req.user.id;

  if (!amount || !date || !type || !accountId) {
    return res.status(400).json({ message: 'Monto, fecha, tipo y cuenta de origen son requeridos.' });
  }
  if (type !== 'ingreso' && type !== 'egreso' && type !== 'transferencia') {
    return res.status(400).json({ message: 'El tipo debe ser "ingreso", "egreso" o "transferencia".' });
  }
  if (type !== 'transferencia' && !categoryId) {
    return res.status(400).json({ message: 'La categoría es requerida para ingresos y egresos.' });
  }
  if (type === 'transferencia' && !relatedAccountId) {
    return res.status(400).json({ message: 'La cuenta de destino es requerida para transferencias.' });
  }
  if (type === 'transferencia' && accountId === relatedAccountId) {
    return res.status(400).json({ message: 'La cuenta de origen y destino no pueden ser la misma para una transferencia.' });
  }
  if (isInstallment && type !== 'egreso') {
    return res.status(400).json({ message: 'Las cuotas solo pueden ser de tipo "egreso".' });
  }
  if (isInstallment && (!currentInstallment || !totalInstallments || parseInt(currentInstallment, 10) <= 0 || parseInt(totalInstallments, 10) <= 0)) {
    return res.status(400).json({ message: 'Para compras en cuotas, completa el número de cuota actual y el total de cuotas (mayores a cero).' });
  }
  if (isInstallment && parseInt(currentInstallment, 10) > parseInt(totalInstallments, 10)) {
    return res.status(400).json({ message: 'La cuota actual no puede ser mayor al total de cuotas.' });
  }

  const transactionAmount = parseFloat(amount);
  const t = await db.sequelize.transaction();

  try {
    const originAccount = await Account.findOne({ where: { id: accountId, userId: userId }, transaction: t });
    if (!originAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta de origen no encontrada o no pertenece al usuario.' });
    }

    let destinationAccount = null;
    if (type === 'transferencia') {
      destinationAccount = await Account.findOne({ where: { id: relatedAccountId, userId: userId }, transaction: t });
      if (!destinationAccount) {
        await t.rollback();
        return res.status(404).json({ message: 'Cuenta de destino no encontrada o no pertenece al usuario.' });
      }
    }

    let category = null;
    if (type !== 'transferencia') {
      category = await Category.findOne({
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
    }

    let finalDescription = description;
    if (type === 'transferencia' && !finalDescription) {
      finalDescription = `Transferencia de ${originAccount.name} a ${destinationAccount.name}`;
    } else if (type !== 'transferencia' && !finalDescription) {
      await t.rollback();
      return res.status(400).json({ message: 'La descripción es requerida para ingresos/egresos.' });
    }

    // El hook beforeSave del modelo Transaction se encargará de asignar el signo correcto al monto.
    const newTransaction = await Transaction.create({
      description: finalDescription,
      amount: transactionAmount, // CORREGIDO: Se pasa el monto directamente
      currency: currency || originAccount.currency,
      date,
      type: type,
      notes,
      icon: icon || category?.icon || (type === 'transferencia' ? '↔️' : (type === 'ingreso' ? '➕' : '💸')),
      userId,
      accountId: originAccount.id,
      categoryId: category ? category.id : null,
      relatedAccountId: type === 'transferencia' ? destinationAccount.id : null,
      isInstallment: type === 'egreso' ? (isInstallment || false) : false,
      currentInstallment: (type === 'egreso' && isInstallment && currentInstallment) ? parseInt(currentInstallment, 10) : null,
      totalInstallments: (type === 'egreso' && isInstallment && totalInstallments) ? parseInt(totalInstallments, 10) : null,
    }, { transaction: t });

    // CORREGIDO: Sumar el monto (que ya tiene el signo correcto) al saldo de la cuenta.
    // Para ingresos, será balance + monto. Para egresos, será balance + (-monto).
    originAccount.balance = parseFloat(originAccount.balance) + parseFloat(newTransaction.amount);
    await originAccount.save({ transaction: t });

    let incomingTransaction = null;
    if (type === 'transferencia') {
      incomingTransaction = await Transaction.create({
        description: finalDescription,
        amount: Math.abs(transactionAmount), // La entrada de una transferencia siempre es positiva
        currency: currency || destinationAccount.currency,
        date,
        type: type,
        notes,
        icon: icon || '↔️',
        userId,
        accountId: destinationAccount.id,
        relatedAccountId: originAccount.id,
        categoryId: null,
        isInstallment: false,
      }, { transaction: t });

      destinationAccount.balance = parseFloat(destinationAccount.balance) + Math.abs(transactionAmount);
      await destinationAccount.save({ transaction: t });
    }

    await t.commit();

    if (type === 'egreso' && newTransaction.isInstallment &&
      parseInt(newTransaction.currentInstallment, 10) === 1 &&
      parseInt(newTransaction.totalInstallments, 10) > 1) {

      (async () => {
        try {
          // Lógica para crear cuotas futuras como transacciones recurrentes (sin cambios)
          const baseDateForInstallments = new Date(newTransaction.date + 'T00:00:00Z');
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
        } catch (installmentError) {
          console.error("[InstallmentAutomation] Error creando las cuotas futuras programadas:", installmentError);
        }
      })();
    }

    const responsePayload = type === 'transferencia'
      ? { outgoingTransaction: newTransaction, incomingTransaction }
      : newTransaction;
    res.status(201).json(responsePayload);

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Error en createTransaction:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('requerido') || error.message.includes('cuota')) {
      const errorMessage = error.errors && error.errors.length > 0 ? error.errors.map(e => e.message).join(', ') : error.message;
      return res.status(400).json({ message: errorMessage });
    }
    next(error);
  }
};


// @desc    Obtener todos los movimientos del usuario (con filtros y ordenamiento)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  const userId = req.user.id;
  const { 
    accountId, categoryId, type, dateFrom, dateTo, searchTerm, 
    page = 1, limit = 10, 
    sortBy, sortOrder
  } = req.query;
  
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const whereClause = { userId };

  if (accountId) whereClause.accountId = accountId;
  if (categoryId) whereClause.categoryId = categoryId;
  if (type) whereClause.type = type;
  if (searchTerm) {
    whereClause.description = { [Op.iLike]: `%${searchTerm}%` }; 
  }
  
  if (dateFrom && dateTo) {
    whereClause.date = { [Op.between]: [dateFrom, dateTo] };
  } else if (dateFrom) {
    whereClause.date = { [Op.gte]: dateFrom };
  } else if (dateTo) {
    whereClause.date = { [Op.lte]: dateTo };
  }

  let orderClause = [['date', 'DESC'], ['createdAt', 'DESC']]; 

  if (sortBy) {
    const validDirectSortColumns = ['description', 'date', 'amount', 'createdAt'];
    const validAssociatedSortColumns = {
        'accountName': [Account, 'name'], 
        'categoryName': [Category, 'name'] 
    };
    const validSortOrders = ['ASC', 'DESC'];
    const direction = (sortOrder && validSortOrders.includes(sortOrder.toUpperCase())) 
                      ? sortOrder.toUpperCase() 
                      : 'ASC';

    if (validDirectSortColumns.includes(sortBy)) {
      orderClause = [[sortBy, direction]];
      if (sortBy !== 'createdAt') {
        orderClause.push(['createdAt', 'DESC']); 
      }
    } else if (validAssociatedSortColumns[sortBy]) {
      const [AssociatedModel, fieldName] = validAssociatedSortColumns[sortBy];
      orderClause = [[AssociatedModel, fieldName, direction]];
      orderClause.push(['date', 'DESC']);
      orderClause.push(['createdAt', 'DESC']);
    }
  }

  try {
    const allFilteredTransactions = await Transaction.findAll({
      where: whereClause,
      attributes: ['amount', 'type'], 
      raw: true,
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    allFilteredTransactions.forEach(tx => {
      const amount = parseFloat(tx.amount);
      if (tx.type === 'ingreso') {
        totalIncome += amount;
      } else if (tx.type === 'egreso') {
        totalExpenses += Math.abs(amount); 
      }
    });

    const totalNet = totalIncome - totalExpenses;

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [ 
        { model: Account, as: 'account', attributes: ['id', 'name', 'icon'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
      ],
      order: orderClause,
      limit: parseInt(limit, 10),
      offset: offset,
      distinct: true, 
    });

    res.status(200).json({
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      totalTransactions: count,
      transactions: rows,
      totalIncomeFiltered: totalIncome,
      totalExpensesFiltered: totalExpenses,
      totalNetFiltered: totalNet,
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
    relatedAccountId,
    isInstallment, currentInstallment, totalInstallments
  } = req.body;

  if (!amount || !date || !type || !accountId) {
    return res.status(400).json({ message: 'Monto, fecha, tipo y cuenta son requeridos.' });
  }
  if (type !== 'ingreso' && type !== 'egreso' && type !== 'transferencia') {
    return res.status(400).json({ message: 'El tipo debe ser "ingreso", "egreso" o "transferencia".' });
  }
  
  const originalTx = await Transaction.findByPk(transactionId);
  if (!originalTx) {
      return res.status(404).json({ message: 'Movimiento original no encontrado.' });
  }

  if (type !== 'transferencia' && !categoryId) {
    return res.status(400).json({ message: 'La categoría es requerida para ingresos y egresos.' });
  }
  if (type === 'transferencia' && !relatedAccountId) {
    return res.status(400).json({ message: 'La cuenta relacionada es requerida para transferencias.' });
  }
   if (type === 'transferencia' && accountId === relatedAccountId) {
    return res.status(400).json({ message: 'La cuenta de origen y destino no pueden ser la misma para una transferencia.' });
  }

  const t = await db.sequelize.transaction();
  try {
    const transactionToUpdate = await Transaction.findOne({
      where: { id: transactionId, userId: userId },
      include: [{model: Account, as: 'account'}], 
      transaction: t
    });

    if (!transactionToUpdate) {
      await t.rollback();
      return res.status(404).json({ message: 'Movimiento no encontrado o no pertenece al usuario.' });
    }
    
    const originalAccount = transactionToUpdate.account;
    const oldSignedAmount = parseFloat(transactionToUpdate.amount); 

    let balanceOriginalAccountTemp = parseFloat(originalAccount.balance) - oldSignedAmount;
    
    let targetAccount = originalAccount;
    if (accountId && accountId.toString() !== originalAccount.id.toString()) { 
        await originalAccount.update({ balance: balanceOriginalAccountTemp }, { transaction: t });
        
        targetAccount = await Account.findOne({ where: { id: accountId, userId: userId }, transaction: t });
        if (!targetAccount) {
            await t.rollback();
            return res.status(404).json({ message: 'La nueva cuenta especificada no es válida.' });
        }
        balanceOriginalAccountTemp = parseFloat(targetAccount.balance); 
    }
    
    let targetCategory = null;
    if (type !== 'transferencia' && categoryId) {
        targetCategory = await Category.findOne({
            where: { id: categoryId, type: type, [Op.or]: [{ userId: null }, { userId: userId }] },
            transaction: t
        });
        if (!targetCategory) {
            await t.rollback();
            return res.status(404).json({ message: 'La nueva categoría especificada no es válida.' });
        }
    }

    const newAmountFromForm = parseFloat(amount);
    transactionToUpdate.description = description !== undefined ? description.trim() : transactionToUpdate.description;
    transactionToUpdate.amount = (type === 'egreso' || (type === 'transferencia' && transactionToUpdate.accountId === accountId)) 
                                ? -Math.abs(newAmountFromForm) 
                                : Math.abs(newAmountFromForm);
    transactionToUpdate.currency = currency || targetAccount.currency;
    transactionToUpdate.date = date || transactionToUpdate.date;
    transactionToUpdate.type = type; 
    transactionToUpdate.notes = notes !== undefined ? notes.trim() : transactionToUpdate.notes;
    transactionToUpdate.icon = icon || (targetCategory ? targetCategory.icon : (type === 'transferencia' ? '↔️' : transactionToUpdate.icon));
    transactionToUpdate.accountId = targetAccount.id;
    transactionToUpdate.categoryId = targetCategory ? targetCategory.id : null;
    transactionToUpdate.relatedAccountId = type === 'transferencia' ? parseInt(relatedAccountId, 10) : null;


    transactionToUpdate.isInstallment = (type === 'egreso') ? (isInstallment || false) : false;
    if (transactionToUpdate.isInstallment) {
        transactionToUpdate.currentInstallment = (currentInstallment !== undefined && currentInstallment !== null) ? parseInt(currentInstallment, 10) : transactionToUpdate.currentInstallment;
        transactionToUpdate.totalInstallments = (totalInstallments !== undefined && totalInstallments !== null) ? parseInt(totalInstallments, 10) : transactionToUpdate.totalInstallments;
    } else {
        transactionToUpdate.currentInstallment = null;
        transactionToUpdate.totalInstallments = null;
    }
    
    await transactionToUpdate.save({ transaction: t }); 

    const finalNewSignedAmount = parseFloat(transactionToUpdate.amount);
    const balanceAfterUpdate = balanceOriginalAccountTemp + finalNewSignedAmount;
    await targetAccount.update({ balance: balanceAfterUpdate }, { transaction: t });

    await t.commit();
    res.status(200).json(transactionToUpdate);

  } catch (error) {
     if (t && !t.finished) {
        await t.rollback();
    }
    console.error('Error en updateTransaction:', error);
    if (error.name === 'SequelizeValidationError' || error.message.includes('requerido') || error.message.includes('cuota')) {
        const errorMessage = error.errors && error.errors.length > 0 ? error.errors.map(e => e.message).join(', ') : error.message;
        return res.status(400).json({ message: errorMessage });
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

    if (transactionToDelete.type === 'transferencia' && transactionToDelete.relatedAccountId) {
        const relatedTransaction = await Transaction.findOne({
            where: {
                type: 'transferencia',
                accountId: transactionToDelete.relatedAccountId,
                relatedAccountId: transactionToDelete.accountId,
            },
            include: [{model: Account, as: 'account'}],
            transaction: t
        });

        if (relatedTransaction) {
            const relatedAccount = relatedTransaction.account;
            const relatedAmountToRevert = parseFloat(relatedTransaction.amount);
            relatedAccount.balance = parseFloat(relatedAccount.balance) - relatedAmountToRevert;
            await relatedAccount.update({ balance: relatedAccount.balance }, { transaction: t });
            await relatedTransaction.destroy({ transaction: t });
        }
    }


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