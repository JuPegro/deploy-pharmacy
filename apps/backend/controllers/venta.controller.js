// apps/backend/controllers/venta.controller.js - versión actualizada
const ventaService = require('../services/venta.service');
const AppError = require('../utils/errorHandler');

exports.crearVenta = async (req, res, next) => {
  try {
    // Agregar el ID del usuario desde el token de autenticación
    req.body.usuarioId = req.usuario?.id;

    // Para usuario de farmacia, forzar el uso de su farmacia activa
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      req.body.farmaciaId = req.usuario.farmaciaActivaId;
    }

    // Verificar que se especificó una farmacia
    if (!req.body.farmaciaId) {
      return next(new AppError('Se requiere especificar una farmacia', 400));
    }

    const venta = await ventaService.crearVenta(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        venta
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerVentas = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta
    const opciones = {
      pagina: parseInt(req.query.pagina) || 1,
      limite: parseInt(req.query.limite) || 10,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      mes: req.query.mes,
      anio: req.query.anio
    };

    // Para usuario de farmacia, filtrar solo por su farmacia activa
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      opciones.farmaciaId = req.usuario.farmaciaActivaId;
    } else if (req.query.farmaciaId) {
      opciones.farmaciaId = req.query.farmaciaId;
    }

    const resultado = await ventaService.obtenerVentas(opciones);

    res.status(200).json({
      status: 'success',
      results: resultado.ventas.length,
      data: {
        ventas: resultado.ventas,
        paginacion: resultado.paginacion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerVenta = async (req, res, next) => {
  try {
    const venta = await ventaService.obtenerVenta(req.params.id);
    
    // Para usuario de farmacia, verificar que pertenece a su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && 
        req.usuario.farmaciaActivaId !== venta.farmaciaId) {
      return next(new AppError('No tiene acceso a esta venta', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        venta
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerResumenVentas = async (req, res, next) => {
  try {
    const opciones = {
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      mes: req.query.mes,
      anio: req.query.anio
    };

    // Para usuario de farmacia, filtrar solo por su farmacia activa
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      opciones.farmaciaId = req.usuario.farmaciaActivaId;
    } else if (req.query.farmaciaId) {
      opciones.farmaciaId = req.query.farmaciaId;
    }

    const resumen = await ventaService.obtenerResumenVentas(opciones);

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

// Nuevo endpoint para obtener ventas agrupadas por mes y año
exports.obtenerVentasPorMesAnio = async (req, res, next) => {
  try {
    const { farmaciaId } = req.params;
    
    // Para usuario de farmacia, usar siempre su farmacia activa
    const farmaciaIdFinal = req.usuario?.rol === 'FARMACIA' && req.usuario?.farmaciaActivaId
      ? req.usuario.farmaciaActivaId
      : farmaciaId;
    
    if (!farmaciaIdFinal) {
      return next(new AppError('Se requiere un ID de farmacia válido', 400));
    }
    
    const ventasPorMesAnio = await ventaService.obtenerVentasPorMesAnio(farmaciaIdFinal);
    
    res.status(200).json({
      status: 'success',
      data: {
        ventasPorMesAnio
      }
    });
  } catch (error) {
    next(error);
  }
};