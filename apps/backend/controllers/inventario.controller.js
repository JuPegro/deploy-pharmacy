const inventarioService = require('../services/inventario.service');
const AppError = require('../utils/errorHandler');

exports.crearInventario = async (req, res, next) => {
  try {
    const inventario = await inventarioService.crearInventario(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        inventario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerInventarios = async (req, res, next) => {
  try {
    const opciones = {
      pagina: parseInt(req.query.pagina) || 1,
      limite: parseInt(req.query.limite) || 10,
      farmaciaId: req.query.farmaciaId,
      medicamentoId: req.query.medicamentoId,
      bajoStock: req.query.bajoStock === 'true'
    };

    const resultado = await inventarioService.obtenerInventarios(opciones);

    res.status(200).json({
      status: 'success',
      results: resultado.inventarios.length,
      data: {
        inventarios: resultado.inventarios,
        paginacion: resultado.paginacion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerInventario = async (req, res, next) => {
  try {
    const inventario = await inventarioService.obtenerInventario(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        inventario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.actualizarInventario = async (req, res, next) => {
  try {
    const inventario = await inventarioService.actualizarInventario(
      req.params.id, 
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        inventario
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.eliminarInventario = async (req, res, next) => {
  try {
    await inventarioService.eliminarInventario(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

exports.ajustarStock = async (req, res, next) => {
  try {
    const { cantidad, tipoMovimiento } = req.body;
    
    const resultado = await inventarioService.ajustarStock(
      req.params.id, 
      cantidad, 
      tipoMovimiento
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        inventario: resultado.inventario,
        movimiento: resultado.movimiento
      }
    });
  } catch (error) {
    next(error);
  }
};