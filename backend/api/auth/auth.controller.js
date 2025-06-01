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
      role: role || 'user'
      // dashboardConfig se establecerá a null por defecto según el modelo
    });

    if (user) {
      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // No incluimos dashboardConfig aquí ya que será null y se cargará/creará en el primer login o getMe
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
    // Asegurarse de que se seleccionen todos los campos necesarios, incluyendo dashboardConfig
    const user = await User.findOne({
      where: { email }
      // attributes: por defecto trae todos si no se especifica, lo cual está bien.
    });

    if (user && (await user.comparePassword(password))) {
      user.lastLoginAt = new Date();
      await user.save({ fields: ['lastLoginAt', 'updatedAt'] }); // Guardar solo los campos modificados explícitamente

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
          dashboardConfig: user.dashboardConfig // Incluir dashboardConfig
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
  if (!req.user || !req.user.id) { // req.user es establecido por 'protect'
      return res.status(401).json({ message: 'No autorizado, usuario no identificado en la solicitud.'})
  }
  try {
    const userFromDb = await User.findByPk(req.user.id, {
      // Especificar atributos para asegurar que dashboardConfig se incluya
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

    const userResponse = {
        ...userFromDb.toJSON(),
        permissions
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

  // Validación básica del objeto de configuración (ajusta según tu estructura esperada)
  if (!dashboardConfig || typeof dashboardConfig !== 'object' ||
      !dashboardConfig.widgetLayout || // Asumiendo que widgetLayout es una propiedad
      !Array.isArray(dashboardConfig.widgetLayout.left) ||
      !Array.isArray(dashboardConfig.widgetLayout.right) ||
      !dashboardConfig.displayedAccountIds || !Array.isArray(dashboardConfig.displayedAccountIds)
     ) {
    console.error('[AUTH_CTRL] Formato de dashboardConfig inválido recibido:', JSON.stringify(dashboardConfig, null, 2));
    return res.status(400).json({ message: 'Formato de dashboardConfig inválido. Debe ser un objeto con widgetLayout (con propiedades left y right como arrays) y displayedAccountIds (como array).' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    console.log('[AUTH_CTRL] Configuración del dashboard recibida para guardar:', JSON.stringify(dashboardConfig, null, 2));
    console.log('[AUTH_CTRL] Tipo de dato de dashboardConfig recibido:', typeof dashboardConfig);

    user.dashboardConfig = dashboardConfig;

    console.log('[AUTH_CTRL] Objeto usuario ANTES de save:', JSON.stringify(user.toJSON(), null, 2));
    console.log('[AUTH_CTRL] Intentando user.save()...');
    await user.save(); // Aquí se guardará el dashboardConfig
    console.log('[AUTH_CTRL] user.save() exitoso.');

    res.status(200).json({
        message: 'Configuración del dashboard actualizada exitosamente.',
        dashboardConfig: user.dashboardConfig // Devolver la configuración guardada
    });
  } catch (error) {
    console.error('Error actualizando dashboardConfig en auth.controller:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.original) {
      console.error('Original DB Error:', error.original);
      console.error('Original DB Error Code:', error.original.code);
      console.error('Original DB Error Errno:', error.original.errno);
      console.error('Original DB Error SQL State:', error.original.sqlState);
    }
    if (error.errors) { // Errores de validación de Sequelize
      console.error('Sequelize Validation Errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: 'Error de validación al guardar la configuración.', errors: error.errors.map(e => e.message) });
    }
    // Enviar al manejador de errores global que logueará el stack en desarrollo
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateDashboardConfig
};