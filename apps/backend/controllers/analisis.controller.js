// src/controllers/analisis.controller.js
const analisisService = require('../services/analisis.service');
const AppError = require('../utils/errorHandler');

exports.obtenerDashboard = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    const dashboard = await analisisService.obtenerDashboard(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerVentasPorCategoria = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    const ventasPorCategoria = await analisisService.obtenerVentasPorCategoria(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: ventasPorCategoria
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerMedicamentosPopulares = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    const medicamentosPopulares = await analisisService.obtenerMedicamentosPopulares(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: medicamentosPopulares
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerEvolucionVentas = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    const evolucionVentas = await analisisService.obtenerEvolucionVentas(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: evolucionVentas
    });
  } catch (error) {
    next(error);
  }
};