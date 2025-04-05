// apps/backend/controllers/devolucion.controller.js - versión actualizada
const devolucionService = require('../services/devolucion.service');
const AppError = require('../utils/errorHandler');

exports.crearDevolucion = async (req, res, next) => {
  try {
    // Agregar el ID del usuario desde el token de autenticación
    req.body.usuarioId = req.usuario?.id;

    // Para usuario de farmacia, asegurarse de usar su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId) {
      req.body.farmaciaId = req.usuario.farmaciaActivaId;
    }

    const devolucion = await devolucionService.crearDevolucion(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        devolucion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerDevoluciones = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta
    const opciones = {
      pagina: parseInt(req.query.pagina) || 1,
      limite: parseInt(req.query.limite) || 10,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      estado: req.query.estado,
      mes: req.query.mes,
      anio: req.query.anio
    };

    // Para usuario de farmacia, filtrar solo por su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId) {
      opciones.farmaciaId = req.usuario.farmaciaActivaId;
    } else if (req.query.farmaciaId) {
      opciones.farmaciaId = req.query.farmaciaId;
    }

    const resultado = await devolucionService.obtenerDevoluciones(opciones);

    res.status(200).json({
      status: 'success',
      results: resultado.devoluciones.length,
      data: {
        devoluciones: resultado.devoluciones,
        paginacion: resultado.paginacion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerDevolucion = async (req, res, next) => {
  try {
    const devolucion = await devolucionService.obtenerDevolucion(req.params.id);
    
    // Para usuario de farmacia, verificar que pertenece a su farmacia
    if (req.usuario?.rol === 'FARMACIA' && 
        req.usuario?.farmaciaActivaId !== devolucion.farmaciaId) {
      return next(new AppError('No tienes acceso a esta devolución', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        devolucion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.aprobarDevolucion = async (req, res, next) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tienes permisos para aprobar devoluciones', 403));
    }

    const devolucion = await devolucionService.aprobarDevolucion(req.params.id, req.usuario.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        devolucion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.rechazarDevolucion = async (req, res, next) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tienes permisos para rechazar devoluciones', 403));
    }

    const { motivo } = req.body;
    if (!motivo) {
      return next(new AppError('Se requiere especificar un motivo de rechazo', 400));
    }

    const devolucion = await devolucionService.rechazarDevolucion(req.params.id, motivo, req.usuario.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        devolucion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerResumenDevoluciones = async (req, res, next) => {
  try {
    const opciones = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      estado: req.query.estado,
      mes: req.query.mes,
      anio: req.query.anio
    };

    // Para usuario de farmacia, filtrar solo por su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId) {
      opciones.farmaciaId = req.usuario.farmaciaActivaId;
    } else if (req.query.farmaciaId) {
      opciones.farmaciaId = req.query.farmaciaId;
    }

    const resumen = await devolucionService.obtenerResumenDevoluciones(opciones);

    res.status(200).json({
      status: 'success',
      data: {
        resumen
      }
    });
  } catch (error) {
    next(error);
  }
};

// Nuevo endpoint para obtener devoluciones agrupadas por mes y año
exports.obtenerDevolucionesPorMesAnio = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    
    // Para usuario de farmacia, usar siempre su farmacia activa
    const farmaciaIdFinal = req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId
      ? req.usuario.farmaciaActivaId
      : farmaciaId;
    
    if (!farmaciaIdFinal) {
      return next(new AppError('Se requiere un ID de farmacia válido', 400));
    }
    
    const devolucionesPorMesAnio = await devolucionService.obtenerDevolucionesPorMesAnio(farmaciaIdFinal);
    
    res.status(200).json({
      status: 'success',
      data: {
        devolucionesPorMesAnio
      }
    });
  } catch (error) {
    next(error);
  }
};