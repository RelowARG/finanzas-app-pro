// Ruta: finanzas-app-pro/backend/api/permissions/permissions.controller.js
const db = require('../../models');
const Permission = db.Permission;
const RolePermission = db.RolePermission;
const { Op } = require('sequelize');

// @desc    Obtener todos los permisos disponibles en el sistema
// @route   GET /api/admin/permissions
// @access  Admin (con permiso específico)
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll({
      order: [['name', 'ASC']],
    });
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error en getAllPermissions:', error);
    next(error);
  }
};

// @desc    Obtener los permisos asignados a un rol específico
// @route   GET /api/admin/roles/:roleName/permissions
// @access  Admin (con permiso específico)
const getPermissionsForRole = async (req, res, next) => {
  const { roleName } = req.params;
  if (roleName !== 'user' && roleName !== 'admin') {
    return res.status(400).json({ message: 'Nombre de rol inválido. Debe ser "user" o "admin".' });
  }

  try {
    const rolePermissions = await RolePermission.findAll({
      where: { roleName: roleName },
      include: [{ model: Permission, as: 'permissionDetail', attributes: ['id', 'name', 'description'] }],
    });
    
    const permissionsDetails = rolePermissions.map(rp => rp.permissionDetail);
    res.status(200).json(permissionsDetails);
  } catch (error) {
    console.error(`Error obteniendo permisos para el rol ${roleName}:`, error);
    next(error);
  }
};

// @desc    Actualizar los permisos para un rol específico
// @route   PUT /api/admin/roles/:roleName/permissions
// @access  Admin (con permiso específico)
const updatePermissionsForRole = async (req, res, next) => {
  const { roleName } = req.params;
  const { permissionIds } = req.body; // Se espera un array de IDs de permisos

  if (roleName !== 'user' && roleName !== 'admin') {
    return res.status(400).json({ message: 'Nombre de rol inválido. Debe ser "user" o "admin".' });
  }
  if (!Array.isArray(permissionIds) || !permissionIds.every(id => Number.isInteger(id))) {
    return res.status(400).json({ message: 'Se espera un array de IDs de permisos numéricos.' });
  }
  
  // No permitir que el rol 'admin' se quede sin el permiso 'admin_manage_user_roles'
  // o cualquier otro permiso crítico para la administración de roles/permisos.
  // Esta es una salvaguarda básica.
  if (roleName === 'admin') {
    const manageRolesPermission = await Permission.findOne({ where: { name: 'admin_manage_user_roles' } });
    if (manageRolesPermission && !permissionIds.includes(manageRolesPermission.id)) {
      return res.status(400).json({ message: "El rol 'admin' no puede perder el permiso 'admin_manage_user_roles'." });
    }
    const managePermissionsPermission = await Permission.findOne({ where: { name: 'admin_manage_permissions_config' } });
    if (managePermissionsPermission && !permissionIds.includes(managePermissionsPermission.id)) {
       // Suponiendo que crearemos este permiso 'admin_manage_permissions_config'
      // return res.status(400).json({ message: "El rol 'admin' no puede perder el permiso para gestionar permisos." });
    }
  }


  const t = await db.sequelize.transaction();
  try {
    // 1. Verificar que todos los IDs de permisos existan
    const existingPermissions = await Permission.findAll({
      where: {
        id: { [Op.in]: permissionIds }
      },
      transaction: t,
      attributes: ['id']
    });

    if (existingPermissions.length !== permissionIds.length) {
      await t.rollback();
      const foundIds = existingPermissions.map(p => p.id);
      const notFoundIds = permissionIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ message: `Uno o más IDs de permisos no son válidos: ${notFoundIds.join(', ')}` });
    }

    // 2. Eliminar todas las asignaciones de permisos existentes para este rol
    await RolePermission.destroy({
      where: { roleName: roleName },
      transaction: t,
    });

    // 3. Crear las nuevas asignaciones
    if (permissionIds.length > 0) {
      const newAssignments = permissionIds.map(permissionId => ({
        roleName: roleName,
        permissionId: permissionId,
      }));
      await RolePermission.bulkCreate(newAssignments, { transaction: t });
    }

    await t.commit();
    
    // Devolver los nuevos permisos asignados (opcional, pero bueno para confirmar)
    const updatedRolePermissions = await RolePermission.findAll({
      where: { roleName: roleName },
      include: [{ model: Permission, as: 'permissionDetail', attributes: ['id', 'name', 'description'] }],
    });
    const updatedPermissionsDetails = updatedRolePermissions.map(rp => rp.permissionDetail);

    res.status(200).json({ 
        message: `Permisos para el rol '${roleName}' actualizados exitosamente.`,
        assignedPermissions: updatedPermissionsDetails
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error(`Error actualizando permisos para el rol ${roleName}:`, error);
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getPermissionsForRole,
  updatePermissionsForRole,
};