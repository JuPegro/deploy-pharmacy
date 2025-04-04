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

  // Crear la devolución con estado PENDIENTE por defecto
  const devolucion = await prisma.devolucion.create({
    data: {
      cantidad,
      motivo,
      farmaciaId,
      inventarioId,
      estado: 'PENDIENTE', // Estado por defecto
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

  return devolucion;
};

exports.obtenerDevoluciones = async (opciones = {}) => {
  const { 
    pagina = 1, 
    limite = 10, 
    farmaciaId,
    fechaInicio,
    fechaFin,
    estado
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

  if (estado) {
    where.estado = estado;
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
                id: true,
                codigo: true,
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

exports.aprobarDevolucion = async (id) => {
  // Verificar que la devolución existe y está en estado PENDIENTE
  const devolucion = await prisma.devolucion.findUnique({
    where: { id },
    include: {
      inventario: true
    }
  });

  if (!devolucion) {
    throw new AppError('Devolución no encontrada', 404);
  }

  if (devolucion.estado !== 'PENDIENTE') {
    throw new AppError(`La devolución ya ha sido ${devolucion.estado.toLowerCase()}`, 400);
  }

  // Crear transacción para garantizar integridad de datos
  return await prisma.$transaction(async (tx) => {
    // Actualizar estado de la devolución
    const devolucionActualizada = await tx.devolucion.update({
      where: { id },
      data: { estado: 'APROBADA' },
      include: {
        farmacia: true,
        inventario: {
          include: {
            medicamento: true
          }
        }
      }
    });

    // Incrementar el stock del inventario
    await tx.inventario.update({
      where: { id: devolucion.inventarioId },
      data: {
        stock: {
          increment: devolucion.cantidad
        }
      }
    });

    // Registrar movimiento de inventario
    await tx.movimientoInventario.create({
      data: {
        tipo: 'INGRESO',
        cantidad: devolucion.cantidad,
        inventarioId: devolucion.inventarioId,
        farmaciaId: devolucion.farmaciaId
      }
    });

    return devolucionActualizada;
  });
};

exports.rechazarDevolucion = async (id) => {
  // Verificar que la devolución existe y está en estado PENDIENTE
  const devolucion = await prisma.devolucion.findUnique({
    where: { id }
  });

  if (!devolucion) {
    throw new AppError('Devolución no encontrada', 404);
  }

  if (devolucion.estado !== 'PENDIENTE') {
    throw new AppError(`La devolución ya ha sido ${devolucion.estado.toLowerCase()}`, 400);
  }

  // Actualizar estado de la devolución
  return await prisma.devolucion.update({
    where: { id },
    data: { estado: 'RECHAZADA' },
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true
        }
      }
    }
  });
};

exports.obtenerResumenDevoluciones = async (opciones = {}) => {
  const { 
    farmaciaId,
    fechaInicio,
    fechaFin,
    estado
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

  if (estado) {
    where.estado = estado;
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

  // Obtener resumen por estado
  const resumenPorEstado = await prisma.$queryRaw`
    SELECT estado, COUNT(*) as cantidad
    FROM "Devolucion"
    WHERE ${farmaciaId ? prisma.sql`"farmaciaId" = ${farmaciaId}` : prisma.sql`1=1`}
    GROUP BY estado
  `;

  return {
    totalDevoluciones: resumen._count.id,
    cantidadTotal: resumen._sum.cantidad || 0,
    estadisticas: resumenPorEstado
  };
};