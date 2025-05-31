// Ruta: finanzas-app-pro/backend/api/recurringTransactions/recurringTransactions.controller.js
// ARCHIVO NUEVO (Stubs iniciales para CRUD)
const db = require('../../models');
const RecurringTransaction = db.RecurringTransaction;
const Account = db.Account;
const Category = db.Category;
const { Op } = require('sequelize');
const { calculateNextRunDate } = require('../../utils/dateUtils'); // Asumimos un helper para calcular fechas

// @desc    Crear una nueva transacción recurrente
// @route   POST /api/recurring-transactions
// @access  Private
const createRecurringTransaction = async (req, res, next) => {
  const {
    description, amount, currency, type, frequency, dayOfWeek, dayOfMonth,
    startDate, endDate, accountId, categoryId, notes, isActive
  } = req.body;
  const userId = req.user.id;

  if (!description || !amount || !type || !frequency || !startDate || !accountId || !categoryId) {
    return res.status(400).json({ message: 'Descripción, monto, tipo, frecuencia, fecha de inicio, cuenta y categoría son requeridos.' });
  }
  // Validaciones adicionales para frequency, dayOfWeek, dayOfMonth...

  try {
    // Verificar que la cuenta y categoría pertenecen al usuario y son válidas
    const account = await Account.findOne({ where: { id: accountId, userId } });
    if (!account) return res.status(404).json({ message: 'Cuenta no válida.' });

    const category = await Category.findOne({ where: { id: categoryId, type, [Op.or]: [{ userId }, { userId: null }] } });
    if (!category) return res.status(404).json({ message: 'Categoría no válida para el tipo de movimiento.' });
    
    const firstRunDate = calculateNextRunDate(startDate, frequency, dayOfMonth, dayOfWeek); // Lógica para calcular la primera ejecución

    const newRecurringTx = await RecurringTransaction.create({
      description,
      amount: parseFloat(amount),
      currency: currency || account.currency,
      type,
      frequency,
      dayOfWeek: frequency === 'semanal' ? dayOfWeek : null,
      dayOfMonth: (frequency === 'mensual' || frequency === 'quincenal' /* etc */) ? dayOfMonth : null,
      startDate,
      endDate: endDate || null,
      nextRunDate: firstRunDate,
      isActive: isActive !== undefined ? isActive : true,
      notes,
      userId,
      accountId,
      categoryId,
    });
    res.status(201).json(newRecurringTx);
  } catch (error) {
    console.error('Error en createRecurringTransaction:', error);
    next(error);
  }
};

// @desc    Obtener todas las transacciones recurrentes del usuario
// @route   GET /api/recurring-transactions
// @access  Private
const getRecurringTransactions = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const recurringTxs = await RecurringTransaction.findAll({
      where: { userId },
      include: [
        { model: Account, as: 'account', attributes: ['id', 'name', 'icon'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['nextRunDate', 'ASC'], ['description', 'ASC']]
    });
    res.status(200).json(recurringTxs);
  } catch (error) {
    console.error('Error en getRecurringTransactions:', error);
    next(error);
  }
};

// @desc    Obtener una transacción recurrente por ID
// @route   GET /api/recurring-transactions/:id
// @access  Private
const getRecurringTransactionById = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const recurringTx = await RecurringTransaction.findOne({
            where: { id, userId },
            include: [
                { model: Account, as: 'account' },
                { model: Category, as: 'category' }
            ]
        });
        if (!recurringTx) {
            return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
        }
        res.status(200).json(recurringTx);
    } catch (error) {
        next(error);
    }
};


// @desc    Actualizar una transacción recurrente
// @route   PUT /api/recurring-transactions/:id
// @access  Private
const updateRecurringTransaction = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    description, amount, currency, type, frequency, dayOfWeek, dayOfMonth,
    startDate, endDate, accountId, categoryId, notes, isActive, nextRunDate // Permitir actualizar nextRunDate manualmente si es necesario
  } = req.body;

  try {
    const recurringTx = await RecurringTransaction.findOne({ where: { id, userId } });
    if (!recurringTx) {
      return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
    }

    // Validaciones si cambian cuenta o categoría
    if (accountId && accountId !== recurringTx.accountId) {
        const account = await Account.findOne({ where: { id: accountId, userId } });
        if (!account) return res.status(404).json({ message: 'Cuenta no válida.' });
        recurringTx.currency = currency || account.currency; // Actualizar moneda si cambia la cuenta
    }
    if (categoryId && categoryId !== recurringTx.categoryId) {
        const category = await Category.findOne({ where: { id: categoryId, type: type || recurringTx.type, [Op.or]: [{ userId }, { userId: null }] } });
        if (!category) return res.status(404).json({ message: 'Categoría no válida.' });
    }
    
    // Actualizar campos
    recurringTx.description = description || recurringTx.description;
    recurringTx.amount = amount !== undefined ? parseFloat(amount) : recurringTx.amount;
    recurringTx.type = type || recurringTx.type;
    recurringTx.frequency = frequency || recurringTx.frequency;
    recurringTx.dayOfWeek = dayOfWeek !== undefined ? dayOfWeek : recurringTx.dayOfWeek;
    recurringTx.dayOfMonth = dayOfMonth !== undefined ? dayOfMonth : recurringTx.dayOfMonth;
    recurringTx.startDate = startDate || recurringTx.startDate;
    recurringTx.endDate = endDate !== undefined ? endDate : recurringTx.endDate; // Permitir null para quitarla
    recurringTx.accountId = accountId || recurringTx.accountId;
    recurringTx.categoryId = categoryId || recurringTx.categoryId;
    recurringTx.notes = notes !== undefined ? notes : recurringTx.notes;
    recurringTx.isActive = isActive !== undefined ? isActive : recurringTx.isActive;
    
    // Recalcular nextRunDate si cambian parámetros de frecuencia o startDate
    // O si se provee explícitamente
    if (nextRunDate) {
        recurringTx.nextRunDate = nextRunDate;
    } else if (frequency || startDate || dayOfMonth || dayOfWeek) {
        recurringTx.nextRunDate = calculateNextRunDate(
            recurringTx.startDate, 
            recurringTx.frequency, 
            recurringTx.dayOfMonth, 
            recurringTx.dayOfWeek
        );
    }


    await recurringTx.save();
    res.status(200).json(recurringTx);
  } catch (error) {
    console.error('Error en updateRecurringTransaction:', error);
    next(error);
  }
};

// @desc    Eliminar una transacción recurrente
// @route   DELETE /api/recurring-transactions/:id
// @access  Private
const deleteRecurringTransaction = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const recurringTx = await RecurringTransaction.findOne({ where: { id, userId } });
    if (!recurringTx) {
      return res.status(404).json({ message: 'Transacción recurrente no encontrada.' });
    }
    await recurringTx.destroy();
    res.status(200).json({ message: 'Transacción recurrente eliminada.' });
  } catch (error) {
    console.error('Error en deleteRecurringTransaction:', error);
    next(error);
  }
};

module.exports = {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};
