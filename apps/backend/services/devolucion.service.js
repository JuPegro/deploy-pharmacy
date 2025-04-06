// apps/backend/services/devolucion.service.js - versión actualizada
const { prisma } = require('../config');
const { sql } = require('@prisma/client');
const AppError = require('../utils/errorHandler');

exports.crearDevolucion = async (devolucionData) => {
  // Validar datos requeridos
  const {
    cantidad,
    motivo,
    farmaciaId,
    inventarioId,
    usuarioId
  } = devolucionData;

  if (!cantidad || !motivo || !farmaciaId || !inventarioId) {
    throw new AppError('Datos de devolución incompletos', 400);
  }

  // Verificar que el inventario existe
  const inventario = await prisma.inventario.findUnique({
    where: { id: inventarioId },
    include: {
      medicamento: true
    }
  });

  if (!inventario) {
    throw new AppError('Inventario no encontrado', 404);
  }

  // Verificar que el inventario pertenece a la farmacia
  if (inventario.farmaciaId !== farmaciaId) {
    throw new AppError('El inventario no pertenece a esta farmacia', 400);
  }

  // Fecha actual
  const fechaActual = new Date();

  // Extraer mes y año
  const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
  const anio = fechaActual.getFullYear();

  // Crear la devolución con estado PENDIENTE por defecto
  const devolucion = await prisma.devolucion.create({
    data: {
      cantidad,
      motivo,
      farmaciaId,
      inventarioId,
      estado: 'PENDIENTE', // Estado por defecto
      fecha: fechaActual,
      mes,
      anio,
      usuarioId: usuarioId || undefined // Registrar quién hizo la devolución
    },
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true
        }
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true
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
    estado,
    mes,
    anio
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

  // Filtrar por mes y año si se especifican
  if (mes) {
    where.mes = parseInt(mes);
  }

  if (anio) {
    where.anio = parseInt(anio);
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
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
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
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      },
      aprobadoPor: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      }
    }
  });

  if (!devolucion) {
    throw new AppError('Devolución no encontrada', 404);
  }

  return devolucion;
};

exports.aprobarDevolucion = async (id, adminId) => {
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

  // Fecha de aprobación
  const fechaAprobacion = new Date();

  // Crear transacción para garantizar integridad de datos
  return await prisma.$transaction(async (tx) => {
    // Actualizar estado de la devolución
    const devolucionActualizada = await tx.devolucion.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        aprobadoPorId: adminId,
        fechaAprobacion
      },
      include: {
        farmacia: true,
        inventario: {
          include: {
            medicamento: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
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
        farmaciaId: devolucion.farmaciaId,
        usuarioId: adminId,
        observacion: `Devolución #${id} aprobada`,
        fecha: fechaAprobacion
      }
    });

    return devolucionActualizada;
  });
};

exports.rechazarDevolucion = async (id, motivo, adminId) => {
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

  // Fecha de rechazo
  const fechaAprobacion = new Date();

  // Actualizar estado de la devolución
  return await prisma.devolucion.update({
    where: { id },
    data: {
      estado: 'RECHAZADA',
      aprobadoPorId: adminId,
      fechaAprobacion,
      motivoRechazo: motivo
    },
    include: {
      farmacia: true,
      inventario: {
        include: {
          medicamento: true
        }
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      },
      aprobadoPor: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      }
    }
  });
};


// Corrección para el método obtenerResumenDevoluciones en devolucion.service.js
exports.obtenerResumenDevoluciones = async (opciones = {}) => {
  const {
    farmaciaId,
    fechaInicio,
    fechaFin,
    estado,
    mes,
    anio
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

  // Filtrar por mes y año si se especifican
  if (mes) {
    where.mes = parseInt(mes);
  }

  if (anio) {
    where.anio = parseInt(anio);
  }

  try {
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

    // Asegurarse de que los valores numéricos no sean nulos
    const totalDevoluciones = Number(resumen._count.id || 0);
    const cantidadTotal = Number(resumen._sum.cantidad || 0);

    // Construcción segura del WHERE para resumen por estado - CORREGIDO
    let whereSqlEstado = '';
    
    // Crear un array para las condiciones
    const condicionesEstado = [];
    
    if (farmaciaId) {
      condicionesEstado.push(`"farmaciaId" = '${farmaciaId}'`);
    }
    if (mes) {
      condicionesEstado.push(`mes = ${parseInt(mes)}`);
    }
    if (anio) {
      condicionesEstado.push(`anio = ${parseInt(anio)}`);
    }
    
    // Construir la cláusula WHERE manualmente
    if (condicionesEstado.length > 0) {
      whereSqlEstado = `WHERE ${condicionesEstado.join(' AND ')}`;
    }

    let resumenPorEstado = await prisma.$queryRawUnsafe(
      `SELECT estado, COUNT(*) as cantidad
       FROM "Devolucion"
       ${whereSqlEstado}
       GROUP BY estado`
    );

    // Si no hay resultados, devolver un array vacío
    if (!resumenPorEstado) resumenPorEstado = [];

    // Convertir BigInt a Number en resumenPorEstado
    resumenPorEstado = resumenPorEstado.map(item => ({
      ...item,
      cantidad: Number(item.cantidad)
    }));

    // Obtener resumen por mes si se solicita un año específico y no un mes
    let devolucionesPorMes = [];

    if (anio && !mes) {
      // Construir la consulta para devolucionesPorMes manualmente también
      const condicionesMes = [`anio = ${parseInt(anio)}`];
      
      if (farmaciaId) {
        condicionesMes.push(`"farmaciaId" = '${farmaciaId}'`);
      }
      
      const whereMes = `WHERE ${condicionesMes.join(' AND ')}`;

      devolucionesPorMes = await prisma.$queryRawUnsafe(
        `SELECT mes, estado, COUNT(*) as cantidad
         FROM "Devolucion"
         ${whereMes}
         GROUP BY mes, estado
         ORDER BY mes, estado`
      );

      // Si no hay resultados, usar array vacío
      if (!devolucionesPorMes) devolucionesPorMes = [];

      // Convertir BigInt a Number
      devolucionesPorMes = devolucionesPorMes.map(item => ({
        ...item,
        cantidad: Number(item.cantidad)
      }));
    }

    return {
      totalDevoluciones,
      cantidadTotal,
      estadisticas: resumenPorEstado,
      devolucionesPorMes: devolucionesPorMes.length > 0 ? devolucionesPorMes : undefined
    };
  } catch (error) {
    console.error('Error en obtenerResumenDevoluciones:', error);
    throw new AppError('Error al obtener el resumen de devoluciones: ' + error.message, 500);
  }
};

// exports.obtenerResumenDevoluciones = async (opciones = {}) => {
//   const {
//     farmaciaId,
//     fechaInicio,
//     fechaFin,
//     estado,
//     mes,
//     anio
//   } = opciones;

//   const where = {};

//   if (farmaciaId) {
//     where.farmaciaId = farmaciaId;
//   }

//   if (fechaInicio && fechaFin) {
//     where.fecha = {
//       gte: new Date(fechaInicio),
//       lte: new Date(fechaFin)
//     };
//   }

//   if (estado) {
//     where.estado = estado;
//   }

//   // Calcular resumen de devoluciones
//   const resumen = await prisma.devolucion.aggregate({
//     where,
//     _sum: {
//       cantidad: true
//     },
//     _count: {
//       id: true
//     }
//   });

//   // Construcción segura del WHERE para resumen por estado
//   const condicionesEstado = [];
//   if (farmaciaId) {
//     condicionesEstado.push(sql`"farmaciaId" = ${farmaciaId}`);
//   }
//   if (mes) {
//     condicionesEstado.push(sql`mes = ${parseInt(mes)}`);
//   }
//   if (anio) {
//     condicionesEstado.push(sql`anio = ${parseInt(anio)}`);
//   }

//   const whereSqlEstado = condicionesEstado.length > 0
//     ? sql`WHERE ${sql.join(condicionesEstado, sql` AND `)}`
//     : sql``;

//   let resumenPorEstado = await prisma.$queryRaw(
//     sql`
//       SELECT estado, COUNT(*) as cantidad
//       FROM "Devolucion"
//       ${whereSqlEstado}
//       GROUP BY estado
//     `
//   );

//   // Convertir BigInt a Number en resumenPorEstado
//   resumenPorEstado = resumenPorEstado.map(item => ({
//     ...item,
//     cantidad: Number(item.cantidad)
//   }));

//   // Obtener resumen por mes si se solicita un año específico y no un mes
//   let devolucionesPorMes = [];

//   if (anio && !mes) {
//     const condicionesMes = [sql`anio = ${parseInt(anio)}`];
//     if (farmaciaId) {
//       condicionesMes.push(sql`"farmaciaId" = ${farmaciaId}`);
//     }

//     devolucionesPorMes = await prisma.$queryRaw(
//       sql`
//         SELECT mes, estado, COUNT(*) as cantidad
//         FROM "Devolucion"
//         WHERE ${sql.join(condicionesMes, sql` AND `)}
//         GROUP BY mes, estado
//         ORDER BY mes, estado
//       `
//     );

//     // Convertir BigInt a Number
//     devolucionesPorMes = devolucionesPorMes.map(item => ({
//       ...item,
//       cantidad: Number(item.cantidad)
//     }));
//   }

//   return {
//     totalDevoluciones: Number(resumen._count.id),
//     cantidadTotal: Number(resumen._sum.cantidad || 0),
//     estadisticas: resumenPorEstado,
//     devolucionesPorMes: devolucionesPorMes.length > 0 ? devolucionesPorMes : undefined
//   };
// };

// Nuevo método para obtener devoluciones agrupadas por mes y año
exports.obtenerDevolucionesPorMesAnio = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  // Obtener resumen de devoluciones agrupadas por mes y año
  const devolucionesPorMesAnio = await prisma.$queryRaw`
    SELECT 
      anio, 
      mes, 
      estado,
      COUNT(*) as total_devoluciones,
      SUM(cantidad) as unidades_devueltas
    FROM "Devolucion"
    WHERE "farmaciaId" = ${farmaciaId}
    GROUP BY anio, mes, estado
    ORDER BY anio DESC, mes DESC, estado
  `;

  return devolucionesPorMesAnio;
};