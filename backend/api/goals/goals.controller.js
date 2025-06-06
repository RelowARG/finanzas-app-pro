const db = require('../../models');
const Goal = db.Goal;
const Account = db.Account;
const Transaction = db.Transaction;
const Category = db.Category;
const { Op } = require('sequelize');

const createGoal = async (req, res, next) => {
  const {
    name, targetAmount, currentAmount, currency,
    targetDate, description, icon, status, priority
  } = req.body;
  const userId = req.user.id;

  if (!name || !targetAmount) {
    return res.status(400).json({ message: 'Nombre y monto objetivo son requeridos para la meta.' });
  }
  if (parseFloat(targetAmount) <= 0) {
    return res.status(400).json({ message: 'El monto objetivo debe ser mayor a cero.' });
  }

  try {
    const newGoal = await Goal.create({
      userId, name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0.00,
      currency: currency || 'ARS',
      targetDate: targetDate || null,
      description, icon: icon || '🎯',
      status: status || 'active',
      priority: priority || 'medium',
    });
    res.status(201).json(newGoal);
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  const userId = req.user.id;
  const { statusFilter, priorityFilter } = req.query;

  const whereClause = { userId };
  if (statusFilter) whereClause.status = statusFilter;
  if (priorityFilter) whereClause.priority = priorityFilter;

  try {
    const goals = await Goal.findAll({
      where: whereClause,
      order: [['targetDate', 'ASC'], ['name', 'ASC']]
    });
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
};

// *** INICIO: FUNCIÓN FALTANTE AÑADIDA ***
const getGoalById = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  try {
    const goal = await Goal.findOne({
      where: { id: goalId, userId: userId }
    });
    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json(goal);
  } catch (error) {
    console.error('Error en getGoalById:', error);
    next(error);
  }
};
// *** FIN: FUNCIÓN FALTANTE AÑADIDA ***

const updateGoal = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const updateData = req.body;

  try {
    const goal = await Goal.findOne({ where: { id: goalId, userId: userId }});
    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada.' });
    }
    await goal.update(updateData);
    res.status(200).json(goal);
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  try {
    const goal = await Goal.findOne({ where: { id: goalId, userId: userId }});
    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada.' });
    }
    await goal.destroy();
    res.status(200).json({ message: 'Meta eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

const addProgressToGoal = async (req, res, next) => {
  const userId = req.user.id;
  const { goalId } = req.params;
  const { amount, accountId, date } = req.body;

  if (!amount || !accountId || !date || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Monto, cuenta de origen y fecha son requeridos, y el monto debe ser positivo.' });
  }
  
  const t = await db.sequelize.transaction();
  try {
    const goal = await Goal.findOne({ where: { id: goalId, userId }, transaction: t });
    if (!goal) {
      await t.rollback();
      return res.status(404).json({ message: 'Meta no encontrada.' });
    }

    const account = await Account.findOne({ where: { id: accountId, userId }, transaction: t });
    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Cuenta de origen no encontrada.' });
    }

    if (account.currency !== goal.currency) {
      await t.rollback();
      return res.status(400).json({ message: `La moneda de la cuenta (${account.currency}) no coincide con la de la meta (${goal.currency}).` });
    }

    let savingsCategory = await Category.findOne({
      where: { name: 'Ahorro para Metas', type: 'egreso', [Op.or]: [{ userId: null }, { userId }] },
      transaction: t
    });
    if (!savingsCategory) {
      savingsCategory = await Category.create({ name: 'Ahorro para Metas', type: 'egreso', icon: '🐖', userId: null }, { transaction: t });
    }

    await Transaction.create({
      description: `Aporte a meta: ${goal.name}`,
      amount: -parseFloat(amount),
      currency: account.currency,
      date,
      type: 'egreso',
      accountId: account.id,
      categoryId: savingsCategory.id,
      userId,
    }, { transaction: t });

    account.balance = parseFloat(account.balance) - parseFloat(amount);
    await account.save({ transaction: t });

    goal.currentAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
    await goal.save({ transaction: t });

    await t.commit();
    res.status(200).json(goal);

  } catch (error) {
    if (t) await t.rollback();
    next(error);
  }
};


module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  addProgressToGoal,
};