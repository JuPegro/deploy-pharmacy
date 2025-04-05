// apps/backend/controllers/usuario.controller.js
const usuarioService = require('../services/usuario.service');
const AppError = require('../utils/errorHandler');

exports.crearUsuario = async (req, res, next) => {
  try {
    // Solo los administradores pueden crear usuarios
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para crear usuarios', 403));
    }

    const usuario = await usuarioService.crearUsuario(req.body, req.usuario.id);
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
    // Si no es administrador, devolver error
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para ver todos los usuarios', 403));
    }

    const filtros = {
      rol: req.query.rol
    };

    const usuarios = await usuarioService.obtenerUsuarios(filtros);
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
    // Si no es administrador y no es el propio usuario, devolver error
    if (req.usuario?.rol !== 'ADMIN' && req.usuario?.id !== req.params.id) {
      return next(new AppError('No tiene permisos para ver este usuario', 403));
    }

    const usuario = await usuarioService.obtenerUsuario(req.params.id);
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
    // Si no es administrador y no es el propio usuario, devolver error
    if (req.usuario?.rol !== 'ADMIN' && req.usuario?.id !== req.params.id) {
      return next(new AppError('No tiene permisos para actualizar este usuario', 403));
    }

    // Si es el propio usuario no puede cambiar su rol
    if (req.usuario?.id === req.params.id && req.body.rol) {
      return next(new AppError('No puede cambiar su propio rol', 403));
    }

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
    // Solo los administradores pueden eliminar usuarios
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para eliminar usuarios', 403));
    }

    // No se puede eliminar a sí mismo
    if (req.usuario?.id === req.params.id) {
      return next(new AppError('No se puede eliminar a sí mismo', 403));
    }

    await usuarioService.eliminarUsuario(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Nuevo controlador para asignar farmacia a un usuario
exports.asignarFarmaciaAUsuario = async (req, res, next) => {
  try {
    // Solo los administradores pueden asignar farmacias
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para asignar farmacias', 403));
    }

    const { usuarioId, farmaciaId } = req.body;

    if (!usuarioId || !farmaciaId) {
      return next(new AppError('Se requiere ID de usuario y ID de farmacia', 400));
    }

    const usuario = await usuarioService.asignarFarmaciaAUsuario(usuarioId, farmaciaId);
    
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