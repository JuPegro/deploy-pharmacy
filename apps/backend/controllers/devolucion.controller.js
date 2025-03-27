const devolucionService = require('../services/devolucion.service');
const AppError = require('../utils/errorHandler');

exports.crearDevolucion = async (req, res, next) => {
  try {
    // Agregar el ID del usuario desde el token de autenticación
    req.body.usuarioId = req.usuario?.id;

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
      farmaciaId: req.query.farmaciaId,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    };

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
      farmaciaId: req.query.farmaciaId,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    };

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