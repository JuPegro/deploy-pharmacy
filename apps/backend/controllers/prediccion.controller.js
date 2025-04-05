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
    
    // Para usuarios de farmacia, usar siempre su farmacia activa
    const farmaciaIdFinal = req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId
      ? req.usuario.farmaciaActivaId
      : farmaciaId;
    
    if (!farmaciaIdFinal) {
      return next(new AppError('Se requiere un ID de farmacia válido', 400));
    }
    
    const tendencia = await prediccionService.obtenerTendenciaVentas(farmaciaIdFinal);
    
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
    // Para usuarios de farmacia, usar siempre su farmacia activa
    let farmaciaId;
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      farmaciaId = req.usuario.farmaciaActivaId;
    } else {
      farmaciaId = req.params.farmaciaId;
    }
    
    if (!farmaciaId) {
      return next(new AppError('Se requiere un ID de farmacia válido', 400));
    }
    
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

exports.editarRecomendacion = async (req, res, next) => {
  try {
    const { medicamentoId } = req.params;
    const { nuevaDemanda } = req.body;
    
    // Validar datos
    if (!medicamentoId || !nuevaDemanda || isNaN(nuevaDemanda) || nuevaDemanda <= 0) {
      return next(new AppError('Se requiere un valor válido de demanda proyectada', 400));
    }
    
    // Tanto administradores como usuarios de farmacia pueden editar recomendaciones
    if (req.usuario?.rol === 'FARMACIA' && !req.usuario?.farmaciaActivaId) {
      return next(new AppError('No tiene una farmacia activa asignada', 400));
    }
    
    const resultado = await prediccionService.editarRecomendacion(
      medicamentoId,
      parseInt(nuevaDemanda),
      req.usuario.id,
      req.usuario?.rol === 'FARMACIA' ? req.usuario.farmaciaActivaId : null
    );
    
    res.status(200).json({
      status: 'success',
      data: resultado
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

// Nuevo endpoint para obtener estadísticas de medicamentos más vendidos
exports.obtenerMedicamentosMasVendidos = async (req, res, next) => {
  try {
    // Para usuarios de farmacia, usar siempre su farmacia activa
    let farmaciaId;
    
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      farmaciaId = req.usuario.farmaciaActivaId;
    } else {
      farmaciaId = req.params.farmaciaId;
    }
    
    if (!farmaciaId) {
      return next(new AppError('Se requiere un ID de farmacia válido', 400));
    }
    
    const { periodo } = req.query; // 'semana', 'mes', 'trimestre'
    
    const medicamentosMasVendidos = await prediccionService.obtenerMedicamentosMasVendidos(farmaciaId, periodo);
    
    res.status(200).json({
      status: 'success',
      data: {
        medicamentosMasVendidos
      }
    });
  } catch (error) {
    next(error);
  }
};