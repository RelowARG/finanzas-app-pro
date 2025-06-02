// finanzas-app-pro/backend/api/goals/goals.routes.js
const express = require('express');
const router = express.Router();
const goalsController = require('./goals.controller');
const { protect } = require('../../middleware/authMiddleware'); // O el middleware de permiso que definas

// Proteger todas las rutas de metas
router.use(protect);
// Podrías añadir un checkPermission específico si lo creas, ej: checkPermission('manage_goals')

router.route('/')
  .post(goalsController.createGoal)
  .get(goalsController.getGoals);

router.route('/:id')
  .get(goalsController.getGoalById)
  .put(goalsController.updateGoal)
  .delete(goalsController.deleteGoal);

module.exports = router;