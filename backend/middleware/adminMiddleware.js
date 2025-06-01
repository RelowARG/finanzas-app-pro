// Ruta: finanzas-app-pro/backend/middleware/adminMiddleware.js
// NUEVO ARCHIVO

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // El usuario es admin, continuar
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
};

module.exports = { isAdmin };
