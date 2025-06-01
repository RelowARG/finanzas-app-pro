// Ruta: finanzas-app-pro/backend/api/permissions/permissions.routes.js
const express = require('express');
const router = express.Router();
const permissionsController = require('./permissions.controller');
const { protect } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

// Todas estas rutas requieren que el usuario esté autenticado y sea administrador
// y que tenga un permiso específico para gestionar la configuración de permisos (si lo defines)
// Por ahora, usaremos un permiso genérico de admin o el chequeo de rol de admin directamente.
// Si creaste 'admin_manage_permissions_config', úsalo aquí.
// Como aún no lo hemos definido explícitamente en la semilla, lo comentaré para que no falle.
// router.use(protect, checkPermission('admin_manage_permissions_config'));
// Por ahora, nos basaremos en que estas rutas se monten bajo /api/admin que ya tiene 'protect'
// y el controller de admin.js ya usa checkPermission para sus rutas.
// Estas rutas serán para la CONFIGURACIÓN de permisos, así que deben estar bien protegidas.

// Obtener todos los permisos disponibles
router.get('/', 
    protect, // Asegurar autenticación
    checkPermission('admin_manage_user_roles'), // Ejemplo: Reutilizar permiso de gestión de roles o crear uno nuevo
    permissionsController.getAllPermissions
);

// Obtener permisos para un rol específico
router.get('/role/:roleName', 
    protect, 
    checkPermission('admin_manage_user_roles'),
    permissionsController.getPermissionsForRole
);

// Actualizar permisos para un rol específico
router.put('/role/:roleName', 
    protect, 
    checkPermission('admin_manage_user_roles'),
    permissionsController.updatePermissionsForRole
);

module.exports = router;