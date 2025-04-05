// apps/backend/routes/devolucion.routes.js - versión actualizada
const express = require('express');
const devolucionController = require('../controllers/devolucion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Middleware de protección para todas las rutas
router.use(authMiddleware.proteger);

// Rutas para devoluciones
router.post('/', devolucionController.crearDevolucion);
router.get('/', devolucionController.obtenerDevoluciones);
router.get('/resumen', devolucionController.obtenerResumenDevoluciones);
router.get('/por-mes-anio/:farmaciaId', devolucionController.obtenerDevolucionesPorMesAnio);
router.get('/:id', devolucionController.obtenerDevolucion);

// Rutas para aprobación/rechazo de devoluciones (solo administradores)
router.patch('/:id/aprobar', 
  authMiddleware.restringirA('ADMIN'), 
  devolucionController.aprobarDevolucion);

router.patch('/:id/rechazar', 
  authMiddleware.restringirA('ADMIN'), 
  devolucionController.rechazarDevolucion);

module.exports = router;