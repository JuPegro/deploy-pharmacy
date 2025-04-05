// apps/backend/services/venta.service.js - versión actualizada
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

  // Crear fecha actual
  const fechaActual = new Date();
  
  // Extraer mes y año para facilitar las consultas
  const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
  const anio = fechaActual.getFullYear();

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

    // Registrar la venta con mes y año explícitos
    const venta = await tx.venta.create({
      data: {
        cantidad,
        farmaciaId,
        precioUnitario,
        inventarioId,
        usuarioId: usuarioId || undefined,
        fecha: fechaActual,
        mes,
        anio
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
        usuarioId: usuarioId || undefined,
        fecha: fechaActual
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
    fechaFin,
    mes,
    anio
  } = opciones;

  // Preparar condiciones de búsqueda
  const where = {};
  
  if (farmaciaId) {
    where.farmaciaId = farmaciaId;
  }

  // Filtrar por fecha si se especifica
  if (fechaInicio && fechaFin) {
    where.fecha = {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    };
  }
  
  // Filtrar por mes y año si se especifican
  if (mes) {
    where.mes = parseInt(mes);
  }
  
  if (anio) {
    where.anio = parseInt(anio);
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
                id: true,
                codigo: true,
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
    fechaFin,
    mes,
    anio
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
  
  // Filtrar por mes y año si se especifican
  if (mes) {
    where.mes = parseInt(mes);
  }
  
  if (anio) {
    where.anio = parseInt(anio);
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
  
  // Obtener resumen por mes si se solicita un año específico
  let ventasPorMes = [];
  if (anio && !mes) {
    // Consulta agrupada por mes para el año especificado
    ventasPorMes = await prisma.$queryRaw`
      SELECT mes, SUM(cantidad) as cantidad_total, SUM(cantidad * "precioUnitario") as monto_total
      FROM "Venta"
      WHERE anio = ${parseInt(anio)}
      ${farmaciaId ? prisma.sql`AND "farmaciaId" = ${farmaciaId}` : prisma.sql``}
      GROUP BY mes
      ORDER BY mes
    `;
  }

  return {
    totalVentas: resumen._count.id,
    cantidadTotal: resumen._sum.cantidad || 0,
    ingresoTotal: resumen._sum.precioUnitario || 0,
    ventasPorMes: ventasPorMes.length > 0 ? ventasPorMes : undefined
  };
};

// Nuevo método para obtener ventas agrupadas por mes y año
exports.obtenerVentasPorMesAnio = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  // Obtener resumen de ventas agrupadas por mes y año
  const ventasPorMesAnio = await prisma.$queryRaw`
    SELECT 
      anio, 
      mes, 
      COUNT(*) as total_ventas,
      SUM(cantidad) as unidades_vendidas,
      SUM(cantidad * "precioUnitario") as monto_total
    FROM "Venta"
    WHERE "farmaciaId" = ${farmaciaId}
    GROUP BY anio, mes
    ORDER BY anio DESC, mes DESC
  `;

  return ventasPorMesAnio;
};