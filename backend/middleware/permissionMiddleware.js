// Ruta: finanzas-app-pro/backend/middleware/permissionMiddleware.js
const db = require('../models');
const Permission = db.Permission;
const RolePermission = db.RolePermission;

const checkPermission = (requiredPermissionName) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'No autorizado. Usuario no identificado.' });
    }

    try {
      const permission = await Permission.findOne({ where: { name: requiredPermissionName } });
      if (!permission) {
        console.warn(`[Auth] Intento de acceso a permiso no existente: ${requiredPermissionName}`);
        return res.status(403).json({ message: 'Acceso denegado. Permiso desconocido.' });
      }

      const hasPermission = await RolePermission.findOne({
        where: {
          roleName: req.user.role,
          permissionId: permission.id
        }
      });

      if (hasPermission) {
        next(); // El usuario tiene el permiso a través de su rol
      } else {
        console.warn(`[Auth] Usuario ${req.user.id} (${req.user.role}) intentó acceder a '${requiredPermissionName}' sin permiso.`);
        res.status(403).json({ message: `Acceso denegado. No tienes el permiso '${requiredPermissionName}'.` });
      }
    } catch (error) {
      console.error('Error en el middleware checkPermission:', error);
      res.status(500).json({ message: 'Error interno al verificar permisos.' });
    }
  };
};

module.exports = { checkPermission };