// src/routes/movimientoInventario.routes.js
const express = require('express');
const movimientoInventarioController = require('../controllers/movimientoInventario.controller');
const router = express.Router();

router.post('/', movimientoInventarioController.crearMovimientoInventario);
router.get('/', movimientoInventarioController.obtenerMovimientosInventario);
router.get('/:id', movimientoInventarioController.obtenerMovimientoInventario);

module.exports = router;