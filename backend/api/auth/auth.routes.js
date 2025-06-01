// Ruta: finanzas-app-pro/backend/api/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authController.registerUser);

// @desc    Autenticar un usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authController.loginUser);

// @desc    Obtener datos del usuario logueado
// @route   GET /api/auth/me
// @access  Private (ahora protegido)
router.get('/me', protect, authController.getMe); 

// *** NUEVA RUTA ***
// @desc    Actualizar configuración del dashboard del usuario logueado
// @route   PUT /api/auth/dashboard-config
// @access  Private
router.put('/dashboard-config', protect, authController.updateDashboardConfig);

module.exports = router;