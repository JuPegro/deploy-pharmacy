const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearDevolucion = async (devolucionData) => {
  // Validar datos requeridos
  const { 
    cantidad, 
    motivo, 
    farmaciaId, 
    inventarioId 
  } = devolucionData;

  if (!cantidad || !motivo || !farmaciaId || !inventarioId) {
    throw new AppError('Datos de devolución incompletos', 400);
  }

  // Crear transacción para garantizar integridad de datos
  return await prisma.$transaction(async (tx) => {
    // Verificar el inventario
    const inventario = await tx.inventario.findUnique({
      where: { id: inventarioId },
      include: { 
        medicamento: true,
        farmacia: true 
      }
    });

    if (!inventario) {
      throw new AppError('Inventario no encontrado', 404);
    }

    // Validar que la cantidad de devolución no supere la venta original
    if (cantidad <= 0) {
      throw new AppError('La cantidad de devolución debe ser mayor a cero', 400);
    }

    // Registrar la devolución
    const devolucion = await tx.devolucion.create({
      data: {
        cantidad,
        motivo,
        farmaciaId,
        inventarioId,
        fecha: new Date()
      },
      include: {
        farmacia: true,
        inventario: {
          include: {
            medicamento: true
          }
        }
      }
    });

    // Actualizar stock del inventario
    await tx.inventario.update({
      where: { id: inventarioId },
      data: {
        stock: {
          increment: cantidad
        }
      }
    });

    // Registrar movimiento de inventario
    await tx.movimientoInventario.create({
      data: {
        tipo: 'INGRESO',
        cantidad,
        inventarioId,
        farmaciaId
      }
    });

    return devolucion;
  });
};

exports.obtenerDevoluciones = async (opciones = {}) => {
  const { 
    pagina = 1, 
    limite = 10, 
    farmaciaId,
    fechaInicio,
    fechaFin
  } = opciones;

  // Preparar condiciones de búsqueda
  const where = {};
  
  if (farmaciaId) {
    where.farmaciaId = farmaciaId;
  }

  if (fechaInicio && fechaFin) {
    where.fecha = {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    };
  }

  // Calcular offset para paginación
  const skip = (pagina - 1) * limite;

  // Obtener devoluciones con paginación
  const [totalDevoluciones, devoluciones] = await Promise.all([
    prisma.devolucion.count({ where }),
    prisma.devolucion.findMany({
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
        inventario: {
          include: {
            medicamento: {
              select: {
                nombre: true,
                categoria: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })
  ]);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(totalDevoluciones / limite);

  return {
    devoluciones,
    paginacion: {
      paginaActual: pagina,
      totalPaginas,
      totalDevoluciones,
      limitePorPagina: limite
    }
  };
};

exports.obtenerDevolucion = async (id) => {
  const devolucion = await prisma.devolucion.findUnique({
    where: { id },
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true
        }
      }
    }
  });

  if (!devolucion) {
    throw new AppError('Devolución no encontrada', 404);
  }

  return devolucion;
};

exports.obtenerResumenDevoluciones = async (opciones = {}) => {
  const { 
    farmaciaId,
    fechaInicio,
    fechaFin
  } = opciones;

  const where = {};
  
  if (farmaciaId) {
    where.farmaciaId = farmaciaId;
  }

  if (fechaInicio && fechaFin) {
    where.fecha = {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    };
  }

  // Calcular resumen de devoluciones
  const resumen = await prisma.devolucion.aggregate({
    where,
    _sum: {
      cantidad: true
    },
    _count: {
      id: true
    }
  });

  return {
    totalDevoluciones: resumen._count.id,
    cantidadTotal: resumen._sum.cantidad || 0
  };
};