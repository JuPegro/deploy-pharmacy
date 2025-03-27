const medicamentoService = require('../services/medicamento.service');
const AppError = require('../utils/errorHandler');

// Obtener catálogo de medicamentos
exports.obtenerCatalogoMedicamentos = async (req, res, next) => {
  try {
    const medicamentos = await medicamentoService.obtenerCatalogoMedicamentos();
    
    res.status(200).json({
      status: 'success',
      results: medicamentos.length,
      data: {
        medicamentos
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un medicamento por ID
exports.obtenerMedicamentoPorId = async (req, res, next) => {
  try {
    const medicamento = await medicamentoService.obtenerMedicamentoPorId(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        medicamento
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear nuevo medicamento
exports.crearMedicamento = async (req, res, next) => {
  try {
    // Validar datos requeridos
    const { nombre, categoria } = req.body;
    
    if (!nombre || !categoria) {
      return next(new AppError('Nombre y categoría son requeridos', 400));
    }

    const medicamento = await medicamentoService.crearMedicamento(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        medicamento
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar medicamento
exports.actualizarMedicamento = async (req, res, next) => {
  try {
    const medicamento = await medicamentoService.actualizarMedicamento(
      req.params.id, 
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        medicamento
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar medicamento
exports.eliminarMedicamento = async (req, res, next) => {
  try {
    await medicamentoService.eliminarMedicamento(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};