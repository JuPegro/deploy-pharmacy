const express = require('express');
const devolucionController = require('../controllers/devolucion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Rutas para devoluciones
router.post('/', authMiddleware.proteger, devolucionController.crearDevolucion);
router.get('/', authMiddleware.proteger, devolucionController.obtenerDevoluciones);
router.get('/resumen', authMiddleware.proteger, devolucionController.obtenerResumenDevoluciones);
router.get('/:id', authMiddleware.proteger, devolucionController.obtenerDevolucion);

// Rutas para aprobación/rechazo de devoluciones (solo administradores)
router.patch('/:id/aprobar', 
  authMiddleware.proteger, 
  authMiddleware.restringirA('ADMIN'), 
  devolucionController.aprobarDevolucion);

router.patch('/:id/rechazar', 
  authMiddleware.proteger, 
  authMiddleware.restringirA('ADMIN'), 
  devolucionController.rechazarDevolucion);

module.exports = router;