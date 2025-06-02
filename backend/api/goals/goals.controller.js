// finanzas-app-pro/backend/api/goals/goals.controller.js
const db = require('../../models');
const Goal = db.Goal;
const { Op } = require('sequelize');

// @desc    Crear una nueva meta
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  const {
    name, targetAmount, currentAmount, currency, // *** AÑADIDO currency ***
    targetDate, description, icon, status, priority
  } = req.body;
  const userId = req.user.id;

  if (!name || !targetAmount) {
    return res.status(400).json({ message: 'Nombre y monto objetivo son requeridos para la meta.' });
  }
  if (parseFloat(targetAmount) <= 0) {
    return res.status(400).json({ message: 'El monto objetivo debe ser mayor a cero.' });
  }
  if (currentAmount && parseFloat(currentAmount) < 0) {
    return res.status(400).json({ message: 'El monto actual no puede ser negativo.' });
  }
  // *** VALIDACIÓN DE CURRENCY (opcional, pero buena práctica) ***
  const allowedCurrencies = ['ARS', 'USD']; // Puedes expandir esto si es necesario
  if (currency && !allowedCurrencies.includes(currency.toUpperCase())) {
    return res.status(400).json({ message: `Moneda no válida. Las permitidas son: ${allowedCurrencies.join(', ')}` });
  }

  try {
    const newGoal = await Goal.create({
      userId,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0.00,
      currency: currency ? currency.toUpperCase() : 'ARS', // *** GUARDAR currency ***
      targetDate: targetDate || null,
      description,
      icon: icon || '🎯',
      status: status || 'active',
      priority: priority || 'medium',
    });
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error en createGoal:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Obtener todas las metas del usuario
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  const userId = req.user.id;
  const { statusFilter, priorityFilter } = req.query;

  const whereClause = { userId };
  if (statusFilter) whereClause.status = statusFilter;
  if (priorityFilter) whereClause.priority = priorityFilter;

  try {
    const goals = await Goal.findAll({
      where: whereClause,
      order: [
        [db.sequelize.fn('FIELD', db.sequelize.col('priority'), 'high', 'medium', 'low')],
        ['targetDate', 'ASC'],
        ['name', 'ASC']
      ]
      // El campo 'currency' se incluirá automáticamente
    });
    res.status(200).json(goals);
  } catch (error) {
    console.error('Error en getGoals:', error);
    next(error);
  }
};

// @desc    Obtener una meta específica por ID
// @route   GET /api/goals/:id
// @access  Private
const getGoalById = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  try {
    const goal = await Goal.findOne({
      where: { id: goalId, userId: userId }
      // El campo 'currency' se incluirá automáticamente
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

// @desc    Actualizar una meta
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const {
    name, targetAmount, currentAmount, currency, // *** AÑADIDO currency ***
    targetDate, description, icon, status, priority
  } = req.body;

  try {
    const goal = await Goal.findOne({
      where: { id: goalId, userId: userId }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada o no pertenece al usuario.' });
    }

    goal.name = name !== undefined ? name : goal.name;
    goal.targetAmount = targetAmount !== undefined ? parseFloat(targetAmount) : goal.targetAmount;
    goal.currentAmount = currentAmount !== undefined ? parseFloat(currentAmount) : goal.currentAmount;
    
    // *** ACTUALIZAR Y VALIDAR CURRENCY ***
    if (currency !== undefined) {
      const allowedCurrencies = ['ARS', 'USD'];
      if (!allowedCurrencies.includes(currency.toUpperCase())) {
        return res.status(400).json({ message: `Moneda no válida. Las permitidas son: ${allowedCurrencies.join(', ')}` });
      }
      goal.currency = currency.toUpperCase();
    }

    goal.targetDate = targetDate !== undefined ? (targetDate || null) : goal.targetDate;
    goal.description = description !== undefined ? description : goal.description;
    goal.icon = icon !== undefined ? icon : goal.icon;
    goal.status = status !== undefined ? status : goal.status;
    goal.priority = priority !== undefined ? priority : goal.priority;

    if (parseFloat(goal.targetAmount) <= 0) {
        return res.status(400).json({ message: 'El monto objetivo debe ser mayor a cero.' });
    }
    if (parseFloat(goal.currentAmount) < 0) {
        return res.status(400).json({ message: 'El monto actual no puede ser negativo.' });
    }
    
    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error('Error en updateGoal:', error);
     if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una meta
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  try {
    const goal = await Goal.findOne({
      where: { id: goalId, userId: userId }
    });
    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada o no pertenece al usuario.' });
    }
    await goal.destroy();
    res.status(200).json({ message: 'Meta eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteGoal:', error);
    next(error);
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
};