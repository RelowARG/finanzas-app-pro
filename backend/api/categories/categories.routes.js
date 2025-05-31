// Ruta: finanzas-app-pro/backend/api/categories/categories.routes.js
// ARCHIVO NUEVO
const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { protect } = require('../../middleware/authMiddleware');

// Todas las rutas de categorías estarán protegidas
router.use(protect);

router.route('/')
  .get(categoriesController.getCategories)    // Obtener todas las categorías (globales + del usuario)
  .post(categoriesController.createCategory); // Crear una nueva categoría personalizada

router.route('/:id')
  // .get(categoriesController.getCategoryById) // Podríamos añadir esto si es necesario
  .put(categoriesController.updateCategory)    // Actualizar una categoría personalizada
  .delete(categoriesController.deleteCategory); // Eliminar una categoría personalizada

module.exports = router;
