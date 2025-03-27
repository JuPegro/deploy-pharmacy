// src/routes/analisis.routes.js
const express = require('express');
const analisisController = require('../controllers/analisis.controller');
const router = express.Router();

// Dashboard y análisis general
router.get('/dashboard/:farmaciaId', analisisController.obtenerDashboard);
router.get('/ventas-por-categoria/:farmaciaId', analisisController.obtenerVentasPorCategoria);
router.get('/medicamentos-populares/:farmaciaId', analisisController.obtenerMedicamentosPopulares);
router.get('/evolucion-ventas/:farmaciaId', analisisController.obtenerEvolucionVentas);

module.exports = router;