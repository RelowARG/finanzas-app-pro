// Ruta: finanzas-app-pro/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../models'); //
const User = db.User; //

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // *** PUNTO CLAVE: Asegurarse de incluir 'role' al buscar el usuario ***
      req.user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role'] // Incluir 'role' aquí
      });

      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado para este token.' });
      }

      next();
    } catch (error) {
      console.error('Error de autenticación de token:', error.message);
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

const isAdmin = (req, res, next) => {
  // Ahora req.user.role debería estar disponible si protect lo cargó correctamente
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // Log para depuración en el backend
    //console.log('[isAdmin Middleware] Acceso denegado. Usuario:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
};

module.exports = { protect, isAdmin }; // Exportar isAdmin si se usa por separado, o asegurar que authMiddleware lo haga
