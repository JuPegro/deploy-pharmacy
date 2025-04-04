// apps/backend/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/login', authController.login);
router.post('/login-test', authController.loginTest); // Ruta de prueba
router.post('/registro', authController.registro);
router.get('/me', authMiddleware.proteger, authController.getMe);
router.post('/seleccionar-farmacia', authMiddleware.proteger, authController.seleccionarFarmaciaActiva);

module.exports = router;