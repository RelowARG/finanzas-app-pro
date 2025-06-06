const express = require('express');
const router = express.Router();
const goalsController = require('./goals.controller.js');
const { protect } = require('../../middleware/authMiddleware.js');

router.use(protect);

router.route('/')
  .post(goalsController.createGoal)
  .get(goalsController.getGoals);

router.route('/:id')
  .get(goalsController.getGoalById)
  .put(goalsController.updateGoal)
  .delete(goalsController.deleteGoal);

// *** RUTA FALTANTE AÑADIDA AQUÍ ***
router.post('/:goalId/add-progress', goalsController.addProgressToGoal);

module.exports = router;