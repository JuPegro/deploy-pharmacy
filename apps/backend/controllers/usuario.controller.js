// src/controllers/usuario.controller.js
const usuarioService = require('../services/usuario.service');
const AppError = require('../utils/errorHandler');

exports.crearUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        usuario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuarioService.obtenerUsuarios();
    res.status(200).json({
      status: 'success',
      results: usuarios.length,
      data: {
        usuarios
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarioService.obtenerUsuario(req.params.id);
    if (!usuario) {
      return next(new AppError('No se encontró el usuario', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        usuario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.actualizarUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarioService.actualizarUsuario(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        usuario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.eliminarUsuario = async (req, res, next) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};