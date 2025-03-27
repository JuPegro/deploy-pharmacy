const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearVenta = async (ventaData) => {
  // Verificar que todos los datos requeridos estén presentes
  const { 
    cantidad, 
    farmaciaId, 
    precioUnitario, 
    inventarioId, 
    usuarioId 
  } = ventaData;

  if (!cantidad || !farmaciaId || !precioUnitario || !inventarioId) {
    throw new AppError('Datos de venta incompletos', 400);
  }

  // Crear transacción para garantizar integridad de datos
  return await prisma.$transaction(async (tx) => {
    // Verificar el inventario
    const inventario = await tx.inventario.findUnique({
      where: { id: inventarioId },
      include: { medicamento: true }
    });

    if (!inventario) {
      throw new AppError('Inventario no encontrado', 404);
    }

    // Verificar stock disponible
    if (inventario.stock < cantidad) {
      throw new AppError('No hay suficiente stock disponible', 400);
    }

    // Registrar la venta
    const venta = await tx.venta.create({
      data: {
        cantidad,
        farmaciaId,
        precioUnitario,
        inventarioId,
        usuarioId: usuarioId || undefined,
        fecha: new Date()
      },
      include: {
        farmacia: true,
        inventario: {
          include: {
            medicamento: true
          }
        },
        vendedor: true
      }
    });

    // Actualizar stock del inventario
    await tx.inventario.update({
      where: { id: inventarioId },
      data: { 
        stock: {
          decrement: cantidad
        }
      }
    });

    // Registrar movimiento de inventario
    await tx.movimientoInventario.create({
      data: {
        tipo: 'SALIDA',
        cantidad,
        inventarioId,
        farmaciaId,
        usuarioId: usuarioId || undefined
      }
    });

    return venta;
  });
};

exports.obtenerVentas = async (opciones = {}) => {
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

  // Obtener ventas con paginación
  const [totalVentas, ventas] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({
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
        },
        vendedor: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })
  ]);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(totalVentas / limite);

  return {
    ventas,
    paginacion: {
      paginaActual: pagina,
      totalPaginas,
      totalVentas,
      limitePorPagina: limite
    }
  };
};

exports.obtenerVenta = async (id) => {
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true
        }
      },
      vendedor: true
    }
  });

  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  return venta;
};

exports.obtenerResumenVentas = async (opciones = {}) => {
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

  // Calcular resumen de ventas
  const resumen = await prisma.venta.aggregate({
    where,
    _sum: {
      cantidad: true,
      precioUnitario: true
    },
    _count: {
      id: true
    }
  });

  return {
    totalVentas: resumen._count.id,
    cantidadTotal: resumen._sum.cantidad,
    ingresoTotal: resumen._sum.precioUnitario
  };
};