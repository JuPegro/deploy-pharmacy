// src/services/movimientoInventario.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearMovimientoInventario = async (movimientoData) => {
  // Obtener el medicamento
  const medicamento = await prisma.medicamento.findUnique({
    where: { id: movimientoData.medicamentoId }
  });

  if (!medicamento) {
    throw new AppError('No se encontró el medicamento', 404);
  }

  // Crear transacción para garantizar integridad de datos
  return await prisma.$transaction(async (prisma) => {
    // Registrar el movimiento
    const movimiento = await prisma.movimientoInventario.create({
      data: movimientoData
    });

    // Actualizar el stock del medicamento según el tipo de movimiento
    let nuevoStock = medicamento.stock;
    if (movimientoData.tipo === 'INGRESO') {
      nuevoStock += movimientoData.cantidad;
    } else if (movimientoData.tipo === 'SALIDA') {
      if (medicamento.stock < movimientoData.cantidad) {
        throw new AppError('No hay suficiente stock disponible', 400);
      }
      nuevoStock -= movimientoData.cantidad;
    }

    await prisma.medicamento.update({
      where: { id: movimientoData.medicamentoId },
      data: { stock: nuevoStock }
    });

    return movimiento;
  });
};

// exports.obtenerMovimientosInventario = async () => {
//   return await prisma.movimientoInventario.findMany({
//     include: {
//       medicamento: true,
//       farmacia: true
//     }
//   });
// };

exports.obtenerMovimientosInventario = async () => {
  return await prisma.movimientoInventario.findMany({
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true  // Incluir medicamento a través del inventario
        }
      },
      registradoPor: true
    }
  });
};

exports.obtenerMovimientoInventario = async (id) => {
  return await prisma.movimientoInventario.findUnique({
    where: { id },
    include: {
      medicamento: true,
      farmacia: true
    }
  });
};