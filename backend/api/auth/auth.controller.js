// Ruta: finanzas-app-pro/backend/api/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const db = require('../../models'); //
const User = db.User; //

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
    });

    if (user) {
      // Actualizar lastLoginAt también en el registro podría ser una opción
      // user.lastLoginAt = new Date();
      // await user.save(); // Opcional: si quieres que createdAt y lastLoginAt sean cercanos en el registro

      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt // Se incluirá si lo actualizas arriba
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
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      // *** Actualizar lastLoginAt ***
      user.lastLoginAt = new Date();
      await user.save(); // Esto también actualizará 'updatedAt'
      // *** Fin Actualización ***

      res.status(200).json({
        message: 'Login exitoso.',
        user: { // Devolver el objeto usuario actualizado
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt, // Incluir el nuevo campo
          createdAt: user.createdAt, // Incluir para consistencia si es necesario
          updatedAt: user.updatedAt, // Incluir para consistencia
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
  if (!req.user) { // req.user es establecido por el middleware 'protect'
      return res.status(401).json({ message: 'No autorizado, usuario no encontrado en la solicitud.'})
  }
  try {
    // El middleware 'protect' ya carga el usuario con el rol.
    // Solo necesitamos asegurarnos que el objeto req.user en 'protect' incluya todos los campos deseados.
    // Para ser explícitos y obtener la versión más fresca, podemos volver a buscarlo.
    const userFromDb = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt', 'lastLoginAt'] // Asegurar que 'lastLoginAt' esté aquí
    });

    if (!userFromDb) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json(userFromDb);

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