const express = require('express');
const inventarioController = require('../controllers/inventario.controller');
const router = express.Router();

// Rutas para gestión de inventario
router.post('/', inventarioController.crearInventario);
router.get('/', inventarioController.obtenerInventarios);
router.get('/:id', inventarioController.obtenerInventario);
router.put('/:id', inventarioController.actualizarInventario);
router.delete('/:id', inventarioController.eliminarInventario);

// Ruta específica para ajuste de stock
router.patch('/:id/stock', inventarioController.ajustarStock);

module.exports = router;