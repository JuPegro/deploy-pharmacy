const express = require('express');
const farmaciaController = require('../controllers/farmacia.controller');
const router = express.Router();

// Rutas para farmacias
router.post('/', farmaciaController.crearFarmacia);
router.get('/', farmaciaController.obtenerFarmacias);
router.get('/:id', farmaciaController.obtenerFarmacia);
router.put('/:id', farmaciaController.actualizarFarmacia);
router.delete('/:id', farmaciaController.eliminarFarmacia);

module.exports = router;