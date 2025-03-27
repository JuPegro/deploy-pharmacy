const express = require('express');
const ventaController = require('../controllers/venta.controller');
const router = express.Router();

// Rutas para ventas
router.post('/', ventaController.crearVenta);
router.get('/', ventaController.obtenerVentas);
router.get('/resumen', ventaController.obtenerResumenVentas);
router.get('/:id', ventaController.obtenerVenta);

module.exports = router;