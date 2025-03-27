const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

// Obtener todos los medicamentos del catálogo global
exports.obtenerCatalogoMedicamentos = async () => {
  try {
    return await prisma.medicamento.findMany({
      include: {
        inventarios: {
          include: {
            farmacia: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener catálogo de medicamentos:', error);
    throw new AppError('No se pudo obtener el catálogo de medicamentos', 500);
  }
};

// Obtener un medicamento específico por ID
exports.obtenerMedicamentoPorId = async (id) => {
  try {
    const medicamento = await prisma.medicamento.findUnique({
      where: { id },
      include: {
        inventarios: {
          include: {
            farmacia: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!medicamento) {
      throw new AppError('Medicamento no encontrado', 404);
    }

    return medicamento;
  } catch (error) {
    console.error('Error al obtener medicamento:', error);
    throw error;
  }
};

// Crear un nuevo medicamento en el catálogo
exports.crearMedicamento = async (medicamentoData) => {
  try {
    return await prisma.medicamento.create({
      data: {
        nombre: medicamentoData.nombre,
        categoria: medicamentoData.categoria,
        descripcion: medicamentoData.descripcion,
        principioActivo: medicamentoData.principioActivo,
        presentacion: medicamentoData.presentacion,
        requiereReceta: medicamentoData.requiereReceta || false
      }
    });
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    throw new AppError('No se pudo crear el medicamento', 500);
  }
};

// Actualizar un medicamento existente
exports.actualizarMedicamento = async (id, medicamentoData) => {
  try {
    return await prisma.medicamento.update({
      where: { id },
      data: {
        nombre: medicamentoData.nombre,
        categoria: medicamentoData.categoria,
        descripcion: medicamentoData.descripcion,
        principioActivo: medicamentoData.principioActivo,
        presentacion: medicamentoData.presentacion,
        requiereReceta: medicamentoData.requiereReceta
      }
    });
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    
    if (error.code === 'P2025') {
      throw new AppError('Medicamento no encontrado', 404);
    }
    
    throw new AppError('No se pudo actualizar el medicamento', 500);
  }
};

// Eliminar un medicamento del catálogo
exports.eliminarMedicamento = async (id) => {
  try {
    // Verificar si hay inventarios asociados
    const inventariosAsociados = await prisma.inventario.count({
      where: { medicamentoId: id }
    });

    if (inventariosAsociados > 0) {
      throw new AppError('No se puede eliminar un medicamento con inventarios asociados', 400);
    }

    return await prisma.medicamento.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    
    if (error.code === 'P2025') {
      throw new AppError('Medicamento no encontrado', 404);
    }
    
    throw error;
  }
};