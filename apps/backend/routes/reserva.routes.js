// src/routes/reserva.routes.js
const express = require('express');
const reservaController = require('../controllers/reserva.controller');
const router = express.Router();

router.post('/', reservaController.crearReserva);
router.get('/', reservaController.obtenerReservas);
router.get('/:id', reservaController.obtenerReserva);
router.patch('/:id/estado', reservaController.actualizarEstadoReserva);

module.exports = router;