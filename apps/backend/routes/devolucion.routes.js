const express = require('express');
const devolucionController = require('../controllers/devolucion.controller');
const router = express.Router();

// Rutas para devoluciones
router.post('/', devolucionController.crearDevolucion);
router.get('/', devolucionController.obtenerDevoluciones);
router.get('/resumen', devolucionController.obtenerResumenDevoluciones);
router.get('/:id', devolucionController.obtenerDevolucion);

module.exports = router;