// Ruta: finanzas-app-pro/backend/api/budgets/budgets.controller.js
// ESTE ES EL CONTROLADOR EXISTENTE, REVISAR 'updateBudget'
const db = require('../../models');
const Budget = db.Budget;
const Category = db.Category;
const Transaction = db.Transaction;
const { Op } = require('sequelize');

const calculateSpentForBudget = async (userId, categoryId, startDate, endDate) => {
  const transactions = await Transaction.findAll({
    where: {
      userId,
      categoryId,
      type: 'egreso',
      date: {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    }
  });
  return transactions.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
};

const createBudget = async (req, res, next) => {
  const { categoryId, amount, currency, period, startDate, endDate, icon } = req.body;
  const userId = req.user.id;

  if (!categoryId || !amount || !period || !startDate || !endDate) {
    return res.status(400).json({ message: 'Categoría, monto, período y fechas son requeridos.' });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
  }

  try {
    const category = await Category.findOne({
      where: {
        id: categoryId,
        type: 'egreso',
        [Op.or]: [{ userId: null }, { userId: userId }]
      }
    });
    if (!category) {
      return res.status(404).json({ message: 'Categoría de egreso no encontrada o no válida.' });
    }
    const existingBudget = await Budget.findOne({
        where: { userId, categoryId, period, startDate, endDate }
    });
    if(existingBudget){
        return res.status(400).json({ message: `Ya existe un presupuesto para la categoría "${category.name}" en el período especificado.` });
    }

    const newBudget = await Budget.create({
      amount: parseFloat(amount),
      currency: currency || 'ARS',
      period,
      startDate,
      endDate,
      icon: icon || category.icon,
      categoryNameSnapshot: category.name,
      userId,
      categoryId,
    });
    res.status(201).json(newBudget);
  } catch (error) {
    console.error('Error en createBudget:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  const userId = req.user.id;
  const { periodFilter, month, year } = req.query;

  try {
    const whereClause = { userId };
    if (periodFilter) whereClause.period = periodFilter;
    if (month && year) {
        const firstDay = new Date(year, parseInt(month) - 1, 1);
        const lastDay = new Date(year, parseInt(month), 0);
        whereClause.startDate = { [Op.lte]: lastDay };
        whereClause.endDate = { [Op.gte]: firstDay };
    }

    const budgets = await Budget.findAll({
      where: whereClause,
      include: [{ model: Category, as: 'category', attributes: ['name', 'icon'] }],
      order: [['endDate', 'DESC'], ['categoryNameSnapshot', 'ASC']]
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await calculateSpentForBudget(userId, budget.categoryId, budget.startDate, budget.endDate);
        const remaining = parseFloat(budget.amount) - spentAmount;
        const progress = budget.amount > 0 ? (spentAmount / parseFloat(budget.amount)) * 100 : 0;
        return {
          ...budget.toJSON(),
          spent: spentAmount,
          remaining: remaining,
          progress: parseFloat(progress.toFixed(2)),
          categoryName: budget.category ? budget.category.name : budget.categoryNameSnapshot,
          icon: budget.category ? budget.category.icon : budget.icon,
        };
      })
    );
    res.status(200).json(budgetsWithSpent);
  } catch (error) {
    console.error('Error en getBudgets:', error);
    next(error);
  }
};

const getBudgetById = async (req, res, next) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  try {
    const budget = await Budget.findOne({
      where: { id: budgetId, userId: userId },
      include: [{ model: Category, as: 'category', attributes: ['name', 'icon'] }]
    });
    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado o no pertenece al usuario.' });
    }
    const spentAmount = await calculateSpentForBudget(userId, budget.categoryId, budget.startDate, budget.endDate);
    const remaining = parseFloat(budget.amount) - spentAmount;
    const progress = budget.amount > 0 ? (spentAmount / parseFloat(budget.amount)) * 100 : 0;
    res.status(200).json({
      ...budget.toJSON(),
      spent: spentAmount,
      remaining: remaining,
      progress: parseFloat(progress.toFixed(2)),
      categoryName: budget.category ? budget.category.name : budget.categoryNameSnapshot,
      icon: budget.category ? budget.category.icon : budget.icon,
    });
  } catch (error) {
    console.error('Error en getBudgetById:', error);
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  const { amount, currency, period, startDate, endDate, icon, categoryId } = req.body;

  try {
    const budget = await Budget.findOne({
      where: { id: budgetId, userId: userId }
    });
    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado o no pertenece al usuario.' });
    }

    let categoryNameSnapshot = budget.categoryNameSnapshot;
    let finalIcon = icon !== undefined ? icon : budget.icon;
    let finalCategoryId = budget.categoryId;

    if (categoryId && categoryId !== budget.categoryId) {
        const newCategory = await Category.findOne({
            where: { id: categoryId, type: 'egreso', [Op.or]: [{ userId: null }, { userId: userId }] }
        });
        if (!newCategory) {
            return res.status(404).json({ message: 'La nueva categoría especificada no es válida.' });
        }
        finalCategoryId = newCategory.id;
        categoryNameSnapshot = newCategory.name;
        finalIcon = icon !== undefined ? icon : (newCategory.icon || '🎯');
    }

    budget.amount = amount !== undefined ? parseFloat(amount) : budget.amount;
    budget.currency = currency || budget.currency;
    budget.period = period || budget.period;
    budget.startDate = startDate || budget.startDate;
    budget.endDate = endDate || budget.endDate;
    budget.icon = finalIcon;
    budget.categoryNameSnapshot = categoryNameSnapshot;
    budget.categoryId = finalCategoryId;


    if (new Date(budget.endDate) < new Date(budget.startDate)) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }

    await budget.save();
    
    const spentAmount = await calculateSpentForBudget(userId, budget.categoryId, budget.startDate, budget.endDate);
    const remaining = parseFloat(budget.amount) - spentAmount;
    const progress = budget.amount > 0 ? (spentAmount / parseFloat(budget.amount)) * 100 : 0;

    res.status(200).json({
        ...budget.toJSON(),
        spent: spentAmount,
        remaining: remaining,
        progress: parseFloat(progress.toFixed(2))
    });

  } catch (error) {
    console.error('Error en updateBudget:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  const userId = req.user.id;
  const budgetId = req.params.id;
  try {
    const budget = await Budget.findOne({
      where: { id: budgetId, userId: userId }
    });
    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado o no pertenece al usuario.' });
    }
    await budget.destroy();
    res.status(200).json({ message: 'Presupuesto eliminado exitosamente.' });
  } catch (error) {
    console.error('Error en deleteBudget:', error);
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};