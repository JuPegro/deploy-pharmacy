// apps/backend/routes/prediccion.routes.js
const express = require('express');
const prediccionController = require('../controllers/prediccion.controller');
const router = express.Router();

// Rutas de predicción de demanda
router.get('/demanda/:medicamentoId', prediccionController.predecirDemanda);
router.get('/tendencia-ventas/:farmaciaId', prediccionController.obtenerTendenciaVentas);
router.get('/inventario-optimo/:medicamentoId', prediccionController.obtenerNivelOptimoInventario);
router.get('/recomendaciones-reabastecimiento/:farmaciaId', prediccionController.obtenerRecomendacionesReabastecimiento);

// Rutas de análisis predictivo
router.get('/estacionalidad/:categoriaId', prediccionController.analizarEstacionalidad);
router.get('/correlaciones', prediccionController.analizarCorrelaciones);

module.exports = router;