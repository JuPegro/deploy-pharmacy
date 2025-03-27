const farmaciaService = require('../services/farmacia.service');
const AppError = require('../utils/errorHandler');

exports.crearFarmacia = async (req, res, next) => {
  try {
    const farmacia = await farmaciaService.crearFarmacia(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        farmacia
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerFarmacias = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta con valores por defecto
    const opciones = {
      pagina: parseInt(req.query.pagina) || 1,
      limite: parseInt(req.query.limite) || 10,
      busqueda: req.query.busqueda || '',
      ordenarPor: req.query.ordenarPor || 'nombre',
      ordenDireccion: req.query.ordenDireccion || 'asc'
    };

    // Obtener farmacias con paginación
    const resultado = await farmaciaService.obtenerFarmacias(opciones);

    res.status(200).json({
      status: 'success',
      results: resultado.farmacias.length,
      data: {
        farmacias: resultado.farmacias,
        paginacion: resultado.paginacion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerFarmacia = async (req, res, next) => {
  try {
    const farmacia = await farmaciaService.obtenerFarmacia(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        farmacia
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.actualizarFarmacia = async (req, res, next) => {
  try {
    const farmacia = await farmaciaService.actualizarFarmacia(
      req.params.id, 
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        farmacia
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.eliminarFarmacia = async (req, res, next) => {
  try {
    await farmaciaService.eliminarFarmacia(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};