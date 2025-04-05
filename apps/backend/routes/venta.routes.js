// apps/backend/routes/venta.routes.js - versión actualizada
const express = require('express');
const ventaController = require('../controllers/venta.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Middleware de protección para todas las rutas
router.use(authMiddleware.proteger);

// Rutas para ventas
router.post('/', ventaController.crearVenta);
router.get('/', ventaController.obtenerVentas);
router.get('/resumen', ventaController.obtenerResumenVentas);
router.get('/por-mes-anio/:farmaciaId', ventaController.obtenerVentasPorMesAnio);
router.get('/:id', ventaController.obtenerVenta);

module.exports = router;