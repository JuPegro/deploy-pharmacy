// apps/backend/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post('/login', authController.login);
router.post('/login-test', authController.loginTest); // Ruta de prueba
router.post('/registro', authController.registro);
router.get('/me', authController.getMe);

module.exports = router;