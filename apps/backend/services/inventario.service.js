const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearInventario = async (inventarioData) => {
  // Validar datos requeridos
  const { farmaciaId, medicamentoId, stock, precio, vencimiento } = inventarioData;
  
  if (!farmaciaId || !medicamentoId) {
    throw new AppError('Farmacia y medicamento son requeridos', 400);
  }

  // Verificar que la farmacia y el medicamento existan
  const [farmaciaExiste, medicamentoExiste] = await Promise.all([
    prisma.farmacia.findUnique({ where: { id: farmaciaId } }),
    prisma.medicamento.findUnique({ where: { id: medicamentoId } })
  ]);

  if (!farmaciaExiste) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  if (!medicamentoExiste) {
    throw new AppError('Medicamento no encontrado', 404);
  }

  // Verificar que no exista ya un inventario para este medicamento en esta farmacia
  const inventarioExistente = await prisma.inventario.findFirst({
    where: {
      farmaciaId,
      medicamentoId
    }
  });

  if (inventarioExistente) {
    throw new AppError('Ya existe un inventario para este medicamento en esta farmacia', 400);
  }

  // Crear inventario
  return await prisma.inventario.create({
    data: {
      farmaciaId,
      medicamentoId,
      stock: stock || 0,
      stockMinimo: inventarioData.stockMinimo || 10,
      precio: precio || 0,
      vencimiento: vencimiento ? new Date(vencimiento) : new Date()
    },
    include: {
      farmacia: true,
      medicamento: true
    }
  });
};

exports.obtenerInventarios = async (opciones = {}) => {
  const { 
    pagina = 1, 
    limite = 10, 
    farmaciaId,
    medicamentoId,
    bajoStock = false
  } = opciones;

  // Preparar condiciones de búsqueda
  const where = {};
  
  if (farmaciaId) {
    where.farmaciaId = farmaciaId;
  }

  if (medicamentoId) {
    where.medicamentoId = medicamentoId;
  }

  if (bajoStock) {
    where.stock = {
      lte: prisma.inventario.fields.stockMinimo
    };
  }

  // Calcular offset para paginación
  const skip = (pagina - 1) * limite;

  // Obtener inventarios con paginación
  const [totalInventarios, inventarios] = await Promise.all([
    prisma.inventario.count({ where }),
    prisma.inventario.findMany({
      where,
      skip,
      take: limite,
      include: {
        farmacia: {
          select: {
            id: true,
            nombre: true
          }
        },
        medicamento: {
          select: {
            id: true,
            nombre: true,
            categoria: true
          }
        }
      },
      orderBy: {
        vencimiento: 'asc'
      }
    })
  ]);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(totalInventarios / limite);

  return {
    inventarios,
    paginacion: {
      paginaActual: pagina,
      totalPaginas,
      totalInventarios,
      limitePorPagina: limite
    }
  };
};

exports.obtenerInventario = async (id) => {
  const inventario = await prisma.inventario.findUnique({
    where: { id },
    include: {
      farmacia: true,
      medicamento: true,
      movimientos: {
        orderBy: {
          fecha: 'desc'
        },
        take: 10 // Últimos 10 movimientos
      },
      ventas: {
        take: 5, // Últimas 5 ventas
        orderBy: {
          fecha: 'desc'
        }
      }
    }
  });

  if (!inventario) {
    throw new AppError('Inventario no encontrado', 404);
  }

  return inventario;
};

exports.actualizarInventario = async (id, inventarioData) => {
  // Verificar existencia del inventario
  const inventarioExistente = await prisma.inventario.findUnique({
    where: { id }
  });

  if (!inventarioExistente) {
    throw new AppError('Inventario no encontrado', 404);
  }

  // Actualizar inventario
  return await prisma.inventario.update({
    where: { id },
    data: {
      stock: inventarioData.stock,
      stockMinimo: inventarioData.stockMinimo,
      precio: inventarioData.precio,
      vencimiento: inventarioData.vencimiento ? new Date(inventarioData.vencimiento) : undefined
    },
    include: {
      farmacia: true,
      medicamento: true
    }
  });
};

exports.eliminarInventario = async (id) => {
  // Verificar existencia del inventario
  const inventarioExistente = await prisma.inventario.findUnique({
    where: { id }
  });

  if (!inventarioExistente) {
    throw new AppError('Inventario no encontrado', 404);
  }

  // Verificar que no tenga ventas o movimientos asociados
  const [ventasCount, movimientosCount] = await Promise.all([
    prisma.venta.count({ where: { inventarioId: id } }),
    prisma.movimientoInventario.count({ where: { inventarioId: id } })
  ]);

  if (ventasCount > 0 || movimientosCount > 0) {
    throw new AppError('No se puede eliminar un inventario con ventas o movimientos asociados', 400);
  }

  // Eliminar inventario
  return await prisma.inventario.delete({
    where: { id }
  });
};

exports.ajustarStock = async (id, cantidad, tipoMovimiento) => {
  // Verificar existencia del inventario
  const inventario = await prisma.inventario.findUnique({
    where: { id }
  });

  if (!inventario) {
    throw new AppError('Inventario no encontrado', 404);
  }

  // Validar tipo de movimiento
  if (!['INGRESO', 'SALIDA', 'AJUSTE'].includes(tipoMovimiento)) {
    throw new AppError('Tipo de movimiento inválido', 400);
  }

  // Validar cantidad
  if (cantidad <= 0) {
    throw new AppError('La cantidad debe ser mayor que cero', 400);
  }

  // Realizar ajuste de stock en transacción
  return await prisma.$transaction(async (tx) => {
    // Calcular nuevo stock
    let nuevoStock = inventario.stock;
    switch (tipoMovimiento) {
      case 'INGRESO':
        nuevoStock += cantidad;
        break;
      case 'SALIDA':
        if (cantidad > inventario.stock) {
          throw new AppError('Cantidad de salida supera el stock disponible', 400);
        }
        nuevoStock -= cantidad;
        break;
      case 'AJUSTE':
        nuevoStock = cantidad;
        break;
    }

    // Registrar movimiento de inventario
    const movimiento = await tx.movimientoInventario.create({
      data: {
        tipo: tipoMovimiento,
        cantidad,
        inventarioId: id,
        farmaciaId: inventario.farmaciaId
      }
    });

    // Actualizar stock
    const inventarioActualizado = await tx.inventario.update({
      where: { id },
      data: { stock: nuevoStock },
      include: {
        farmacia: true,
        medicamento: true
      }
    });

    return {
      inventario: inventarioActualizado,
      movimiento
    };
  });
};