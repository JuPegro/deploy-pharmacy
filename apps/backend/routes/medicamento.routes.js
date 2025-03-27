const express = require('express');
const medicamentoController = require('../controllers/medicamento.controller');
const router = express.Router();

// Rutas para el catálogo de medicamentos
router.get('/', medicamentoController.obtenerCatalogoMedicamentos);
router.post('/', medicamentoController.crearMedicamento);

// Rutas para medicamentos individuales
router.get('/:id', medicamentoController.obtenerMedicamentoPorId);
router.put('/:id', medicamentoController.actualizarMedicamento);
router.delete('/:id', medicamentoController.eliminarMedicamento);

module.exports = router;