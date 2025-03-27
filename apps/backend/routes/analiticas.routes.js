// src/routes/analiticas.routes.js
const express = require('express');
const analiticasController = require('../controllers/analiticas.controller');
const router = express.Router();

// Rutas de analíticas existentes
router.get('/sugerencias-inventario', analiticasController.obtenerSugerenciasInventario);
router.get('/predictivo/:farmaciaId', analiticasController.obtenerAnalisisPredictivo);

// Rutas adicionales para el dashboard frontal
router.get('/ventas-por-sucursal/:farmaciaId', analiticasController.getVentasPorSucursal);
router.get('/medicamentos-mas-vendidos/:farmaciaId', analiticasController.getMedicamentosMasVendidos);

module.exports = router;