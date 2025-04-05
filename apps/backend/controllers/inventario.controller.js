// apps/backend/controllers/inventario.controller.js
const inventarioService = require('../services/inventario.service');
const AppError = require('../utils/errorHandler');

exports.crearInventario = async (req, res, next) => {
  try {
    // Solo los administradores pueden crear inventarios
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para crear inventarios', 403));
    }

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
      medicamentoId: req.query.medicamentoId,
      bajoStock: req.query.bajoStock === 'true'
    };

    // Si es usuario de farmacia, filtrar solo por su farmacia activa
    if (req.usuario?.rol === 'FARMACIA') {
      if (!req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene una farmacia activa asignada', 400));
      }
      opciones.farmaciaId = req.usuario.farmaciaActivaId;
    } else {
      // Para administradores, se puede filtrar por farmacia específica
      opciones.farmaciaId = req.query.farmaciaId;
    }

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
    
    // Si es usuario de farmacia, verificar que pertenece a su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && 
        inventario.farmaciaId !== req.usuario.farmaciaActivaId) {
      return next(new AppError('No tiene acceso a este inventario', 403));
    }
    
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
    // Obtener el inventario primero para verificar permisos
    const inventarioExistente = await inventarioService.obtenerInventario(req.params.id);
    
    // Si es usuario de farmacia, verificar que pertenece a su farmacia activa
    if (req.usuario?.rol === 'FARMACIA') {
      if (inventarioExistente.farmaciaId !== req.usuario.farmaciaActivaId) {
        return next(new AppError('No tiene acceso a este inventario', 403));
      }
      
      // Usuarios de farmacia solo pueden actualizar ciertos campos
      const datosPermitidos = {};
      if (req.body.stockMinimo !== undefined) datosPermitidos.stockMinimo = req.body.stockMinimo;
      
      const inventario = await inventarioService.actualizarInventario(req.params.id, datosPermitidos);
      return res.status(200).json({
        status: 'success',
        data: {
          inventario
        }
      });
    }
    
    // Para administradores, permitir actualización completa
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
    // Solo los administradores pueden eliminar inventarios
    if (req.usuario?.rol !== 'ADMIN') {
      return next(new AppError('No tiene permisos para eliminar inventarios', 403));
    }
    
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
    
    // Obtener el inventario primero para verificar permisos
    const inventarioExistente = await inventarioService.obtenerInventario(req.params.id);
    
    // Si es usuario de farmacia, verificar que pertenece a su farmacia activa
    if (req.usuario?.rol === 'FARMACIA' && 
        inventarioExistente.farmaciaId !== req.usuario.farmaciaActivaId) {
      return next(new AppError('No tiene acceso a este inventario', 403));
    }
    
    const resultado = await inventarioService.ajustarStock(
      req.params.id, 
      cantidad, 
      tipoMovimiento,
      req.usuario.id
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