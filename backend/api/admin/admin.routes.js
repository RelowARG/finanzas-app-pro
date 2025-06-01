// Ruta: finanzas-app-pro/backend/api/admin/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller'); //
const { protect } = require('../../middleware/authMiddleware'); //
const { isAdmin } = require('../../middleware/adminMiddleware'); //

router.use(protect, isAdmin);

// @desc    Obtener todos los usuarios
// @route   GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// @desc    Actualizar el rol de un usuario
// @route   PUT /api/admin/users/:userId/role
router.put('/users/:userId/role', adminController.updateUserRole);

// @desc    Eliminar un usuario
// @route   DELETE /api/admin/users/:userId
router.delete('/users/:userId', adminController.deleteUserByAdmin); // NUEVA RUTA

module.exports = router;
