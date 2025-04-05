// apps/backend/routes/usuario.routes.js
const express = require('express');
const usuarioController = require('../controllers/usuario.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Middleware para asegurar que todas las rutas estén protegidas
router.use(authMiddleware.proteger);

// Rutas de administración de usuarios (solo ADMIN)
router.post('/', authMiddleware.restringirA('ADMIN'), usuarioController.crearUsuario);
router.get('/', authMiddleware.restringirA('ADMIN'), usuarioController.obtenerUsuarios);

// Ruta para asignar farmacia a un usuario (solo ADMIN)
router.post('/asignar-farmacia', authMiddleware.restringirA('ADMIN'), usuarioController.asignarFarmaciaAUsuario);

// Rutas para usuarios individuales
router.get('/:id', usuarioController.obtenerUsuario); // Acceso limitado por el controlador
router.put('/:id', usuarioController.actualizarUsuario); // Acceso limitado por el controlador
router.delete('/:id', authMiddleware.restringirA('ADMIN'), usuarioController.eliminarUsuario);

module.exports = router;