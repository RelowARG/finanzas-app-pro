// Ruta: finanzas-app-pro/backend/api/admin/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect } = require('../../middleware/authMiddleware');
// const { isAdmin } = require('../../middleware/adminMiddleware'); // Ya no es necesario si usamos checkPermission
const { checkPermission } = require('../../middleware/permissionMiddleware'); // *** NUEVO ***

router.use(protect); // Proteger todas las rutas de admin

// @desc    Obtener todos los usuarios
// @route   GET /api/admin/users
// Ahora requiere el permiso 'admin_view_all_users'
router.get('/users', checkPermission('admin_view_all_users'), adminController.getAllUsers);

// @desc    Actualizar el rol de un usuario
// @route   PUT /api/admin/users/:userId/role
router.put('/users/:userId/role', checkPermission('admin_manage_user_roles'), adminController.updateUserRole);

// @desc    Eliminar un usuario
// @route   DELETE /api/admin/users/:userId
router.delete('/users/:userId', checkPermission('admin_delete_users'), adminController.deleteUserByAdmin);

module.exports = router;