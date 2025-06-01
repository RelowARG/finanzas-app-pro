// Ruta: finanzas-app-pro/backend/api/admin/admin.controller.js
const db = require('../../models'); // [cite: finanzas-app-pro/backend/models/index.js]
const User = db.User; // [cite: finanzas-app-pro/backend/models/user.model.js]
const { Op } = require('sequelize');

// @desc    Obtener todos los usuarios (para admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Excluir la contraseña, los demás campos se incluyen
      order: [['name', 'ASC']]
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error en getAllUsers (admin):', error);
    next(error);
  }
};

// @desc    Actualizar el rol de un usuario (para admin)
// @route   PUT /api/admin/users/:userId/role
// @access  Admin
const updateUserRole = async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || (role !== 'user' && role !== 'admin')) {
    return res.status(400).json({ message: 'Rol inválido. Debe ser "user" o "admin".' });
  }

  if (req.user.id.toString() === userId && role === 'user') {
     const adminCount = await User.count({ where: { role: 'admin' } });
     if (adminCount <= 1) {
       return res.status(400).json({ message: 'No puedes quitar el rol de administrador al único administrador existente.' });
     }
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    user.role = role;
    await user.save();

    const { password, ...userWithoutPassword } = user.toJSON();
    res.status(200).json(userWithoutPassword);

  } catch (error) {
    console.error('Error en updateUserRole (admin):', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar un usuario (para admin)
// @route   DELETE /api/admin/users/:userId
// @access  Admin
const deleteUserByAdmin = async (req, res, next) => {
  const { userId } = req.params;

  if (req.user.id.toString() === userId) {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'No puedes eliminar al único administrador existente.' });
    }
  }

  const t = await db.sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Considerar la eliminación en cascada o el manejo de datos dependientes
    // Por ejemplo, si las transacciones tienen onDelete: 'CASCADE' en el modelo User:
    // await db.Transaction.destroy({ where: { userId: userId }, transaction: t });
    // await db.Account.destroy({ where: { userId: userId }, transaction: t });
    // ...etc.
    // O, idealmente, configurar onDelete: 'CASCADE' en las asociaciones del modelo User.

    await user.destroy({ transaction: t });
    await t.commit();
    res.status(200).json({ message: 'Usuario eliminado exitosamente.' });

  } catch (error) {
    if (t && !t.finished) {
        await t.rollback();
    }
    console.error('Error en deleteUserByAdmin (admin):', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'No se puede eliminar el usuario porque tiene datos asociados (ej. cuentas, transacciones). Elimina o reasigna esos datos primero.' });
    }
    next(error);
  }
};


module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUserByAdmin,
};
