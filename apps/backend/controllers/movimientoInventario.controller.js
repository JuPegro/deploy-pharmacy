// src/controllers/movimientoInventario.controller.js
const movimientoInventarioService = require('../services/movimientoInventario.service');
const AppError = require('../utils/errorHandler');

exports.crearMovimientoInventario = async (req, res, next) => {
  try {
    const movimiento = await movimientoInventarioService.crearMovimientoInventario(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        movimiento
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerMovimientosInventario = async (req, res, next) => {
  try {
    const movimientos = await movimientoInventarioService.obtenerMovimientosInventario();
    res.status(200).json({
      status: 'success',
      results: movimientos.length,
      data: {
        movimientos
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerMovimientoInventario = async (req, res, next) => {
  try {
    const movimiento = await movimientoInventarioService.obtenerMovimientoInventario(req.params.id);
    if (!movimiento) {
      return next(new AppError('No se encontró el movimiento de inventario', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        movimiento
      }
    });
  } catch (error) {
    next(error);
  }
};