const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

// Función para generar un código único para medicamentos
const generarCodigoMedicamento = async () => {
  // Prefijo MED seguido de 8 dígitos aleatorios
  const codigo = 'MED' + Math.floor(10000000 + Math.random() * 90000000);
  
  // Verificar que el código no existe
  const medicamentoExistente = await prisma.medicamento.findUnique({
    where: { codigo }
  });
  
  // Si ya existe, generar otro recursivamente
  if (medicamentoExistente) {
    return generarCodigoMedicamento();
  }
  
  return codigo;
};

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
    // Generar código único si no se proporciona
    const codigo = medicamentoData.codigo || await generarCodigoMedicamento();
    
    // Verificar si el código ya existe
    if (medicamentoData.codigo) {
      const medicamentoExistente = await prisma.medicamento.findUnique({
        where: { codigo }
      });
      
      if (medicamentoExistente) {
        throw new AppError('El código de medicamento ya está en uso', 400);
      }
    }
    
    return await prisma.medicamento.create({
      data: {
        codigo,
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
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError('No se pudo crear el medicamento', 500);
  }
};

// Actualizar un medicamento existente
exports.actualizarMedicamento = async (id, medicamentoData) => {
  try {
    // Verificar que el código no esté siendo usado por otro medicamento si se intenta actualizar
    if (medicamentoData.codigo) {
      const medicamentoExistente = await prisma.medicamento.findUnique({
        where: { codigo: medicamentoData.codigo }
      });
      
      if (medicamentoExistente && medicamentoExistente.id !== id) {
        throw new AppError('El código de medicamento ya está en uso por otro medicamento', 400);
      }
    }
    
    return await prisma.medicamento.update({
      where: { id },
      data: {
        nombre: medicamentoData.nombre,
        categoria: medicamentoData.categoria,
        descripcion: medicamentoData.descripcion,
        principioActivo: medicamentoData.principioActivo,
        presentacion: medicamentoData.presentacion,
        requiereReceta: medicamentoData.requiereReceta,
        codigo: medicamentoData.codigo // Solo actualiza si se proporciona
      }
    });
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
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
    
    if (error instanceof AppError) {
      throw error;
    }
    
    if (error.code === 'P2025') {
      throw new AppError('Medicamento no encontrado', 404);
    }
    
    throw error;
  }
};