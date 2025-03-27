const ventaService = require('../services/venta.service');
const AppError = require('../utils/errorHandler');

exports.crearVenta = async (req, res, next) => {
  try {
    // Agregar el ID del usuario desde el token de autenticación
    req.body.usuarioId = req.usuario?.id;

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
      farmaciaId: req.query.farmaciaId,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    };

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
      farmaciaId: req.query.farmaciaId,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    };

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