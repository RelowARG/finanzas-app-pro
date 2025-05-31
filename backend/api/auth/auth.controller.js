// Ruta: finanzas-app-pro/backend/api/auth/auth.controller.js
// ACTUALIZA ESTE ARCHIVO CON LÓGICA REAL
const jwt = require('jsonwebtoken');
const db = require('../../models'); // Ajusta la ruta si models/index.js está en otro lugar
const User = db.User; // Acceder al modelo User a través del objeto db

// Función para generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d', // '1d', '30m', etc.
  });
};

// @desc    Registrar un nuevo usuario
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

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

    // El hook beforeCreate en el modelo User se encargará de hashear la contraseña
    const user = await User.create({
      name,
      email,
      password, // La contraseña se hasheará antes de guardar por el hook
    });

    if (user) {
      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos.' });
    }
  } catch (error) {
    console.error('Error en registerUser:', error);
    // Usar next(error) para pasar al errorHandler general
    // O manejar errores específicos como validaciones de Sequelize
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Error de validación', errors: messages });
    }
    next(error); 
  }
};

// @desc    Autenticar un usuario
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, incluye email y contraseña.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) { // Usa el método del modelo
      res.status(200).json({
        message: 'Login exitoso.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
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

// @desc    Obtener datos del usuario (requiere protección)
const getMe = async (req, res, next) => {
  // req.user es establecido por el middleware 'protect'
  if (!req.user) {
      return res.status(401).json({ message: 'No autorizado, usuario no encontrado en la solicitud.'})
  }
  try {
    // Volver a buscar al usuario puede ser redundante si el middleware ya lo hace bien,
    // pero es una capa extra de verificación o para obtener datos frescos.
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'] // Excluir contraseña
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json(user);

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
