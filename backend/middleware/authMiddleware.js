// Ruta: finanzas-app-pro/backend/middleware/authMiddleware.js
// ACTUALIZA ESTE ARCHIVO (descomenta y completa)
const jwt = require('jsonwebtoken');
const db = require('../models'); // Ajusta la ruta si es necesario
const User = db.User;

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      // Obtener token del header: "Bearer TOKEN_AQUI"
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin la contraseña)
      // El payload del token que generamos solo tiene el 'id'
      req.user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email'] // Excluir contraseña y otros datos sensibles
      });

      if (!req.user) {
        // Si el usuario fue eliminado después de que el token fue emitido
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado para este token.' });
      }

      next(); // Pasar al siguiente middleware o controlador
    } catch (error) {
      console.error('Error de autenticación de token:', error.message);
      // Distinguir entre token expirado y otros errores de verificación
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'No autorizado, el token ha expirado.' });
      }
      return res.status(401).json({ message: 'No autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no se proveyó token.' });
  }
};

module.exports = { protect };
