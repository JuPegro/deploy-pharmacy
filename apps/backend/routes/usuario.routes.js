// src/routes/usuario.routes.js
const express = require('express');
const usuarioController = require('../controllers/usuario.controller');
const router = express.Router();

router.post('/', usuarioController.crearUsuario);
router.get('/', usuarioController.obtenerUsuarios);
router.get('/:id', usuarioController.obtenerUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;