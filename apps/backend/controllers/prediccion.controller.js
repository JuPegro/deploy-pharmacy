// apps/backend/controllers/prediccion.controller.js
const prediccionService = require('../services/prediccion.service');
const AppError = require('../utils/errorHandler');

exports.predecirDemanda = async (req, res, next) => {
  try {
    const { medicamentoId } = req.params;
    const { dias } = req.query;
    
    const predicciones = await prediccionService.predecirDemanda(
      medicamentoId, 
      dias ? parseInt(dias) : 30
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        predicciones
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerTendenciaVentas = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    const tendencia = await prediccionService.obtenerTendenciaVentas(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: {
        tendencia
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerNivelOptimoInventario = async (req, res, next) => {
  try {
    const { medicamentoId } = req.params;
    
    const resultado = await prediccionService.calcularNivelOptimoInventario(medicamentoId);
    
    res.status(200).json({
      status: 'success',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerRecomendacionesReabastecimiento = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    
    const recomendaciones = await prediccionService.obtenerRecomendacionesReabastecimiento(farmaciaId);
    
    res.status(200).json({
      status: 'success',
      data: {
        recomendaciones
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.analizarEstacionalidad = async (req, res, next) => {
  try {
    const { categoriaId } = req.params;
    
    const estacionalidad = await prediccionService.analizarEstacionalidad(categoriaId);
    
    res.status(200).json({
      status: 'success',
      data: {
        estacionalidad
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.analizarCorrelaciones = async (req, res, next) => {
  try {
    const correlaciones = await prediccionService.analizarCorrelaciones();
    
    res.status(200).json({
      status: 'success',
      data: {
        correlaciones
      }
    });
  } catch (error) {
    next(error);
  }
};