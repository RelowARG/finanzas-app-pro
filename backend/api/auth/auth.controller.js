// Ruta: finanzas-app-pro/backend/api/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const db = require('../../models');
const User = db.User;
const RolePermission = db.RolePermission; // *** AÑADIDO ***
const Permission = db.Permission;       // *** AÑADIDO ***

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const registerUser = async (req, res, next) => {
  // ... (sin cambios, el de tu archivo original está bien)
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
    });

    if (user) {
      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt
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
  // ... (sin cambios, el de tu archivo original está bien)
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, incluye email y contraseña.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      user.lastLoginAt = new Date();
      await user.save(); 

      // *** NUEVO: Obtener permisos del usuario después del login ***
      const rolePermissions = await RolePermission.findAll({
        where: { roleName: user.role },
        include: [{ model: Permission, as: 'permissionDetail', attributes: ['name'] }]
      });
      const permissions = rolePermissions.map(rp => rp.permissionDetail.name);
      // *** FIN NUEVO ***

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
          permissions: permissions // *** AÑADIDO: Enviar permisos al frontend ***
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
  if (!req.user) {
      return res.status(401).json({ message: 'No autorizado, usuario no encontrado en la solicitud.'})
  }
  try {
    const userFromDb = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt', 'lastLoginAt']
    });

    if (!userFromDb) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // *** NUEVO: Obtener y añadir permisos del usuario ***
    const rolePermissions = await RolePermission.findAll({
      where: { roleName: userFromDb.role },
      include: [{ model: Permission, as: 'permissionDetail', attributes: ['name'] }]
    });
    const permissions = rolePermissions.map(rp => rp.permissionDetail.name);
    // *** FIN NUEVO ***

    const userWithPermissions = {
        ...userFromDb.toJSON(),
        permissions // Añadir el array de nombres de permisos
    };

    res.status(200).json(userWithPermissions);

  } catch (error) {
    console.error('Error en getMe:', error);
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};