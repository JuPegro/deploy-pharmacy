// src/controllers/reserva.controller.js
const reservaService = require('../services/reserva.service');
const AppError = require('../utils/errorHandler');

exports.crearReserva = async (req, res, next) => {
  try {
    const reserva = await reservaService.crearReserva(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        reserva
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerReservas = async (req, res, next) => {
  try {
    const reservas = await reservaService.obtenerReservas();
    res.status(200).json({
      status: 'success',
      results: reservas.length,
      data: {
        reservas
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerReserva = async (req, res, next) => {
    try {
      const reserva = await reservaService.obtenerReserva(req.params.id);
      if (!reserva) {
        return next(new AppError('No se encontró la reserva', 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          reserva
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.actualizarEstadoReserva = async (req, res, next) => {
    try {
      const { estado } = req.body;
      const reserva = await reservaService.actualizarEstadoReserva(req.params.id, estado);
      res.status(200).json({
        status: 'success',
        data: {
          reserva
        }
      });
    } catch (error) {
      next(error);
    }
  };