// Ruta: finanzas-app-pro/backend/api/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const db = require('../../models');
const User = db.User;
const RolePermission = db.RolePermission;
const Permission = db.Permission;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Por favor, incluye nombre, email y contraseña.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      // dashboardConfig se establecerá a null o el default de la BD al crear
      // Opcionalmente, podrías inicializarlo aquí con valores por defecto si lo deseas
      // dashboardConfig: { widgetOrder: [], visibleWidgetIds: [], displayedAccountIds: [] }
    });

    if (user) {
      const rolePermissions = await RolePermission.findAll({
        where: { roleName: user.role },
        include: [{ model: Permission, as: 'permissionDetail', attributes: ['name'] }]
      });
      const permissions = rolePermissions.map(rp => rp.permissionDetail.name);

      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: permissions,
          dashboardConfig: user.dashboardConfig || { widgetOrder: [], visibleWidgetIds: [], displayedAccountIds: [] } 
        },
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos.' });
    }
  } catch (error) {
    console.error('Error en registerUser:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Error de validación', errors: messages });
    }
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, incluye email y contraseña.' });
  }

  try {
    const user = await User.findOne({
      where: { email }
    });

    if (user && (await user.comparePassword(password))) {
      user.lastLoginAt = new Date();
      await user.save({ fields: ['lastLoginAt', 'updatedAt'] }); 

      const rolePermissions = await RolePermission.findAll({
        where: { roleName: user.role },
        include: [{ model: Permission, as: 'permissionDetail', attributes: ['name'] }]
      });
      const permissions = rolePermissions.map(rp => rp.permissionDetail.name);

      res.status(200).json({
        message: 'Login exitoso.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          permissions: permissions,
          dashboardConfig: user.dashboardConfig || { widgetOrder: [], visibleWidgetIds: [], displayedAccountIds: [] } 
        },
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña inválidos.' });
    }
  } catch (error) {
    console.error('Error en loginUser:', error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  if (!req.user || !req.user.id) { 
      return res.status(401).json({ message: 'No autorizado, usuario no identificado en la solicitud.'})
  }
  try {
    const userFromDb = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt', 'lastLoginAt', 'dashboardConfig']
    });

    if (!userFromDb) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const rolePermissions = await RolePermission.findAll({
      where: { roleName: userFromDb.role },
      include: [{ model: Permission, as: 'permissionDetail', attributes: ['name'] }]
    });
    const permissions = rolePermissions.map(rp => rp.permissionDetail.name);
    
    const userData = userFromDb.toJSON ? userFromDb.toJSON() : userFromDb;

    const currentDashboardConfig = userData.dashboardConfig || {};
    const normalizedDashboardConfig = {
        widgetOrder: Array.isArray(currentDashboardConfig.widgetOrder) ? currentDashboardConfig.widgetOrder : [],
        visibleWidgetIds: Array.isArray(currentDashboardConfig.visibleWidgetIds) ? currentDashboardConfig.visibleWidgetIds : [], // Normalizar visibleWidgetIds
        displayedAccountIds: Array.isArray(currentDashboardConfig.displayedAccountIds) ? currentDashboardConfig.displayedAccountIds : [],
    };


    const userResponse = {
        ...userData,
        permissions,
        dashboardConfig: normalizedDashboardConfig
    };

    res.status(200).json(userResponse);

  } catch (error) {
    console.error('Error en getMe:', error);
    next(error);
  }
};

const updateDashboardConfig = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  const { dashboardConfig } = req.body;

  // --- VALIDACIÓN ACTUALIZADA Y COMPLETADA ---
  if (!dashboardConfig || typeof dashboardConfig !== 'object' ||
      !dashboardConfig.hasOwnProperty('widgetOrder') || !Array.isArray(dashboardConfig.widgetOrder) ||
      !dashboardConfig.hasOwnProperty('visibleWidgetIds') || !Array.isArray(dashboardConfig.visibleWidgetIds) || // <-- AÑADIDO CHECK
      !dashboardConfig.hasOwnProperty('displayedAccountIds') || !Array.isArray(dashboardConfig.displayedAccountIds)
     ) {
    console.error('[AUTH_CTRL] Formato de dashboardConfig inválido recibido:', JSON.stringify(dashboardConfig, null, 2));
    return res.status(400).json({ message: 'Formato de dashboardConfig inválido. Debe ser un objeto con las propiedades "widgetOrder" (array), "visibleWidgetIds" (array) y "displayedAccountIds" (array).' });
  }
  // --- FIN DE VALIDACIÓN ---

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // console.log('[AUTH_CTRL] Configuración del dashboard RECIBIDA para guardar:', JSON.stringify(dashboardConfig, null, 2));

    // Asegurarse de que solo se guarden las propiedades esperadas y nada más.
    const newDashboardConfig = {
        widgetOrder: dashboardConfig.widgetOrder,
        visibleWidgetIds: dashboardConfig.visibleWidgetIds, // <-- AÑADIDA ESTA LÍNEA
        displayedAccountIds: dashboardConfig.displayedAccountIds
    };

    user.dashboardConfig = newDashboardConfig; 

    await user.save({ fields: ['dashboardConfig', 'updatedAt'] }); 
    // console.log('[AUTH_CTRL] user.save() exitoso. dashboardConfig guardado:', JSON.stringify(user.dashboardConfig, null, 2));

    res.status(200).json({
        message: 'Configuración del dashboard actualizada exitosamente.',
        dashboardConfig: user.dashboardConfig // Devolver la configuración guardada
    });
  } catch (error) {
    console.error('Error actualizando dashboardConfig en auth.controller:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors.map(e => e.message);
        console.error(`[AUTH_CTRL] Sequelize Error (${error.name}):`, messages);
        return res.status(400).json({ message: 'Error de base de datos al guardar configuración.', errors: messages });
    }
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateDashboardConfig
};