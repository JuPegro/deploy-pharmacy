// apps/backend/routes/prediccion.routes.js
const express = require('express');
const prediccionController = require('../controllers/prediccion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Middleware de protección para todas las rutas
router.use(authMiddleware.proteger);

// Rutas de predicción de demanda
router.get('/demanda/:medicamentoId', prediccionController.predecirDemanda);
router.get('/tendencia-ventas/:farmaciaId', prediccionController.obtenerTendenciaVentas);
router.get('/inventario-optimo/:medicamentoId', prediccionController.obtenerNivelOptimoInventario);
router.get('/recomendaciones-reabastecimiento/:farmaciaId', prediccionController.obtenerRecomendacionesReabastecimiento);

// Ruta para editar recomendaciones (usuarios de farmacia y admin)
router.post('/editar-recomendacion/:medicamentoId', prediccionController.editarRecomendacion);

// Rutas de análisis predictivo
router.get('/estacionalidad/:categoriaId', prediccionController.analizarEstacionalidad);
router.get('/correlaciones', prediccionController.analizarCorrelaciones);

// Ruta para medicamentos más vendidos
router.get('/medicamentos-mas-vendidos/:farmaciaId', prediccionController.obtenerMedicamentosMasVendidos);

module.exports = router;